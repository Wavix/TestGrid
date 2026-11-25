import { useState } from "react"

import { useFailureToast, useSuccessToast } from "@/hooks/toast"
import { ScaleAction } from "@/interfaces/stand-control.interface"
import { deleteStand, scaleStand } from "@/ui/api/stand"

import type { WorkloadRef } from "@/interfaces/stand-control.interface"

export const STAND_KEY = "stand"
export const DELETE_KEY = "delete"

export interface StandControl {
  busyKey: string | null
  actionLabel: (key: string, label: string) => string
  runScale: (key: string, action: ScaleAction, workload?: WorkloadRef) => Promise<void>
  runDelete: () => Promise<void>
}

export const workloadKey = (workload: WorkloadRef): string => `${workload.kind}/${workload.name}`

export const useStandControl = (standId: number, isShared: boolean, refresh: () => Promise<void>): StandControl => {
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [confirmKey, setConfirmKey] = useState<string | null>(null)
  const successToast = useSuccessToast()
  const failureToast = useFailureToast()

  const needsConfirm = (key: string, action: ScaleAction | typeof DELETE_KEY): boolean => {
    const isRisky = action === DELETE_KEY || (isShared && action === ScaleAction.Stop)
    if (!isRisky || confirmKey === key) return false

    setConfirmKey(key)
    return true
  }

  const runScale = async (key: string, action: ScaleAction, workload?: WorkloadRef) => {
    if (needsConfirm(key, action)) return

    setConfirmKey(null)
    setBusyKey(key)
    const response = await scaleStand(standId, { action, workload }).catch((e: Error) => ({
      error: e.message,
      failures: undefined
    }))
    setBusyKey(null)

    if (response.error) {
      failureToast(response.error)
    } else if (response.failures?.length) {
      failureToast(response.failures.map(failure => `${failure.name}: ${failure.error}`).join("\n"))
    } else {
      successToast(`${action === ScaleAction.Stop ? "Stopped" : "Started"} ${workload?.name || "stand"}`)
    }

    await refresh()
  }

  const runDelete = async () => {
    if (needsConfirm(DELETE_KEY, DELETE_KEY)) return

    setConfirmKey(null)
    setBusyKey(DELETE_KEY)
    const response = await deleteStand(standId).catch((e: Error) => ({ error: e.message }))
    setBusyKey(null)

    if (response.error) {
      failureToast(response.error)
      return
    }

    successToast("Stand deletion started")
  }

  const actionLabel = (key: string, label: string): string =>
    confirmKey === key ? `Confirm ${label.toLowerCase()}` : label

  return { busyKey, actionLabel, runScale, runDelete }
}
