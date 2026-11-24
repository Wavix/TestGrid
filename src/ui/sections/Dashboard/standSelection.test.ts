import { StandKind, StandSource } from "@/interfaces/stand.interface"

import { freeModulesCount, isStandFreeFor, selectStand } from "./standSelection"

import type { DashboardRepositoryItem, DashboardStandItem } from "@/app/backend/dashboard/interface"

const booking = {
  id: 7,
  created_at: new Date("2026-01-01T00:00:00Z"),
  branch_name: "feature/DEV-1-x",
  task_name: "DEV-1",
  user: { id: 1, name: "Ann", email: "ann@example.org" }
}

const repository = (id: number, name: string, isBooked = false): DashboardRepositoryItem => ({
  id,
  name,
  booking: isBooked ? booking : null
})

const stand = (
  name: string,
  repositories: Array<DashboardRepositoryItem>,
  overrides: Partial<DashboardStandItem> = {}
): DashboardStandItem => ({
  id: name.length,
  name,
  is_smoke_test: false,
  source: StandSource.K8s,
  kind: StandKind.Permanent,
  owner: null,
  repositories,
  ...overrides
})

const qa1 = stand("qa1", [repository(1, "backend", true), repository(2, "frontend")])
const qa2 = stand("qa2", [repository(1, "backend"), repository(2, "frontend")])
const qa3Smoke = stand("qa3", [repository(1, "backend"), repository(2, "frontend")], { is_smoke_test: true })
const personal = stand("dev-ann", [repository(1, "backend"), repository(2, "frontend")], {
  kind: StandKind.Ephemeral
})

describe("stand selection", () => {
  it("selects the stand named in the URL", () => {
    expect(selectStand([qa1, qa2], "qa2")).toBe(qa2)
  })

  it("selects qa1 when the URL names no stand or a stand that no longer exists", () => {
    expect(selectStand([qa2, qa1], undefined)).toBe(qa1)
    expect(selectStand([qa2, qa1], "dev-gone")).toBe(qa1)
  })

  it("selects the first stand when qa1 is not listed", () => {
    expect(selectStand([qa2, personal], "dev-gone")).toBe(qa2)
  })

  it("counts modules without a booking as free, and none on a stand in smoke test mode", () => {
    expect(freeModulesCount(qa1)).toBe(1)
    expect(freeModulesCount(qa2)).toBe(2)
    expect(freeModulesCount(qa3Smoke)).toBe(0)
  })

  it("matches only shared stands where every picked component is free", () => {
    const picked = ["backend", "frontend"]

    expect([qa1, qa2, qa3Smoke, personal].filter(item => isStandFreeFor(item, picked))).toEqual([qa2])
    expect(isStandFreeFor(qa1, ["frontend"])).toBe(true)
    expect(isStandFreeFor(qa2, ["backend", "unknown"])).toBe(false)
  })

  it("matches no stand when no component is picked", () => {
    expect(isStandFreeFor(qa2, [])).toBe(false)
  })
})
