export enum BookStatus {
  Free = "free",
  Release = "release",
  Booked = "booked",
  Blocked = "blocked",
  SmokeTestStart = "smoke_test_start",
  SmokeTestStop = "smoke_test_stop"
}

export interface ReleaseStandResponse {
  success: boolean
}
