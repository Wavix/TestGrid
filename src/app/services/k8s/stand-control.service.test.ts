import { mkdtemp, rm, writeFile } from "fs/promises"
import { tmpdir } from "os"
import path from "path"

import { DB } from "@/app/database"
import { routeKey, startFakeServer } from "@/helpers/tests/fake-http.helper"
import { ScaleAction, StandAccess, StandRuntimeState, WorkloadKind } from "@/interfaces/stand-control.interface"
import { StandKind, StandSource } from "@/interfaces/stand.interface"

import { K8sClusterClient } from "./cluster.client"
import { PrometheusClient } from "./prometheus.client"
import {
  NO_ACCESS_MESSAGE,
  START_FIELD_MANAGER,
  STOP_FIELD_MANAGER,
  StandControlService
} from "./stand-control.service"

import type { StandAttributes } from "@/app/database/interfaces/stand.interface"
import type { FakeRequest, FakeServer } from "@/helpers/tests/fake-http.helper"
import type { BaseUserResponse } from "@/interfaces/auth.interface"

const STAND_LABEL = "example.org/stand"
const URLS_ANNOTATION = "example.org/stand-urls"
const EXPIRES_ANNOTATION = "example.org/stand-expires"
const OWN_NAMESPACE = "qa1"
const GIB = 1024 ** 3

interface FakeWorkload {
  name: string
  replicas: number
  ready: number
}

type ClusterWorkloads = Record<string, Record<WorkloadKind, Array<FakeWorkload>>>

const RESOURCES: Record<string, WorkloadKind> = {
  deployments: WorkloadKind.Deployment,
  statefulsets: WorkloadKind.StatefulSet
}

const admin: BaseUserResponse = { id: 1, email: "admin@example.org", is_admin: true, name: "Admin" }
const owner: BaseUserResponse = { id: 2, email: "ann@example.org", is_admin: false, name: "Ann" }
const stranger: BaseUserResponse = { id: 3, email: "bob@example.org", is_admin: false, name: "Bob" }

const standNamed = (name: string, kind: StandKind, standOwner: string | null = null): StandAttributes => ({
  id: 1,
  name,
  namespace_id: 1,
  created_at: new Date(),
  is_smoke_test: false,
  source: StandSource.K8s,
  kind,
  owner: standOwner
})

const qa1 = standNamed("qa1", StandKind.Permanent)
const personal = standNamed("dev-ann", StandKind.Ephemeral, owner.email)

const scaleRequests = (api: FakeServer): Array<FakeRequest> =>
  api.received.filter(request => request.method === "PATCH")

const scaledTo = (request: FakeRequest): number => JSON.parse(request.body).spec.replicas

