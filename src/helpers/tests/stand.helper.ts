import { DB } from "@/app/database"

import type { StandAttributes, StandCreationAttributes } from "@/app/database/interfaces/stand.interface"

class Stand {
  public id!: number
  public data?: StandAttributes
  public namespaceId: number

  constructor(namespaceId: number) {
    this.namespaceId = namespaceId
  }

  public async create(payload?: Partial<StandCreationAttributes> | null): Promise<this> {
    const transaction = await DB.sequelize.transaction()

    try {
      const standData: StandCreationAttributes = {
        name: payload?.name || "Created stand",
        is_smoke_test: payload?.is_smoke_test || false,
        namespace_id: payload?.namespace_id || this.namespaceId
      }
      const standRaw = await DB.models.Stand.create(standData, { transaction })
      const stand = standRaw.toJSON()

      this.id = stand.id
      this.data = stand

      await transaction.commit()

      return this
    } catch {
      await transaction.rollback()
      return this
    }
  }

  public async destroy(): Promise<void> {
    if (!this.id) return

    const transaction = await DB.sequelize.transaction()

    try {
      await DB.models.Stand.destroy({ where: { id: this.id }, transaction })

      await transaction.commit()
    } catch {
      await transaction.rollback()
    }
  }
}

export default Stand
