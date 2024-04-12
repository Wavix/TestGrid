import { Op } from "sequelize"

import { DB } from "../database"

import { BookStatus } from "@/interfaces/book.interface"

import type {
  UserBookStatisticItem,
  UserBookStatisticsItem,
  UserBookStatistics,
  ShortUser
} from "@/interfaces/statistics.interface"

interface UserMetricsFilters {
  from: string
  to: string
  userId?: number
}

export class StatisticService {
  public async getUsersMetric(filters: UserMetricsFilters): Promise<UserBookStatistics | Error> {
    const usersMetrics = new Map<number, Array<UserBookStatisticItem>>()
    const users = new Map<number, ShortUser>()

    const result: Array<UserBookStatisticsItem> = []

    try {
      const response = await DB.models.BookingHistory.findAll({
        where: {
          action: BookStatus.Booked,
          created_at: { [Op.between]: [filters.from, filters.to] },
          ...(filters.userId && { user_id: filters.userId })
        },
        include: {
          model: DB.models.User,
          attributes: ["id", "email", "name"],
          as: "user"
        },
        order: [["created_at", "DESC"]],
        raw: true,
        nest: true
      })

      if (!response) return new Error("Error while getting statistic")

      for (const item of response) {
        if (!item.user) continue

        if (!users.has(item.user.id)) users.set(item.user.id, item.user)
        if (!usersMetrics.has(item.user.id)) usersMetrics.set(item.user.id, [])

        const userMetrics = usersMetrics.get(item.user.id)
        userMetrics?.push({ date: item.created_at })

        if (userMetrics) usersMetrics.set(item.user.id, userMetrics)
      }

      for (const [userId, user] of users) {
        result.push({
          user,
          statistics: usersMetrics.get(userId) || [],
          total: usersMetrics.get(userId)?.length || 0
        })
      }

      return {
        users: result,
        total: response.length
      }
    } catch (error) {
      return error as Error
    }
  }
}
