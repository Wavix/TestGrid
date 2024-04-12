export interface Dashboard {
  stands: Array<DashboardStandItem>
}

export interface DashboardStandItem {
  id: number
  name: string
  is_smoke_test: boolean
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
