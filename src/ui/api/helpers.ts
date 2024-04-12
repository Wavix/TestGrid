import dayjs from "dayjs"

export const getAuthToken = (): string => {
  const token = localStorage.getItem("auth_jwt")
  return token ? `Bearer ${token}` : ""
}

export const buildQueryString = (obj: { [key: string]: any }) => {
  const keyValuePairs = Object.entries(obj).map(
    ([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
  )
  return `?${keyValuePairs.join("&")}`
}

export const dateToString = (date: Date | null): string => {
  if (!date) return ""
  return dayjs(date).format("MM/DD/YYYY")
}
