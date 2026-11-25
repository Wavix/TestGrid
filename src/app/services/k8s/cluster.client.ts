import { readFile } from "fs/promises"

import { WorkloadKind } from "@/interfaces/stand-control.interface"
import { StandKind } from "@/interfaces/stand.interface"

import { ClusterErrorReason, ClusterRequestError, requestJson } from "./http"

import type { JsonRequest } from "./http"
import type { K8sConfig } from "@/config"

export interface ClusterStand {
  name: string
  kind: StandKind
  owner: string | null
}

export interface ClusterClient {
  listStands(): Promise<Array<ClusterStand> | Error>
}

export interface ClusterWorkload {
  kind: WorkloadKind
  name: string
  application: string | null
  desired: number
  ready: number
}

export interface ClusterApplication {
  name: string
  sync: string
  health: string
  images: Array<string>
}

export interface StandNamespace {
  name: string
  createdAt: string
  expiresAt: string
  urls: Array<string>
}

export interface ScaleRequest {
  namespace: string
  kind: WorkloadKind
  name: string
  replicas: number
  fieldManager: string
}

export interface StandClusterClient {
  getStandNamespace(stand: string): Promise<StandNamespace | Error>
  listWorkloads(namespace: string): Promise<Array<ClusterWorkload> | Error>
  scaleWorkload(request: ScaleRequest): Promise<null | Error>
  listApplications(namespace: string): Promise<Array<ClusterApplication> | Error>
  selfNamespace(): Promise<string | Error>
  deleteStand(stand: string): Promise<null | Error>
}

interface K8sMetadata {
  name: string
  creationTimestamp?: string
  labels?: Record<string, string>
  annotations?: Record<string, string>
}

interface K8sNamespace {
  metadata: K8sMetadata
}

interface K8sWorkload {
  metadata: K8sMetadata
  spec?: { replicas?: number }
  status?: { readyReplicas?: number }
}

interface K8sApplication {
  metadata: K8sMetadata
  spec?: { destination?: { namespace?: string } }
  status?: {
    sync?: { status?: string }
    health?: { status?: string }
    summary?: { images?: Array<string> }
  }
}

interface K8sList<T> {
  items: Array<T>
}

const REQUEST_TIMEOUT_MS = 5000
const DEFAULT_REPLICAS = 1
const UNKNOWN_STATUS = "Unknown"
const URL_SEPARATOR = /[\s,]+/
const TRACKING_ID_ANNOTATION = "argocd.argoproj.io/tracking-id"
const INSTANCE_LABEL = "app.kubernetes.io/instance"

const WORKLOAD_RESOURCES: Record<WorkloadKind, string> = {
  [WorkloadKind.Deployment]: "deployments",
  [WorkloadKind.StatefulSet]: "statefulsets"
}

export class K8sClusterClient implements ClusterClient, StandClusterClient {
  private readonly options: K8sConfig

  constructor(options: K8sConfig) {
    this.options = options
  }

  public async listStands(): Promise<Array<ClusterStand> | Error> {
    try {
      const list = await this.request<K8sList<K8sNamespace>>("/api/v1/namespaces", {
        labelSelector: this.options.standLabel
      })
      const stands = new Map<string, ClusterStand>()

      for (const item of list.items) {
        const name = item.metadata.labels?.[this.options.standLabel]
        if (!name) continue

        const isStandNamespace = item.metadata.name === name
        if (stands.has(name) && !isStandNamespace) continue

        stands.set(name, { name, kind: this.kindOf(item), owner: this.ownerOf(item) })
      }

      return Array.from(stands.values()).sort((a, b) => a.name.localeCompare(b.name))
    } catch (e) {
      return e as Error
    }
  }

  public async getStandNamespace(stand: string): Promise<StandNamespace | Error> {
    try {
      const list = await this.request<K8sList<K8sNamespace>>("/api/v1/namespaces", {
        labelSelector: `${this.options.standLabel}=${stand}`,
        fieldSelector: `metadata.name=${stand}`
      })
      const [item] = list.items

      if (!item) return new ClusterRequestError(ClusterErrorReason.NotFound, `Namespace ${stand} not found`)

      return {
        name: item.metadata.name,
        createdAt: item.metadata.creationTimestamp || "",
        expiresAt: this.options.expiresAnnotation
          ? item.metadata.annotations?.[this.options.expiresAnnotation] || ""
          : "",
        urls: this.urlsOf(item)
      }
    } catch (e) {
      return e as Error
    }
  }

