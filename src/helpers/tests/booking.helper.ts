import { DB } from "@/app/database"

import type { BookingCreationAttributes, BookingAttributes } from "@/app/database/interfaces/booking.interface"
import type { RepositoryCreationAttributes, RepositoryInstance } from "@/app/database/interfaces/repository.interface"
import type { StandCreationAttributes, StandInstance } from "@/app/database/interfaces/stand.interface"
import type { UserAttributes } from "@/app/database/interfaces/user.interface"
import type { Transaction } from "sequelize"

class Booking {
  public id!: number
  public data?: BookingAttributes
  public user: UserAttributes

  constructor(user: UserAttributes) {
    this.user = user
  }

  public async create(payload?: Partial<BookingCreationAttributes> | null): Promise<this> {
    const transaction = await DB.sequelize.transaction()

    try {
      const stand = await this.getOrCreateStand(transaction, payload?.stand_id)
      const repository = await this.getOrCreateRepository(transaction, payload?.repository_id)

      const bookingData: BookingCreationAttributes = {
        user_id: payload?.user_id || this.user.id,
        namespace_id: payload?.namespace_id || this.user.namespace_id,
        branch_name: payload?.branch_name || "test/test",
        stand_id: payload?.stand_id || stand.id,
        repository_id: payload?.repository_id || repository.id
      }
      const bookingRaw = await DB.models.Booking.create(bookingData, { transaction })
      const booking = bookingRaw.toJSON()

      this.id = booking.id
      this.data = { ...booking, stand_name: stand, repository_name: repository }

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
      if (this.data) {
        await DB.models.Repository.destroy({ where: { id: this.data.repository_id }, transaction })
        await DB.models.Stand.destroy({ where: { id: this.data.stand_id }, transaction })
      }

      await DB.models.Booking.destroy({ where: { id: this.id }, transaction })

      await transaction.commit()
    } catch {
      await transaction.rollback()
    }
  }

  private async getOrCreateRepository(transaction: Transaction, repositoryId?: number): Promise<RepositoryInstance> {
    const repositoryData: RepositoryCreationAttributes = {
      name: "Created Repository",
      namespace_id: this.user.namespace_id
    }

    const [repository] = await DB.models.Repository.findOrCreate({
      where: { ...(repositoryId && { id: repositoryId }) },
      defaults: repositoryData,
      transaction
    })

    return repository
  }

  private async getOrCreateStand(transaction: Transaction, standId?: number): Promise<StandInstance> {
    const standData: StandCreationAttributes = {
      name: "Created stand",
      namespace_id: this.user.namespace_id,
      is_smoke_test: false
    }

    const [stand] = await DB.models.Stand.findOrCreate({
      where: { ...(standId && { id: standId }) },
      defaults: standData,
      transaction
    })

    return stand
  }
}

export default Booking
