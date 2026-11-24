import type { StandSource } from "@/interfaces/stand.interface"

export interface Dashboard {
  stands: Array<DashboardStandItem>
  cluster?: ClusterCapacity
}

export enum StandK8sState {
  Running = "running",
  Degraded = "degraded",
  Sleeping = "sleeping"
}

export enum StandKind {
  Permanent = "permanent",
  Ephemeral = "ephemeral"
}

export enum StandAction {
  Sleep = "sleep",
  Wake = "wake",
  Delete = "delete"
}

export interface ResourceUsage {
  used: number
  requested: number
}

export interface StandK8sService {
  name: string
  version: string
  is_synced: boolean
  is_healthy: boolean
}

export interface StandK8sInfo {
  kind: StandKind
  owner_name?: string
  created_at?: string
  expires_at?: string
  state: StandK8sState
  node: string
  urls: Array<string>
  cpu_cores: ResourceUsage
  memory_gib: ResourceUsage
  services: Array<StandK8sService>
}

export interface ClusterCapacity {
  nodes: number
  node_cpu_cores: number
  node_memory_gib: number
  cluster_cpu_cores: number
  cluster_memory_gib: number
  system_cpu_cores: number
  system_memory_gib: number
}

export interface DashboardStandItem {
  id: number
  name: string
  is_smoke_test: boolean
  source: StandSource
  k8s?: StandK8sInfo
  repositories: Array<DashboardRepositoryItem>
}

export interface DashboardRepositoryItem {
  id: number
  name: string
  booking: DashboardRepositoryBookingItem | null
}

interface DashboardRepositoryBookingItem {
  user: {
    name: string
    id: number
    email: string
  }
  id: number
  created_at: Date
  branch_name: string
  task_name: string | null
}
