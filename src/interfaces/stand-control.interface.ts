export enum WorkloadKind {
  Deployment = "Deployment",
  StatefulSet = "StatefulSet"
}

export enum StandRuntimeState {
  Running = "running",
  Degraded = "degraded",
  Stopped = "stopped"
}

export enum StandAccess {
  Granted = "granted",
  Forbidden = "forbidden"
}

export enum ScaleAction {
  Stop = "stop",
  Start = "start"
}

export interface WorkloadRef {
  kind: WorkloadKind
  name: string
}

export interface StandWorkloadItem extends WorkloadRef {
  application: string | null
  desired: number
  ready: number
  saved_replicas: number | null
  is_protected: boolean
}

export interface StandApplicationItem {
  name: string
  sync: string
  health: string
  version: string | null
}

export interface StandPermissions {
  can_control_stand: boolean
  can_control_workloads: boolean
  can_delete: boolean
}

export interface StandResources {
  cpu_used_cores: number | null
  cpu_requested_cores: number | null
  memory_used_gib: number | null
  memory_requested_gib: number | null
}

export interface ClusterResources {
  cpu_requested_cores: number | null
  cpu_allocatable_cores: number | null
  memory_requested_gib: number | null
  memory_allocatable_gib: number | null
}

export interface ClusterResourcesResponse extends ClusterResources {
  warnings: Array<string>
}

export interface StandStateResponse extends StandPermissions, StandResources {
  access: StandAccess
  state: StandRuntimeState | null
  created_at: string | null
  expires_at: string | null
  urls: Array<string>
  nodes: Array<string>
  workloads: Array<StandWorkloadItem>
  applications: Array<StandApplicationItem>
  warnings: Array<string>
}

export interface ScaleRequestBody {
  action: ScaleAction
  workload?: WorkloadRef
}

export interface ScaleFailure extends WorkloadRef {
  error: string
  no_access: boolean
}

export interface ScaleResponse {
  scaled: Array<WorkloadRef>
  failures: Array<ScaleFailure>
}

export interface DeleteStandResponse {
  deletion_started: boolean
}
