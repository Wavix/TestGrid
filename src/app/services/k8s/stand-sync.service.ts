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
        const inCluster = { namespace_id: namespaceId, name: { [Op.in]: clusterStandNames } }
        const existing = await DB.models.Stand.findAll({ where: inCluster, transaction })
        const existingNames = new Set(existing.map(stand => stand.name))

        await DB.models.Stand.bulkCreate(
          clusterStandNames
            .filter(name => !existingNames.has(name))
            .map(name => ({ name, namespace_id: namespaceId, source: StandSource.K8s })),
          { transaction }
        )

        await DB.models.Stand.update(
          { source: StandSource.K8s },
          { where: { ...inCluster, source: { [Op.ne]: StandSource.K8s } }, transaction }
        )

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