  public async listWorkloads(namespace: string): Promise<Array<ClusterWorkload> | Error> {
    try {
      const [deployments, statefulSets] = await Promise.all(
        Object.values(WorkloadKind).map(kind =>
          this.request<K8sList<K8sWorkload>>(`/apis/apps/v1/namespaces/${namespace}/${WORKLOAD_RESOURCES[kind]}`)
        )
      )

      return [
        ...deployments.items.map(item => this.toWorkload(WorkloadKind.Deployment, item)),
        ...statefulSets.items.map(item => this.toWorkload(WorkloadKind.StatefulSet, item))
      ].sort((a, b) => a.name.localeCompare(b.name))
    } catch (e) {
      return e as Error
    }
  }

  public async scaleWorkload({ namespace, kind, name, replicas, fieldManager }: ScaleRequest): Promise<null | Error> {
    try {
      await this.request(
        `/apis/apps/v1/namespaces/${namespace}/${WORKLOAD_RESOURCES[kind]}/${name}/scale`,
        { fieldManager },
        {
          method: "PATCH",
          headers: { "Content-Type": "application/merge-patch+json" },
          body: JSON.stringify({ spec: { replicas } })
        }
      )

      return null
    } catch (e) {
      return e as Error
    }
  }

  public async listApplications(namespace: string): Promise<Array<ClusterApplication> | Error> {
    try {
      const list = await this.request<K8sList<K8sApplication>>(
        `/apis/argoproj.io/v1alpha1/namespaces/${this.options.argocdNamespace}/applications`
      )

      return list.items
        .filter(item => item.spec?.destination?.namespace === namespace)
        .map(item => ({
          name: item.metadata.name,
          sync: item.status?.sync?.status || UNKNOWN_STATUS,
          health: item.status?.health?.status || UNKNOWN_STATUS,
          images: item.status?.summary?.images || []
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    } catch (e) {
      return e as Error
    }
  }

  public async selfNamespace(): Promise<string | Error> {
    if (!this.options.namespaceFile) return ""

    try {
      return (await readFile(this.options.namespaceFile, "utf8")).trim()
    } catch (e) {
      return e as Error
    }
  }

  public async deleteStand(stand: string): Promise<null | Error> {
    try {
      const applicationsPath = `/apis/argoproj.io/v1alpha1/namespaces/${this.options.argocdNamespace}/applications`
      const applications = await this.request<K8sList<K8sApplication>>(applicationsPath, {
        labelSelector: `${this.options.standLabel}=${stand}`
      })

      await this.request(`/api/v1/namespaces/${stand}`, {}, { method: "DELETE" })
      await Promise.all(
        applications.items.map(item =>
          this.request(`${applicationsPath}/${item.metadata.name}`, {}, { method: "DELETE" })
        )
      )

      return null
    } catch (e) {
      return e as Error
    }
  }

  private toWorkload(kind: WorkloadKind, item: K8sWorkload): ClusterWorkload {
    return {
      kind,
      name: item.metadata.name,
      application: this.applicationOf(item),
      desired: item.spec?.replicas ?? DEFAULT_REPLICAS,
      ready: item.status?.readyReplicas ?? 0
    }
  }

  private applicationOf(item: K8sWorkload): string | null {
    const trackingId = item.metadata.annotations?.[TRACKING_ID_ANNOTATION]
    if (trackingId) return trackingId.split(":")[0]

    return item.metadata.labels?.[INSTANCE_LABEL] || null
  }

  private kindOf(item: K8sNamespace): StandKind {
    const value = this.options.kindLabel ? item.metadata.labels?.[this.options.kindLabel] : undefined

    return value === StandKind.Ephemeral ? StandKind.Ephemeral : StandKind.Permanent
  }

  private ownerOf(item: K8sNamespace): string | null {
    if (!this.options.ownerAnnotation) return null

    return item.metadata.annotations?.[this.options.ownerAnnotation] || null
  }

  private urlsOf(item: K8sNamespace): Array<string> {
    if (!this.options.urlsAnnotation) return []

    const value = item.metadata.annotations?.[this.options.urlsAnnotation] || ""

    return value.split(URL_SEPARATOR).filter(Boolean)
  }

  private async request<T>(
    pathname: string,
    query: Record<string, string> = {},
    init: Pick<JsonRequest, "method" | "headers" | "body"> = {}
  ): Promise<T> {
    const url = new URL(pathname, this.options.apiUrl)
    Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value))

    const isHttps = url.protocol === "https:"
    // Kubernetes rotates the projected service account token, so it is read per request
    const token = this.options.tokenFile ? (await readFile(this.options.tokenFile, "utf8")).trim() : ""
    const ca = isHttps && this.options.caFile ? await readFile(this.options.caFile) : undefined

    return requestJson<T>({
      ...init,
      url,
      ca,
      headers: { ...init.headers, ...(token && { Authorization: `Bearer ${token}` }) },
      timeoutMs: REQUEST_TIMEOUT_MS
    })
  }
}
