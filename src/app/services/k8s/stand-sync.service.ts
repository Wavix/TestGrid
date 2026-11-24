import { Op } from "sequelize"

import { DB } from "@/app/database"
import { StandSource } from "@/interfaces/stand.interface"

import type { ClusterClient } from "./cluster.client"

export class StandSyncService {
  private readonly clusterClient: ClusterClient

  constructor(clusterClient: ClusterClient) {
    this.clusterClient = clusterClient
  }

  public async syncNamespaceStands(namespaceId: number): Promise<Error | null> {
    const clusterStandNames = await this.clusterClient.listStandNames()
    if (clusterStandNames instanceof Error) return clusterStandNames

    try {
      await DB.sequelize.transaction(async transaction => {
        for (const name of clusterStandNames) {
          const [stand] = await DB.models.Stand.findOrCreate({
            where: { name, namespace_id: namespaceId },
            defaults: { name, namespace_id: namespaceId, source: StandSource.K8s },
            transaction
          })

          if (stand.source !== StandSource.K8s) await stand.update({ source: StandSource.K8s }, { transaction })
        }

        await DB.models.Stand.destroy({
          where: { namespace_id: namespaceId, source: StandSource.K8s, name: { [Op.notIn]: clusterStandNames } },
          transaction
        })
      })

      return null
    } catch (e) {
      return e as Error
    }
  }
}
