import type { BaseNamespaceResponse } from "@/interfaces/namespace.interface"

export interface BaseUserResponse {
  id: number
  email: string
  is_admin: boolean
  name: string
}

export interface UserListItem extends BaseUserResponse {
  is_active: boolean
  created_at: Date
  namespace: BaseNamespaceResponse | null
}

export interface UserListResponse {
  users: Array<UserListItem>
}

export interface UserAuthFirstLoginResponse {
  is_first_login: boolean
}

export interface UserResponseWithNameSpace extends BaseUserResponse {
  namespace: BaseNamespaceResponse
}

export interface UserResponseWithToken extends BaseUserResponse {
  token: string
  namespace: BaseNamespaceResponse
}

export interface UserResponse {
  user: UserResponseWithToken
}

export interface UserCheckTokenResponse {
  user: UserResponseWithNameSpace
}
