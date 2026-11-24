import { useEffect, useState } from "react"

import { getClusterResources } from "@/ui/api/stand"

import style from "./style.module.scss"

import type { ClusterResourcesResponse } from "@/interfaces/stand-control.interface"
import type { FC } from "react"

const REFRESH_INTERVAL_MS = 30_000
const NOT_AVAILABLE = "n/a"

const formatValue = (value: number | null): string => (value === null ? NOT_AVAILABLE : String(value))

export const ClusterSummary: FC = () => {
  const [resources, setResources] = useState<ClusterResourcesResponse | null>(null)

  useEffect(() => {
    const refresh = async () => {
      const response = await getClusterResources().catch(() => null)
      if (!response || response.error) return

      setResources(response as ClusterResourcesResponse)
    }

    const refreshVisible = () => {
      if (!document.hidden) refresh()
    }

    refresh()
    const interval = setInterval(refreshVisible, REFRESH_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [])

  if (!resources) return null

  return (
    <div className={style.clusterSummary}>
      <span className={style.title}>Cluster</span>
      <span>
        CPU used <b>{formatValue(resources.cpu_used_cores)} cores</b>
      </span>
      <span>
        CPU requested{" "}
        <b>
          {formatValue(resources.cpu_requested_cores)} / {formatValue(resources.cpu_allocatable_cores)} cores
        </b>
      </span>
      <span>
        memory used <b>{formatValue(resources.memory_used_gib)} GiB</b>
      </span>
      <span>
        memory requested{" "}
        <b>
          {formatValue(resources.memory_requested_gib)} / {formatValue(resources.memory_allocatable_gib)} GiB
        </b>
      </span>
    </div>
  )
}
