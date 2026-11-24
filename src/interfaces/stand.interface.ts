export enum StandSource {
  Manual = "manual",
  K8s = "k8s"
}

export enum StandKind {
  Permanent = "permanent",
  Ephemeral = "ephemeral"
}

export interface StandUpdateResponse {
  stand: StandItem
}

export interface StandItem {
  id: number
  name: string
  namespace_id: number
  created_at: Date
  is_smoke_test: boolean
  source: StandSource
  kind: StandKind
  owner: string | null
}
