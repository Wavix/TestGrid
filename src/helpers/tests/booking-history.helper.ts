import { DB } from "@/app/database"

import type {
  BookingHistoryAttributes,
  BookingHistoryCreationAttributes
} from "@/app/database/interfaces/booking-history.interface"

class BookingHistory {
  public id!: number
  public data?: BookingHistoryAttributes

  public async create(payload: BookingHistoryCreationAttributes): Promise<this> {
    const transaction = await DB.sequelize.transaction()

    try {
      const historyData: BookingHistoryCreationAttributes = {
        user_id: payload.user_id,
        namespace_id: payload.namespace_id,
        stand: payload.stand,
        repository: payload.repository,
        action: payload.action
      }
      const historyRaw = await DB.models.BookingHistory.create(historyData, { transaction })
      const history = historyRaw.toJSON()

      this.id = history.id
      this.data = history

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
      await DB.models.BookingHistory.destroy({ where: { id: this.id }, transaction })

      await transaction.commit()
    } catch {
      await transaction.rollback()
    }
  }
}

export default BookingHistory