describe("Stand control", () => {
  let k8s: FakeServer
  let prometheus: FakeServer
  let dir: string
  let workloads: ClusterWorkloads
  let forbiddenScale: boolean
  let failingScaleStatus: number | null

  const serviceWith = (deleteEnabled = false) =>
    new StandControlService({
      cluster: new K8sClusterClient({
        enabled: true,
        standLabel: STAND_LABEL,
        testgridNamespace: "myorg",
        kindLabel: "",
        ownerAnnotation: "",
        urlsAnnotation: URLS_ANNOTATION,
        expiresAnnotation: EXPIRES_ANNOTATION,
        apiUrl: k8s.url,
        tokenFile: "",
        caFile: "",
        namespaceFile: path.join(dir, "namespace"),
        selfDeployment: "testgrid",
        argocdNamespace: "argocd",
        prometheusUrl: prometheus.url,
        deleteEnabled
      }),
      metrics: new PrometheusClient(prometheus.url),
      deleteEnabled,
      selfDeployment: "testgrid"
    })

  const registerWorkloadRoutes = (namespace: string) => {
    Object.entries(RESOURCES).forEach(([resource, kind]) => {
      k8s.routes.set(routeKey("GET", `/apis/apps/v1/namespaces/${namespace}/${resource}`), () => ({
        status: 200,
        body: {
          items: workloads[namespace][kind].map(item => ({
            metadata: { name: item.name },
            spec: { replicas: item.replicas },
            status: { readyReplicas: item.ready }
          }))
        }
      }))

      workloads[namespace][kind].forEach(item => {
        k8s.routes.set(
          routeKey("PATCH", `/apis/apps/v1/namespaces/${namespace}/${resource}/${item.name}/scale`),
          request => {
            if (forbiddenScale)
              return { status: 403, body: { message: `${resource}.apps "${item.name}" is forbidden` } }
            if (failingScaleStatus) return { status: failingScaleStatus, body: { message: "etcd leader changed" } }

            Object.assign(item, { replicas: scaledTo(request) })
            return { status: 200, body: { spec: { replicas: item.replicas } } }
          }
        )
      })
    })
  }

  const savedReplicas = async (stand: string) =>
    (await DB.models.StandReplica.findAll({ where: { stand }, raw: true })).map(row => [
      row.kind,
      row.name,
      row.replicas
    ])

  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "testgrid-stand-control-"))
    await writeFile(path.join(dir, "namespace"), `${OWN_NAMESPACE}\n`)
  })

  afterAll(async () => {
    await rm(dir, { recursive: true })
  })

  beforeEach(async () => {
    k8s = await startFakeServer()
    prometheus = await startFakeServer()
    forbiddenScale = false
    failingScaleStatus = null
    workloads = {
      "qa1": {
        [WorkloadKind.Deployment]: [
          { name: "backend", replicas: 3, ready: 3 },
          { name: "testgrid", replicas: 1, ready: 1 }
        ],
        [WorkloadKind.StatefulSet]: [{ name: "mysql", replicas: 1, ready: 0 }]
      },
      "dev-ann": {
        [WorkloadKind.Deployment]: [
          { name: "frontend", replicas: 2, ready: 2 },
          { name: "testgrid", replicas: 1, ready: 1 }
        ],
        [WorkloadKind.StatefulSet]: [{ name: "datastore", replicas: 1, ready: 1 }]
      }
    }
    registerWorkloadRoutes("qa1")
    registerWorkloadRoutes("dev-ann")
  })

  afterEach(async () => {
    await k8s.close()
    await prometheus.close()
    await DB.models.StandReplica.destroy({ where: {} })
  })

  describe("stop", () => {
    it("saves each replica count, then scales to 0 under the testgrid field manager", async () => {
      const result = await serviceWith().scale(personal, owner, ScaleAction.Stop)

      expect(result.success).toBe(true)
      expect(await savedReplicas("dev-ann")).toEqual(
        expect.arrayContaining([
          [WorkloadKind.Deployment, "frontend", 2],
          [WorkloadKind.Deployment, "testgrid", 1],
          [WorkloadKind.StatefulSet, "datastore", 1]
        ])
      )

      const patches = scaleRequests(k8s)
      expect(patches).toHaveLength(3)
      patches.forEach(patch => {
        expect(patch.query.get("fieldManager")).toBe(STOP_FIELD_MANAGER)
        expect(patch.contentType).toBe("application/merge-patch+json")
        expect(scaledTo(patch)).toBe(0)
      })
    })

    it("skips TestGrid's own Deployment when stopping TestGrid's own stand", async () => {
      const ownPersonalStand = standNamed(OWN_NAMESPACE, StandKind.Ephemeral, owner.email)

      const result = await serviceWith().scale(ownPersonalStand, owner, ScaleAction.Stop)

      expect(result.success).toBe(true)
      expect(scaleRequests(k8s).map(patch => patch.path)).toEqual([
        "/apis/apps/v1/namespaces/qa1/deployments/backend/scale",
        "/apis/apps/v1/namespaces/qa1/statefulsets/mysql/scale"
      ])
      expect(workloads.qa1[WorkloadKind.Deployment][1]).toEqual({ name: "testgrid", replicas: 1, ready: 1 })
      expect(await savedReplicas("qa1")).not.toContainEqual([WorkloadKind.Deployment, "testgrid", 1])
    })

    it("refuses to stop TestGrid's own Deployment by name", async () => {
      const result = await serviceWith().scale(qa1, admin, ScaleAction.Stop, {
        kind: WorkloadKind.Deployment,
        name: "testgrid"
      })

      expect(result).toMatchObject({ success: false, code: 403 })
      expect(scaleRequests(k8s)).toHaveLength(0)
    })

    it("stops a single qa1 workload for an admin", async () => {
      const result = await serviceWith().scale(qa1, admin, ScaleAction.Stop, {
        kind: WorkloadKind.Deployment,
        name: "backend"
      })

      expect(result).toEqual({
        success: true,
        data: { scaled: [{ kind: WorkloadKind.Deployment, name: "backend" }], failures: [] }
      })
      expect(await savedReplicas("qa1")).toEqual([[WorkloadKind.Deployment, "backend", 3]])
    })

    it("does not overwrite the saved count of a workload that is already stopped", async () => {
      const backend = { kind: WorkloadKind.Deployment, name: "backend" }
      await serviceWith().scale(qa1, admin, ScaleAction.Stop, backend)

      const second = await serviceWith().scale(qa1, admin, ScaleAction.Stop, backend)

      expect(second).toEqual({ success: true, data: { scaled: [], failures: [] } })
      expect(await savedReplicas("qa1")).toEqual([[WorkloadKind.Deployment, "backend", 3]])
    })

    it("surfaces a 403 from the scale subresource and keeps no saved count", async () => {
      forbiddenScale = true

      const result = await serviceWith().scale(personal, owner, ScaleAction.Stop)

      expect(result.success).toBe(false)
      if (result.success) return
      expect(result.code).toBe(403)
      expect(result.error).toContain(NO_ACCESS_MESSAGE)
      expect(result.error).toContain("403")
      expect(await savedReplicas("dev-ann")).toEqual([])
    })

    it("surfaces a 403 when the stand has no binding for TestGrid", async () => {
      k8s.routes.set(routeKey("GET", "/apis/apps/v1/namespaces/dev-ann/deployments"), () => ({
        status: 403,
        body: { message: "deployments.apps is forbidden" }
      }))

      const result = await serviceWith().scale(personal, owner, ScaleAction.Stop)

      expect(result).toMatchObject({ success: false, code: 403 })
      expect(scaleRequests(k8s)).toHaveLength(0)
    })

    it("refuses a whole-stand stop of a shared stand, even for an admin", async () => {
      const result = await serviceWith().scale(qa1, admin, ScaleAction.Stop)

      expect(result).toMatchObject({ success: false, code: 403 })
      expect(scaleRequests(k8s)).toHaveLength(0)
    })

    it("keeps the saved count when the scale outcome is unknown", async () => {
      failingScaleStatus = 500
      const backend = { kind: WorkloadKind.Deployment, name: "backend" }

      const result = await serviceWith().scale(qa1, admin, ScaleAction.Stop, backend)

      expect(result).toMatchObject({ success: true, data: { scaled: [] } })
      expect(await savedReplicas("qa1")).toEqual([[WorkloadKind.Deployment, "backend", 3]])
    })

    it("refuses a non-admin a workload stop on a shared stand", async () => {
      const result = await serviceWith().scale(qa1, owner, ScaleAction.Stop, {
        kind: WorkloadKind.Deployment,
        name: "backend"
      })

      expect(result).toMatchObject({ success: false, code: 403 })
      expect(scaleRequests(k8s)).toHaveLength(0)
    })

    it("refuses a stranger a workload stop on someone else's personal stand", async () => {
      const result = await serviceWith().scale(personal, stranger, ScaleAction.Stop, {
        kind: WorkloadKind.Deployment,
        name: "frontend"
      })

      expect(result).toMatchObject({ success: false, code: 403 })
      expect(scaleRequests(k8s)).toHaveLength(0)
    })

    it("recognises the owner whatever the letter case of the email", async () => {
      const shouting = { ...owner, email: owner.email.toUpperCase() }

      const result = await serviceWith().scale(personal, shouting, ScaleAction.Stop)

      expect(result.success).toBe(true)
    })

    it("refuses a user who neither owns the stand nor is an admin", async () => {
      const result = await serviceWith().scale(personal, stranger, ScaleAction.Stop)

      expect(result).toMatchObject({ success: false, code: 403 })
      expect(scaleRequests(k8s)).toHaveLength(0)
    })
  })

  describe("start", () => {
    it("restores the saved count under a different field manager and clears it", async () => {
      await serviceWith().scale(personal, owner, ScaleAction.Stop)
      k8s.received.length = 0

      const result = await serviceWith().scale(personal, owner, ScaleAction.Start)

      expect(result.success).toBe(true)
      const patches = scaleRequests(k8s)
      expect(patches.map(patch => [patch.path, scaledTo(patch)])).toEqual(
        expect.arrayContaining([
          ["/apis/apps/v1/namespaces/dev-ann/deployments/frontend/scale", 2],
          ["/apis/apps/v1/namespaces/dev-ann/deployments/testgrid/scale", 1],
          ["/apis/apps/v1/namespaces/dev-ann/statefulsets/datastore/scale", 1]
        ])
      )
      patches.forEach(patch => expect(patch.query.get("fieldManager")).toBe(START_FIELD_MANAGER))
      expect(await savedReplicas("dev-ann")).toEqual([])
    })

    it("scales to 1 when no count was saved", async () => {
      workloads.qa1[WorkloadKind.Deployment][0].replicas = 0

      const result = await serviceWith().scale(qa1, admin, ScaleAction.Start, {
        kind: WorkloadKind.Deployment,
        name: "backend"
      })

      expect(result.success).toBe(true)
      const [patch] = scaleRequests(k8s)
      expect(scaledTo(patch)).toBe(1)
      expect(patch.query.get("fieldManager")).toBe(START_FIELD_MANAGER)
    })

    it("keeps the saved count when the start fails", async () => {
      const backend = { kind: WorkloadKind.Deployment, name: "backend" }
      await serviceWith().scale(qa1, admin, ScaleAction.Stop, backend)
      forbiddenScale = true

      const result = await serviceWith().scale(qa1, admin, ScaleAction.Start, backend)

      expect(result).toMatchObject({ success: false, code: 403 })
      expect(await savedReplicas("qa1")).toEqual([[WorkloadKind.Deployment, "backend", 3]])
    })
  })

  describe("state", () => {
    const registerStateRoutes = () => {
      k8s.routes.set(routeKey("GET", "/api/v1/namespaces"), () => ({
        status: 200,
        body: {
          items: [
            {
              metadata: {
                name: "qa1",
                creationTimestamp: "2026-01-02T03:04:05Z",
                labels: { [STAND_LABEL]: "qa1" },
                annotations: {
                  [URLS_ANNOTATION]: "https://app.qa1.example.org, https://api.qa1.example.org",
                  [EXPIRES_ANNOTATION]: "2026-02-01T00:00:00Z"
                }
              }
            }
          ]
        }
      }))
      k8s.routes.set(routeKey("GET", "/apis/argoproj.io/v1alpha1/namespaces/argocd/applications"), () => ({
        status: 200,
        body: {
          items: [
            {
              metadata: { name: "qa1-backend" },
              spec: { destination: { namespace: "qa1" } },
              status: {
                sync: { status: "Synced" },
                health: { status: "Healthy" },
                summary: { images: ["registry.example.org:5000/wavix/backend:1.2.3"] }
              }
            },
            {
              metadata: { name: "dev-ann-frontend" },
              spec: { destination: { namespace: "dev-ann" } },
              status: { sync: { status: "OutOfSync" }, health: { status: "Degraded" } }
            }
          ]
        }
      }))
      prometheus.routes.set(routeKey("GET", "/api/v1/query"), request => {
        const query = request.query.get("query") || ""
        const sample = (value: number) => [{ metric: {}, value: [0, String(value)] }]
        const resultFor = (): Array<unknown> => {
          if (query.includes("container_cpu_usage_seconds_total")) return sample(0.4249)
          if (query.includes('resource="cpu"')) return sample(1.5)
          if (query.includes("container_memory_working_set_bytes")) return sample(1.25 * GIB)
          if (query.includes('resource="memory"')) return sample(2.5 * GIB)

          return [{ metric: { node: "worker-1" }, value: [0, "4"] }]
        }
        const result = resultFor()

        return { status: 200, body: { status: "success", data: { resultType: "vector", result } } }
      })
    }

    it("reports workloads, ArgoCD applications, CPU and memory, nodes and the namespace metadata", async () => {
      registerStateRoutes()
      await serviceWith().scale(qa1, admin, ScaleAction.Stop, { kind: WorkloadKind.Deployment, name: "backend" })

      const result = await serviceWith().getState(qa1, admin)

      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data).toEqual({
        access: StandAccess.Granted,
        state: StandRuntimeState.Degraded,
        created_at: "2026-01-02T03:04:05Z",
        expires_at: "2026-02-01T00:00:00Z",
        urls: ["https://app.qa1.example.org", "https://api.qa1.example.org"],
        nodes: ["worker-1"],
        cpu_used_cores: 0.42,
        cpu_requested_cores: 1.5,
        memory_used_gib: 1.25,
        memory_requested_gib: 2.5,
        workloads: [
          {
            kind: WorkloadKind.Deployment,
            name: "backend",
            application: null,
            desired: 0,
            ready: 3,
            saved_replicas: 3,
            is_protected: false
          },
          {
            kind: WorkloadKind.StatefulSet,
            name: "mysql",
            application: null,
            desired: 1,
            ready: 0,
            saved_replicas: null,
            is_protected: false
          },
          {
            kind: WorkloadKind.Deployment,
            name: "testgrid",
            application: null,
            desired: 1,
            ready: 1,
            saved_replicas: null,
            is_protected: true
          }
        ],
        applications: [{ name: "qa1-backend", sync: "Synced", health: "Healthy", version: "1.2.3" }],
        can_control_stand: false,
        can_control_workloads: true,
        can_delete: false,
        warnings: []
      })
      expect(
        prometheus.received
          .map(request => request.query.get("query"))
          .sort((a, b) => String(a).localeCompare(String(b)))
      ).toEqual([
        'count by (node) (kube_pod_info{namespace="qa1"})',
        'sum(container_memory_working_set_bytes{namespace="qa1",container!=""})',
        'sum(kube_pod_container_resource_requests{namespace="qa1",resource="cpu"} * on (namespace, pod) group_left () (max by (namespace, pod) (kube_pod_status_phase{namespace="qa1",phase=~"Pending|Running"}) == 1))',
        'sum(kube_pod_container_resource_requests{namespace="qa1",resource="memory"} * on (namespace, pod) group_left () (max by (namespace, pod) (kube_pod_status_phase{namespace="qa1",phase=~"Pending|Running"}) == 1))',
        'sum(rate(container_cpu_usage_seconds_total{namespace="qa1",container!=""}[5m]))'
      ])
    })

    it("marks a stand without TestGrid's binding as no access", async () => {
      registerStateRoutes()
      k8s.routes.set(routeKey("GET", "/apis/apps/v1/namespaces/qa1/statefulsets"), () => ({
        status: 403,
        body: { message: "statefulsets.apps is forbidden" }
      }))

      const result = await serviceWith().getState(qa1, admin)

      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.access).toBe(StandAccess.Forbidden)
      expect(result.data.workloads).toEqual([])
      expect(result.data.warnings.join()).toContain(NO_ACCESS_MESSAGE)
    })

    it("keeps the state when Prometheus is down and reports why CPU and memory are missing", async () => {
      registerStateRoutes()
      prometheus.routes.clear()

      const result = await serviceWith().getState(qa1, admin)

      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data).toMatchObject({
        cpu_used_cores: null,
        cpu_requested_cores: null,
        memory_used_gib: null,
        memory_requested_gib: null,
        nodes: []
      })
      expect(
        result.data.warnings.filter(warning => warning.startsWith("Prometheus") && warning.includes("404"))
      ).toEqual([
        expect.stringContaining("Prometheus nodes"),
        expect.stringContaining("Prometheus CPU used"),
        expect.stringContaining("Prometheus CPU requested"),
        expect.stringContaining("Prometheus memory used"),
        expect.stringContaining("Prometheus memory requested")
      ])
    })
  })

  describe("cluster resources", () => {
    it("reports requested against allocatable CPU and memory across the cluster", async () => {
      prometheus.routes.set(routeKey("GET", "/api/v1/query"), request => {
        const query = request.query.get("query") || ""
        const valueFor = (): number => {
          if (query.includes('kube_node_status_allocatable{resource="cpu"}')) return 24
          if (query.includes('kube_node_status_allocatable{resource="memory"}')) return 96 * GIB
          if (query.includes('resource="cpu"')) return 9.754
          return 36.5 * GIB
        }

        return {
          status: 200,
          body: {
            status: "success",
            data: { resultType: "vector", result: [{ metric: {}, value: [0, String(valueFor())] }] }
          }
        }
      })

      const result = await serviceWith().getClusterResources()

      expect(result).toEqual({
        cpu_requested_cores: 9.75,
        cpu_allocatable_cores: 24,
        memory_requested_gib: 36.5,
        memory_allocatable_gib: 96,
        warnings: []
      })
      expect(prometheus.received.map(request => request.query.get("query"))).toEqual(
        expect.arrayContaining([
          'sum(kube_pod_container_resource_requests{resource="cpu"} * on (namespace, pod) group_left () (max by (namespace, pod) (kube_pod_status_phase{phase=~"Pending|Running"}) == 1))',
          'sum(kube_node_status_allocatable{resource="memory"})'
        ])
      )
    })

    it("reports each missing cluster value when Prometheus is down", async () => {
      const result = await serviceWith().getClusterResources()

      expect(result).toMatchObject({
        cpu_requested_cores: null,
        cpu_allocatable_cores: null,
        memory_requested_gib: null,
        memory_allocatable_gib: null
      })
      expect(result.warnings).toEqual([
        expect.stringContaining("Prometheus cluster CPU requested"),
        expect.stringContaining("Prometheus cluster CPU allocatable"),
        expect.stringContaining("Prometheus cluster memory requested"),
        expect.stringContaining("Prometheus cluster memory allocatable")
      ])
    })
  })

  describe("delete", () => {
    const deleteRequests = () =>
      k8s.received.filter(request => request.method === "DELETE").map(request => request.path)

    const registerDeleteRoutes = (status = 200) => {
      const applications = "/apis/argoproj.io/v1alpha1/namespaces/argocd/applications"
      k8s.routes.set(routeKey("GET", applications), request => ({
        status: 200,
        body: {
          items:
            request.query.get("labelSelector") === `${STAND_LABEL}=dev-ann`
              ? [{ metadata: { name: "stand-dev-ann-backend" } }, { metadata: { name: "stand-dev-ann-frontend" } }]
              : []
        }
      }))
      ;["stand-dev-ann-backend", "stand-dev-ann-frontend"].forEach(name =>
        k8s.routes.set(routeKey("DELETE", `${applications}/${name}`), () => ({ status, body: {} }))
      )
      k8s.routes.set(routeKey("DELETE", "/api/v1/namespaces/dev-ann"), () => ({ status, body: {} }))
    }

    it("deletes the namespace first, so a refused delete leaves the Applications in place", async () => {
      registerDeleteRoutes()
      await serviceWith(true).scale(personal, owner, ScaleAction.Stop)

      const result = await serviceWith(true).deleteStand(personal, owner)

      expect(result).toEqual({ success: true, data: { deletion_started: true } })
      const deleted = deleteRequests()
      expect(deleted[0]).toBe("/api/v1/namespaces/dev-ann")
      expect(deleted.slice(1).sort()).toEqual([
        "/apis/argoproj.io/v1alpha1/namespaces/argocd/applications/stand-dev-ann-backend",
        "/apis/argoproj.io/v1alpha1/namespaces/argocd/applications/stand-dev-ann-frontend"
      ])
      expect(await savedReplicas("dev-ann")).toEqual([])
    })

    it("leaves the Applications alone when the cluster refuses the namespace delete", async () => {
      registerDeleteRoutes()
      k8s.routes.set(routeKey("DELETE", "/api/v1/namespaces/dev-ann"), () => ({
        status: 403,
        body: { message: "TestGrid deletes only namespaces of personal stands" }
      }))

      const result = await serviceWith(true).deleteStand(personal, owner)

      expect(result).toMatchObject({ success: false, code: 403 })
      expect(deleteRequests()).toEqual(["/api/v1/namespaces/dev-ann"])
    })

    it("never deletes a shared stand, even for an admin", async () => {
      registerDeleteRoutes()

      const result = await serviceWith(true).deleteStand(qa1, admin)

      expect(result).toMatchObject({ success: false, code: 403 })
      expect(k8s.received).toHaveLength(0)
    })

    it("refuses when deleting is disabled", async () => {
      const result = await serviceWith(false).deleteStand(personal, owner)

      expect(result).toMatchObject({ success: false, code: 403 })
      expect(k8s.received).toHaveLength(0)
    })

    it("surfaces a 403 from the cluster", async () => {
      registerDeleteRoutes(403)

      const result = await serviceWith(true).deleteStand(personal, owner)

      expect(result).toMatchObject({ success: false, code: 403 })
      if (result.success) return
      expect(result.error).toContain(NO_ACCESS_MESSAGE)
    })
  })
})
