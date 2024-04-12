export interface StandUpdateResponse {
  stand: StandItem
}

export interface StandItem {
  id: number
  name: string
  namespace_id: number
  created_at: Date
  is_smoke_test: boolean
}
