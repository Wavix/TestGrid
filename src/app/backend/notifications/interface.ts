export interface NotificationsViewResponse {
  success: boolean
}

export interface NotificationListItem {
  id: number
  is_viewed: boolean
  created_at: Date
  message: string
}

export interface NotificationsListResponse {
  notifications: Array<NotificationListItem>
}
