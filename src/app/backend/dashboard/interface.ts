import type { StandKind, StandSource } from "@/interfaces/stand.interface"

export interface Dashboard {
  stands: Array<DashboardStandItem>
}

export interface DashboardStandItem {
  id: number
  name: string
  is_smoke_test: boolean
  source: StandSource
  kind: StandKind
  owner: string | null
  repositories: Array<DashboardRepositoryItem>
}

export interface DashboardRepositoryItem {
  id: number
  name: string
  last_branch: string | null
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
