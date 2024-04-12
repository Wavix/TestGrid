import { DB } from "@/app/database"

import type { RepositoryAttributes, RepositoryCreationAttributes } from "@/app/database/interfaces/repository.interface"

export class RepositoryService {
  public async getOrCreateRepositoryById(data: RepositoryCreationAttributes): Promise<RepositoryAttributes | Error> {
    try {
      const [item, created] = await DB.models.Repository.findOrCreate({
        where: { name: data.name, namespace_id: data.namespace_id },
        defaults: { ...data }
      })

      if (!created && !item) return new Error("Repository creation failed")

      return item
    } catch (error) {
      return error as Error
    }
  }

  public async findRepositoriesByNamespaceId(namespace_id: number): Promise<Array<RepositoryAttributes> | Error> {
    try {
      return await DB.models.Repository.findAll({
        where: {
          namespace_id
        },
        order: [["name", "ASC"]]
      })
    } catch (error) {
      return error as Error
    }
  }
}
