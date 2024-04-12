import { getAuthToken, buildQueryString, dateToString } from "./helpers"

import type { UserBookStatistics } from "@/interfaces/statistics.interface"

export const getMetric = async (from: Date | null, to: Date | null): Promise<UserBookStatistics> => {
  const query = buildQueryString({ from: dateToString(from), to: dateToString(to) })

  const response = await fetch(`/backend/stats${query}`, {
    headers: { Authorization: getAuthToken() }
  })
  const data = await response.json()
  return data
}
