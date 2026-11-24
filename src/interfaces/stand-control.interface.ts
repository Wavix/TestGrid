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

export interface StandStateResponse extends StandPermissions {
  access: StandAccess
  state: StandRuntimeState | null
  created_at: string | null
  expires_at: string | null
  urls: Array<string>
  nodes: Array<string>
  memory_requested_gib: number | null
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
