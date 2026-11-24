import { useCallback, useEffect, useState } from "react"

import { getStandState } from "@/ui/api/stand"

import type { StandStateResponse } from "@/interfaces/stand-control.interface"

const REFRESH_INTERVAL_MS = 10_000

export interface StandStateHook {
  state: StandStateResponse | null
  error: string | null
  refresh: () => Promise<void>
}

export const useStandState = (standId: number, isOpen: boolean): StandStateHook => {
  const [state, setState] = useState<StandStateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const response = await getStandState(standId)

      if (response.error) {
        setError(response.error)
        return
      }

      setState(response as StandStateResponse)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [standId])

  useEffect(() => {
    if (!isOpen) return undefined

    refresh()
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [isOpen, refresh])

  return { state, error, refresh }
}
