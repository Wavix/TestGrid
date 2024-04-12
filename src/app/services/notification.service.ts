import { DB } from "../database"

import type { NotificationListItem } from "@/app/backend/notifications/interface"

export class NotificationService {
  public async getNotificationsByUserId(userId: number): Promise<Array<NotificationListItem> | Error> {
    try {
      const notifications = await DB.models.Notification.findAll({
        where: { user_id: userId, is_viewed: false },
        order: [["created_at", "DESC"]]
      })

      if (!notifications) return new Error("Error while getting notifications")

      return notifications.map(item => ({
        id: item.id,
        is_viewed: item.is_viewed,
        message: item.message,
        created_at: item.created_at
      }))
    } catch (error) {
      return error as Error
    }
  }

  public async viewNotifications(ids: Array<number>): Promise<boolean | Error> {
    try {
      const response = await DB.models.Notification.update(
        { is_viewed: true },
        {
          where: {
            id: ids
          }
        }
      )

      if (!response) return new Error("Notifications update failed")

      return true
    } catch {
      return new Error("Notifications update failed")
    }
  }

  public async createNotification(userId: number, message: string): Promise<boolean> {
    try {
      await DB.models.Notification.create({
        user_id: userId,
        is_viewed: false,
        message
      })

      return true
    } catch {
      return false
    }
  }
}
