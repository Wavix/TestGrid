import { useCallback, useEffect, useState } from "react"

import { getStandState } from "@/ui/api/stand"

import type { StandStateResponse } from "@/interfaces/stand-control.interface"

export interface StandStateHook {
  state: StandStateResponse | null
  error: string | null
  refresh: () => Promise<void>
}

export const useStandState = (standId: number, isEnabled: boolean, intervalMs: number): StandStateHook => {
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
    if (!isEnabled) return undefined

    refresh()
    const interval = setInterval(refresh, intervalMs)

    return () => clearInterval(interval)
  }, [isEnabled, intervalMs, refresh])

  return { state, error, refresh }
}
