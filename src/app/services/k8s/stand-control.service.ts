import httpStatus from "http-status"

import { DB } from "@/app/database"
import { ScaleAction, StandAccess, StandRuntimeState, WorkloadKind } from "@/interfaces/stand-control.interface"
import { StandKind } from "@/interfaces/stand.interface"

import { ClusterErrorReason, ClusterRequestError, isForbidden } from "./http"

import type { ClusterWorkload, StandClusterClient } from "./cluster.client"
import type { MetricsClient, PrometheusSample } from "./prometheus.client"
import type { StandAttributes } from "@/app/database/interfaces/stand.interface"
import type { BaseUserResponse } from "@/interfaces/auth.interface"
import type {
  ClusterResources,
  ClusterResourcesResponse,
  DeleteStandResponse,
  ScaleFailure,
  ScaleResponse,
  StandApplicationItem,
  StandPermissions,
  StandResources,
  StandStateResponse,
  StandWorkloadItem,
  WorkloadRef
} from "@/interfaces/stand-control.interface"

export type ControlResult<T> = { success: true; data: T } | { success: false; error: string; code: number }

export interface StandControlDependencies {
  cluster: StandClusterClient
  metrics: MetricsClient
  deleteEnabled: boolean
  selfDeployment: string
}

export const STOP_FIELD_MANAGER = "testgrid"
export const START_FIELD_MANAGER = "testgrid-start"
export const NO_ACCESS_MESSAGE = "No access, re-run bin/dev stand up"

const DEFAULT_START_REPLICAS = 1
const BYTES_IN_GIB = 1024 ** 3
const NO_SCALING = 1
const VALUE_PRECISION = 100
const DNS_LABEL = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/

const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error))

const failure = (error: string, code: number): ControlResult<never> => ({ success: false, error, code })

const clusterFailure = (error: Error): ControlResult<never> => {
  if (isForbidden(error)) return failure(`${NO_ACCESS_MESSAGE}: ${error.message}`, httpStatus.FORBIDDEN)
  if (error instanceof ClusterRequestError && error.reason === ClusterErrorReason.NotFound)
    return failure(error.message, httpStatus.NOT_FOUND)

  return failure(error.message, httpStatus.BAD_GATEWAY)
}

const imageTag = (image: string): string => image.slice(image.lastIndexOf("/") + 1).split(":")[1] || "latest"

const isDefinitelyRejected = (error: Error): boolean =>
  error instanceof ClusterRequestError &&
  [ClusterErrorReason.Unauthorized, ClusterErrorReason.Forbidden, ClusterErrorReason.NotFound].includes(error.reason)

interface ResourceQuery<T> {
  field: keyof T
  label: string
  divisor: number
  promql: string
}

const liveRequests = (resource: string, namespace?: string): string => {
  const scope = namespace ? `namespace="${namespace}",` : ""

  return `sum(kube_pod_container_resource_requests{${scope}resource="${resource}"} * on (namespace, pod) group_left () (max by (namespace, pod) (kube_pod_status_phase{${scope}phase=~"Pending|Running"}) == 1))`
}

const standResourceQueries = (namespace: string): Array<ResourceQuery<StandResources>> => [
  {
    field: "cpu_used_cores",
    label: "CPU used",
    divisor: NO_SCALING,
    promql: `sum(rate(container_cpu_usage_seconds_total{namespace="${namespace}",container!=""}[5m]))`
  },
  { field: "cpu_requested_cores", label: "CPU requested", divisor: NO_SCALING, promql: liveRequests("cpu", namespace) },
  {
    field: "memory_used_gib",
    label: "memory used",
    divisor: BYTES_IN_GIB,
    promql: `sum(container_memory_working_set_bytes{namespace="${namespace}",container!=""})`
  },
  {
    field: "memory_requested_gib",
    label: "memory requested",
    divisor: BYTES_IN_GIB,
    promql: liveRequests("memory", namespace)
  }
]

