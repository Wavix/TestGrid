import { getAuthToken } from "./helpers"

import type { Dashboard } from "@/app/backend/dashboard/interface"

export const getBooking = async (): Promise<Dashboard & ApiResponseError> => {
  const response = await fetch("/backend/dashboard", {
    headers: { Authorization: getAuthToken() }
  })
  const data = await response.json()
  return data
}

export const release = async (bookingId: number): Promise<ApiResponseBasic & ApiResponseError> => {
  const response = await fetch(`/backend/book-stand/${bookingId}`, {
    headers: { Authorization: getAuthToken() },
    method: "DELETE"
  })
  const data = await response.json()
  return data
}
