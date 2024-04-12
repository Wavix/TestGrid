import type {
  UserAuthFirstLoginResponse,
  UserResponseWithNameSpace,
  UserResponseWithToken
} from "@/interfaces/auth.interface"

export const auth = async (
  email: string,
  password: string
): Promise<UserResponseWithToken | UserAuthFirstLoginResponse | ApiResponseError> => {
  const response = await fetch("/backend/auth", {
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    method: "POST",
    body: JSON.stringify({ email, password })
  })
  const data = await response.json()
  return data.user ? data.user : data
}

export const setPassword = async (
  email: string,
  password: string
): Promise<UserResponseWithToken | ApiResponseError> => {
  const response = await fetch("/backend/auth/set-password", {
    method: "POST",
    body: JSON.stringify({ email, password })
  })
  const data = await response.json()
  return data.user ? data.user : data
}

export const checkToken = async (token: string): Promise<UserResponseWithNameSpace & ApiResponseError> => {
  const response = await fetch("/backend/auth", {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await response.json()
  return data.user ? data.user : data
}
