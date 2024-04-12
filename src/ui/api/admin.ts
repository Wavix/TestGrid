import { getAuthToken } from "@/ui/api/helpers"

import type { UserListItem, UserListResponse } from "@/interfaces/auth.interface"
import type { BookingHistoryResponse } from "@/interfaces/booking-history.interface"
import type { StandItem, StandUpdateResponse } from "@/interfaces/stand.interface"
import type { UserResetPasswordResponse, UserUpdateResponse } from "@/interfaces/user.interface"

export const getUsers = async (): Promise<UserListResponse & ApiResponseError> => {
  const response = await fetch("/backend/admin/users", {
    headers: { Authorization: getAuthToken() }
  })

  return await response.json()
}

export const getUserBookingHistoriesById = async (
  userId: number
): Promise<BookingHistoryResponse & ApiResponseError> => {
  const response = await fetch(`/backend/booking-history/${userId}`, {
    headers: { Authorization: getAuthToken() }
  })

  return await response.json()
}

export const updateUser = async (body: UserListItem): Promise<UserUpdateResponse & ApiResponseError> => {
  const response = await fetch(`/backend/admin/users/${body.id}`, {
    headers: { Authorization: getAuthToken() },
    method: "PATCH",
    body: JSON.stringify({ ...body })
  })

  return await response.json()
}

export const updateStand = async (
  standId: number,
  body: Partial<StandItem>
): Promise<StandUpdateResponse & ApiResponseError> => {
  const response = await fetch(`/backend/admin/stands/${standId}`, {
    headers: { Authorization: getAuthToken() },
    method: "PATCH",
    body: JSON.stringify({ ...body })
  })

  return await response.json()
}

export const resetPassword = async (userId: number): Promise<UserResetPasswordResponse & ApiResponseError> => {
  const response = await fetch(`/backend/admin/users/reset-password/${userId}`, {
    headers: { Authorization: getAuthToken() },
    method: "PATCH"
  })

  return await response.json()
}
