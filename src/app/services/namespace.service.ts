import { DB } from "../database"

import { formatBranchList } from "@/helpers/branch-list"

import type { NamespaceAttributes } from "@/app/database/interfaces/namespace.interface"

export class NamespaceService {
  public async getOrCreateNamespace(name: string): Promise<NamespaceAttributes | Error> {
    try {
      const [item, created] = await DB.models.Namespace.findOrCreate({
        where: { name },
        defaults: { name }
      })

      if (!created && !item) return new Error("Namespace creation failed")

      return item
    } catch (error) {
      return error as Error
    }
  }

  public async findNamespaceById(namespace_id: number): Promise<NamespaceAttributes | Error> {
    try {
      const namespace = await DB.models.Namespace.findByPk(namespace_id)

      if (!namespace) return new Error("Namespace not found")

      return namespace
    } catch {
      return new Error("Namespace not found")
    }
  }

  public async updateBookingFreeBranches(
    namespace_id: number,
    branches: Array<string>
  ): Promise<NamespaceAttributes | Error> {
    try {
      const namespace = await DB.models.Namespace.findByPk(namespace_id)
      if (!namespace) return new Error("Namespace not found")

      return await namespace.update({ booking_free_branches: formatBranchList(branches) })
    } catch (error) {
      return error as Error
    }
  }
}
