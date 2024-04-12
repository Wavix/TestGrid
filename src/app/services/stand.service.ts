import { DB } from "@/app/database"

import type { StandAttributes, StandCreationAttributes } from "@/app/database/interfaces/stand.interface"

export class StandService {
  public async getOrCreateStand(data: StandCreationAttributes): Promise<StandAttributes | Error> {
    try {
      const [item, created] = await DB.models.Stand.findOrCreate({
        where: { name: data.name, namespace_id: data.namespace_id },
        defaults: { ...data }
      })

      if (!created && !item) return new Error("Stand creation failed")

      return item
    } catch (e) {
      return e as Error
    }
  }

  public async findStandsByNamespaceId(namespace_id: number): Promise<Array<StandAttributes> | Error> {
    try {
      return await DB.models.Stand.findAll({
        where: {
          namespace_id
        },
        order: [["name", "ASC"]]
      })
    } catch (e) {
      return e as Error
    }
  }

  public async updateStand(payload: Partial<StandAttributes>, standId: number): Promise<StandAttributes | Error> {
    try {
      const stand = await DB.models.Stand.findByPk(standId)
      if (!stand) return new Error("Stand not found")

      return stand.update({ ...payload })
    } catch (e) {
      return e as Error
    }
  }
}
