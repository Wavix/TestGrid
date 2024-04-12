import { DB } from "@/app/database"

import type { RepositoryAttributes, RepositoryCreationAttributes } from "@/app/database/interfaces/repository.interface"

class Repository {
  public id!: number
  public data?: RepositoryAttributes
  public namespaceId: number

  constructor(namespaceId: number) {
    this.namespaceId = namespaceId
  }

  public async create(payload?: Partial<RepositoryCreationAttributes> | null): Promise<this> {
    const transaction = await DB.sequelize.transaction()

    try {
      const repositoryData: RepositoryCreationAttributes = {
        name: payload?.name || "Created repository",
        namespace_id: payload?.namespace_id || this.namespaceId
      }
      const repositoryRaw = await DB.models.Repository.create(repositoryData, { transaction })
      const repository = repositoryRaw.toJSON()

      this.id = repository.id
      this.data = repository

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
      await DB.models.Repository.destroy({ where: { id: this.id }, transaction })

      await transaction.commit()
    } catch {
      await transaction.rollback()
    }
  }
}

export default Repository
