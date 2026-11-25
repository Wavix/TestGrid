export interface BaseNamespaceResponse {
  id: number
  name: string
}

export interface NamespaceSettings {
  booking_free_branches: Array<string>
}

export interface NamespaceSettingsResponse {
  settings: NamespaceSettings
}
