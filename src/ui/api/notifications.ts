import { getAuthToken } from "./helpers"

import type { NotificationsListResponse, NotificationsViewResponse } from "@/app/backend/notifications/interface"

export const getNotifications = async (): Promise<NotificationsListResponse> => {
  const response = await fetch("/backend/notifications", {
    headers: { Authorization: getAuthToken() }
  })
  const data = await response.json()
  return data
}

export const readNotifications = async (ids: Array<number>): Promise<NotificationsViewResponse> => {
  const response = await fetch("/backend/notifications/view-notifications", {
    headers: { Authorization: getAuthToken() },
    method: "PATCH",
    body: JSON.stringify({ ids })
  })
  const data = await response.json()
  return data
}
