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
    const clusterStands = await this.clusterClient.listStands()
    if (clusterStands instanceof Error) return clusterStands

    const clusterStandNames = clusterStands.map(stand => stand.name)

    try {
      await DB.sequelize.transaction(async transaction => {
        const existing = await DB.models.Stand.findAll({
          where: { namespace_id: namespaceId, name: { [Op.in]: clusterStandNames } },
          transaction
        })
        const existingByName = new Map(existing.map(stand => [stand.name, stand]))

        await DB.models.Stand.bulkCreate(
          clusterStands
            .filter(stand => !existingByName.has(stand.name))
            .map(stand => ({ ...stand, namespace_id: namespaceId, source: StandSource.K8s })),
          { transaction }
        )

        await Promise.all(
          clusterStands.map(({ name, kind, owner }) =>
            existingByName.get(name)?.update({ source: StandSource.K8s, kind, owner }, { transaction })
          )
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
