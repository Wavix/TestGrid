import { DB } from "@/app/database"

import type {
  NotificationAttributes,
  NotificationCreationAttributes
} from "@/app/database/interfaces/notification.interface"

class Notification {
  public id!: number
  public data?: NotificationAttributes
  public userId: number

  constructor(userId: number) {
    this.userId = userId
  }

  public async create(payload?: Partial<NotificationCreationAttributes> | null): Promise<this> {
    const transaction = await DB.sequelize.transaction()

    try {
      const notificationData: NotificationCreationAttributes = {
        is_viewed: payload?.is_viewed || false,
        message: payload?.message || "Test message",
        user_id: this.userId
      }
      const notificationRaw = await DB.models.Notification.create(notificationData, { transaction })
      const notification = notificationRaw.toJSON()

      this.id = notification.id
      this.data = notification

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
      await DB.models.Notification.destroy({ where: { id: this.id }, transaction })

      await transaction.commit()
    } catch {
      await transaction.rollback()
    }
  }
}

export default Notification
