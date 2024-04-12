import type { BaseNamespaceResponse } from "@/interfaces/namespace.interface"

export interface UserDetails {
  id: number
  name: string
  email: string
  is_admin: boolean
  is_active: boolean
  namespace: BaseNamespaceResponse | null
  created_at: Date
}

export interface UserUpdateResponse {
  user: UserDetails
}

export interface UserResetPasswordResponse {
  success: boolean
}
