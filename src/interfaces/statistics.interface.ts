export interface UserBookStatisticItem {
  date: Date
}

export interface ShortUser {
  id: number
  name: string
  email: string
}

export interface UserBookStatisticsItem {
  user: ShortUser
  total: number
  statistics: Array<UserBookStatisticItem>
}

export interface UserBookStatistics {
  users: Array<UserBookStatisticsItem>
  total: number
}