const CLUSTER_RESOURCE_QUERIES: Array<ResourceQuery<ClusterResources>> = [
  { field: "cpu_requested_cores", label: "cluster CPU requested", divisor: NO_SCALING, promql: liveRequests("cpu") },
  {
    field: "cpu_allocatable_cores",
    label: "cluster CPU allocatable",
    divisor: NO_SCALING,
    promql: 'sum(kube_node_status_allocatable{resource="cpu"})'
  },
  {
    field: "memory_requested_gib",
    label: "cluster memory requested",
    divisor: BYTES_IN_GIB,
    promql: liveRequests("memory")
  },
  {
    field: "memory_allocatable_gib",
    label: "cluster memory allocatable",
    divisor: BYTES_IN_GIB,
    promql: 'sum(kube_node_status_allocatable{resource="memory"})'
  }
]

const roundedValue = (samples: Array<PrometheusSample>, divisor: number): number =>
  Math.round(((samples[0]?.value || 0) / divisor) * VALUE_PRECISION) / VALUE_PRECISION

const resourcesOf = <T>(
  queries: Array<ResourceQuery<T>>,
  results: Array<Array<PrometheusSample> | Error>,
  warnings: Array<string>
): T =>
  queries.reduce((resources, query, index) => {
    const result = results[index]
    if (result instanceof Error) warnings.push(`Prometheus ${query.label}: ${result.message}`)

    return { ...resources, [query.field]: result instanceof Error ? null : roundedValue(result, query.divisor) }
  }, {} as T)

const isSameWorkload = (a: WorkloadRef, b: WorkloadRef): boolean => a.kind === b.kind && a.name === b.name

const runtimeStateOf = (workloads: Array<ClusterWorkload>): StandRuntimeState => {
  if (!workloads.length) return StandRuntimeState.Degraded
  if (workloads.every(workload => workload.desired === 0)) return StandRuntimeState.Stopped
  if (workloads.some(workload => workload.ready < workload.desired)) return StandRuntimeState.Degraded

  return StandRuntimeState.Running
}

export class StandControlService {
  private readonly deps: StandControlDependencies

  constructor(deps: StandControlDependencies) {
    this.deps = deps
  }

  public permissionsFor(stand: StandAttributes, user: BaseUserResponse): StandPermissions {
    const isPersonal = stand.kind === StandKind.Ephemeral
    const isOwner = !!stand.owner && stand.owner.toLowerCase() === user.email.toLowerCase()
    const canManage = user.is_admin || (isPersonal && isOwner)

    return {
      can_control_stand: canManage && isPersonal,
      can_control_workloads: canManage,
      can_delete: canManage && isPersonal && this.deps.deleteEnabled
    }
  }

  public async getClusterResources(): Promise<ClusterResourcesResponse> {
    const results = await Promise.all(CLUSTER_RESOURCE_QUERIES.map(query => this.deps.metrics.query(query.promql)))
    const warnings: Array<string> = []

    return { ...resourcesOf(CLUSTER_RESOURCE_QUERIES, results, warnings), warnings }
  }

