import { config } from "@/config"

import { K8sClusterClient } from "./cluster.client"
import { StandSyncService } from "./stand-sync.service"

import type { NamespaceAttributes } from "@/app/database/interfaces/namespace.interface"

const SYNC_INTERVAL_MS = 30_000

let lastSyncAt = 0

export const syncK8sStands = async (namespace: NamespaceAttributes): Promise<void> => {
  if (!config.k8s.enabled || namespace.name !== config.k8s.testgridNamespace) return
  if (Date.now() - lastSyncAt < SYNC_INTERVAL_MS) return

  lastSyncAt = Date.now()

  const standSyncService = new StandSyncService(new K8sClusterClient(config.k8s))
  const result = await standSyncService.syncNamespaceStands(namespace.id)

  if (result instanceof Error) console.error(`Kubernetes stand sync failed: ${result.message}`)
}
