import { StandKind } from "@/interfaces/stand.interface"

import type { DashboardRepositoryItem, DashboardStandItem } from "@/app/backend/dashboard/interface"

export const DEFAULT_STAND = "qa1"

const isFree = (stand: DashboardStandItem, repository: DashboardRepositoryItem): boolean =>
  !stand.is_smoke_test && !repository.booking

export const isPersonalStand = (stand: DashboardStandItem): boolean => stand.kind === StandKind.Ephemeral

export const selectStand = (
  stands: Array<DashboardStandItem>,
  requested: string | undefined
): DashboardStandItem | undefined =>
  stands.find(stand => stand.name === requested) || stands.find(stand => stand.name === DEFAULT_STAND) || stands.at(0)

export const freeModulesCount = (stand: DashboardStandItem): number =>
  stand.repositories.filter(repository => isFree(stand, repository)).length

export const isStandFreeFor = (stand: DashboardStandItem, components: Array<string>): boolean => {
  if (!components.length || isPersonalStand(stand)) return false

  return components.every(component =>
    stand.repositories.some(repository => repository.name === component && isFree(stand, repository))
  )
}
