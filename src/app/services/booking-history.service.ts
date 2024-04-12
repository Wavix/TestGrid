import { DB } from "@/app/database"

import type {
  BookingHistoryAttributes,
  BookingHistoryInstance
} from "@/app/database/interfaces/booking-history.interface"
import type { BookStatus } from "@/interfaces/book.interface"
import type { BookingHistoryItem } from "@/interfaces/booking-history.interface"

export class BookingHistoryService {
  public async createBookingHistory(
    user_id: number,
    namespace_id: number,
    repository: string,
    stand: string,
    action: BookStatus
  ): Promise<BookingHistoryAttributes | Error> {
    try {
      const response = await DB.models.BookingHistory.create({
        user_id,
        namespace_id,
        stand,
        repository,
        action
      })

      if (!response) return new Error("Booking history creation failed")

      return response.toJSON()
    } catch (error) {
      return error as Error
    }
  }

  public async getBookingHistory(namespace_id: number): Promise<Array<BookingHistoryItem> | Error> {
    try {
      const response = await DB.models.BookingHistory.findAll({
        where: { namespace_id },
        order: [["created_at", "DESC"]],
        limit: 50,
        include: [
          {
            model: DB.models.User,
            as: "user",
            attributes: ["name", "id", "email"]
          }
        ],
        attributes: ["id", "stand", "repository", "created_at", "action"]
      })

      if (!response) return new Error("Error while getting booking history")

      return this.formatBookingHistoryResponse(response)
    } catch (error) {
      return error as Error
    }
  }

  public async getBookingHistoriesByUserId(
    namespace_id: number,
    user_id: number
  ): Promise<Array<BookingHistoryItem> | Error> {
    try {
      const response = await DB.models.BookingHistory.findAll({
        where: { namespace_id, user_id },
        order: [["created_at", "DESC"]],
        attributes: ["id", "stand", "repository", "created_at", "action"],
        include: [
          {
            model: DB.models.User,
            as: "user",
            attributes: ["name", "id", "email"]
          }
        ]
      })

      if (!response) return new Error("Error while getting booking history")

      return this.formatBookingHistoryResponse(response)
    } catch (error) {
      return error as Error
    }
  }

  private formatBookingHistoryResponse(histories: Array<BookingHistoryInstance>): Array<BookingHistoryItem> {
    return histories.map(item => ({
      id: item.id,
      stand: item.stand,
      repository: item.repository,
      created_at: item.created_at,
      action: item.action as BookStatus.Booked,
      user: item.user
        ? {
            id: item.user.id,
            email: item.user.email,
            name: item.user.name
          }
        : null
    }))
  }
}
