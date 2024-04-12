import { getAuthToken } from "./helpers"

export const getHistory = async (): Promise<any> => {
  const response = await fetch("/backend/booking-history", {
    headers: { Authorization: getAuthToken() }
  })
  const data = await response.json()
  return data
}