  public async getState(stand: StandAttributes, user: BaseUserResponse): Promise<ControlResult<StandStateResponse>> {
    if (!DNS_LABEL.test(stand.name)) return failure(`Invalid stand name ${stand.name}`, httpStatus.UNPROCESSABLE_ENTITY)

    const namespace = stand.name
    const resourceQueries = standResourceQueries(namespace)
    const [standNamespace, workloads, applications, resourceResults, nodes, saved, protectedRef] = await Promise.all([
      this.deps.cluster.getStandNamespace(namespace),
      this.deps.cluster.listWorkloads(namespace),
      this.deps.cluster.listApplications(namespace),
      Promise.all(resourceQueries.map(query => this.deps.metrics.query(query.promql))),
      this.deps.metrics.query(`count by (node) (kube_pod_info{namespace="${namespace}"})`),
      DB.models.StandReplica.findAll({ where: { stand: namespace }, raw: true }),
      this.protectedWorkload(namespace)
    ])

    if (standNamespace instanceof Error) return clusterFailure(standNamespace)

    const warnings: Array<string> = []
    const base = {
      ...this.permissionsFor(stand, user),
      created_at: standNamespace.createdAt || null,
      expires_at: standNamespace.expiresAt || null,
      urls: standNamespace.urls,
      warnings
    }

    if (protectedRef instanceof Error) warnings.push(`Own namespace unknown: ${protectedRef.message}`)
    if (applications instanceof Error) warnings.push(`ArgoCD: ${applications.message}`)
    if (nodes instanceof Error) warnings.push(`Prometheus nodes: ${nodes.message}`)

    const shared = {
      ...base,
      ...resourcesOf(resourceQueries, resourceResults, warnings),
      applications: applications instanceof Error ? [] : applications.map(app => this.toApplicationItem(app)),
      nodes: nodes instanceof Error ? [] : nodes.map(sample => sample.labels.node).filter(Boolean)
    }

    if (workloads instanceof Error) {
      if (!isForbidden(workloads)) return clusterFailure(workloads)

      warnings.push(`${NO_ACCESS_MESSAGE}: ${workloads.message}`)

      return {
        success: true,
        data: { ...shared, access: StandAccess.Forbidden, state: null, workloads: [] }
      }
    }

    const savedByKey = new Map(saved.map(row => [`${row.kind}/${row.name}`, row.replicas]))
    const workloadItems: Array<StandWorkloadItem> = workloads.map(workload => ({
      ...workload,
      saved_replicas: savedByKey.get(`${workload.kind}/${workload.name}`) ?? null,
      is_protected: !(protectedRef instanceof Error) && !!protectedRef && isSameWorkload(workload, protectedRef)
    }))

    return {
      success: true,
      data: {
        ...shared,
        access: StandAccess.Granted,
        state: runtimeStateOf(workloads),
        workloads: workloadItems
      }
    }
  }

  public async scale(
    stand: StandAttributes,
    user: BaseUserResponse,
    action: ScaleAction,
    workload?: WorkloadRef
  ): Promise<ControlResult<ScaleResponse>> {
    if (!DNS_LABEL.test(stand.name)) return failure(`Invalid stand name ${stand.name}`, httpStatus.UNPROCESSABLE_ENTITY)

    const permissions = this.permissionsFor(stand, user)
    const isAllowed = workload ? permissions.can_control_workloads : permissions.can_control_stand
    if (!isAllowed) return failure("Not allowed to control this stand", httpStatus.FORBIDDEN)

    const namespace = stand.name
    const protectedRef = await this.protectedWorkload(namespace)
    if (protectedRef instanceof Error)
      return failure(`Own namespace unknown, refusing to scale: ${protectedRef.message}`, httpStatus.BAD_GATEWAY)

    const workloads = await this.deps.cluster.listWorkloads(namespace)
    if (workloads instanceof Error) return clusterFailure(workloads)

    const isProtected = (item: WorkloadRef): boolean => !!protectedRef && isSameWorkload(item, protectedRef)
    const targets = workload ? workloads.filter(item => isSameWorkload(item, workload)) : workloads

    if (workload && !targets.length) return failure(`${workload.kind} ${workload.name} not found`, httpStatus.NOT_FOUND)
    if (workload && isProtected(workload))
      return failure("TestGrid does not scale its own Deployment", httpStatus.FORBIDDEN)

    const candidates = targets.filter(item => !isProtected(item))
    const result =
      action === ScaleAction.Stop
        ? await this.stopWorkloads(namespace, candidates)
        : await this.startWorkloads(namespace, candidates)

    const isOnlyForbidden =
      !result.scaled.length && result.failures.length > 0 && result.failures.every(item => item.no_access)
    if (isOnlyForbidden)
      return failure(
        `${NO_ACCESS_MESSAGE}: ${result.failures.map(item => item.error).join("; ")}`,
        httpStatus.FORBIDDEN
      )

    return { success: true, data: result }
  }

  public async deleteStand(
    stand: StandAttributes,
    user: BaseUserResponse
  ): Promise<ControlResult<DeleteStandResponse>> {
    if (!DNS_LABEL.test(stand.name)) return failure(`Invalid stand name ${stand.name}`, httpStatus.UNPROCESSABLE_ENTITY)

    const isPersonal = stand.kind === StandKind.Ephemeral
    if (!isPersonal || !this.permissionsFor(stand, user).can_delete)
      return failure("Not allowed to delete this stand", httpStatus.FORBIDDEN)

    const error = await this.deps.cluster.deleteStand(stand.name)
    if (error) return clusterFailure(error)

    await DB.models.StandReplica.destroy({ where: { stand: stand.name } })

    return { success: true, data: { deletion_started: true } }
  }

  private async stopWorkloads(namespace: string, workloads: Array<ClusterWorkload>): Promise<ScaleResponse> {
    const scaled: Array<WorkloadRef> = []
    const failures: Array<ScaleFailure> = []

    for (const workload of workloads.filter(item => item.desired > 0)) {
      const ref = { kind: workload.kind, name: workload.name }

      try {
        // eslint-disable-next-line no-await-in-loop
        await this.saveReplicas(namespace, workload)
      } catch (e) {
        failures.push({ ...ref, error: `Saving replica count failed: ${errorMessage(e)}`, no_access: false })
        continue
      }

      // eslint-disable-next-line no-await-in-loop
      const error = await this.deps.cluster.scaleWorkload({
        namespace,
        ...ref,
        replicas: 0,
        fieldManager: STOP_FIELD_MANAGER
      })

      if (error) {
        failures.push({ ...ref, error: error.message, no_access: isForbidden(error) })
        // eslint-disable-next-line no-await-in-loop
        if (isDefinitelyRejected(error)) await DB.models.StandReplica.destroy({ where: { stand: namespace, ...ref } })
        continue
      }

      scaled.push(ref)
    }

    return { scaled, failures }
  }

  private async startWorkloads(namespace: string, workloads: Array<ClusterWorkload>): Promise<ScaleResponse> {
    const scaled: Array<WorkloadRef> = []
    const failures: Array<ScaleFailure> = []

    for (const workload of workloads) {
      const ref = { kind: workload.kind, name: workload.name }
      const where = { stand: namespace, ...ref }

      if (workload.desired > 0) {
        // eslint-disable-next-line no-await-in-loop
        await DB.models.StandReplica.destroy({ where })
        continue
      }

      // eslint-disable-next-line no-await-in-loop
      const saved = await DB.models.StandReplica.findOne({ where })
      // eslint-disable-next-line no-await-in-loop
      const error = await this.deps.cluster.scaleWorkload({
        namespace,
        ...ref,
        replicas: saved?.replicas ?? DEFAULT_START_REPLICAS,
        fieldManager: START_FIELD_MANAGER
      })

      if (error) {
        failures.push({ ...ref, error: error.message, no_access: isForbidden(error) })
        continue
      }

      // eslint-disable-next-line no-await-in-loop
      await DB.models.StandReplica.destroy({ where })
      scaled.push(ref)
    }

    return { scaled, failures }
  }

  private async saveReplicas(namespace: string, workload: ClusterWorkload): Promise<void> {
    const where = { stand: namespace, kind: workload.kind, name: workload.name }

    await DB.sequelize.transaction(async transaction => {
      const existing = await DB.models.StandReplica.findOne({ where, transaction })

      if (existing) {
        await existing.update({ replicas: workload.desired }, { transaction })
        return
      }

      await DB.models.StandReplica.create({ ...where, replicas: workload.desired }, { transaction })
    })
  }

  private async protectedWorkload(namespace: string): Promise<WorkloadRef | null | Error> {
    const selfNamespace = await this.deps.cluster.selfNamespace()
    if (selfNamespace instanceof Error) return selfNamespace
    if (selfNamespace !== namespace) return null

    return { kind: WorkloadKind.Deployment, name: this.deps.selfDeployment }
  }

  private toApplicationItem(app: { name: string; sync: string; health: string; images: Array<string> }) {
    const tags = Array.from(new Set(app.images.map(imageTag)))

    return {
      name: app.name,
      sync: app.sync,
      health: app.health,
      version: tags.length ? tags.join(", ") : null
    } satisfies StandApplicationItem
  }
}
