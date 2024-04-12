import { DB } from "../database"

import type {
  BookingAttributes,
  BookingCreationAttributes,
  BookingInstance
} from "@/app/database/interfaces/booking.interface"
import type { RepositoryAttributes } from "@/app/database/interfaces/repository.interface"
import type { StandAttributes } from "@/app/database/interfaces/stand.interface"
import type { UserResponseWithNameSpace } from "@/interfaces/auth.interface"

export interface BookingWithStandAndRepositoryResponse extends BookingInstance {
  repository?: RepositoryAttributes
  stand?: StandAttributes
}

interface StandBookingResponse {
  is_already_booked: boolean
  is_booking_allowed: boolean
  booked_user: BookingInstance | null
}

class BookingService {
  public async createBooking(payload: BookingCreationAttributes): Promise<StandBookingResponse | Error> {
    const { user_id, namespace_id, branch_name, stand_id, repository_id } = payload

    const bookingByCurrentUser = await DB.models.Booking.findOne({
      where: {
        stand_id,
        user_id,
        namespace_id,
        repository_id
      }
    })

    if (bookingByCurrentUser?.id) return { is_already_booked: true, is_booking_allowed: true, booked_user: null }

    const bookingByAnotherUser = await DB.models.Booking.findOne({
      where: {
        stand_id,
        namespace_id,
        repository_id
      },
      include: [
        {
          model: DB.models.User,
          as: "user",
          attributes: ["name", "id", "email"]
        }
      ]
    })

    if (bookingByAnotherUser?.id)
      return {
        is_already_booked: true,
        is_booking_allowed: false,
        booked_user: bookingByAnotherUser
      }

    const response = await DB.models.Booking.create({
      stand_id,
      repository_id,
      user_id,
      branch_name,
      namespace_id
    })

    if (!response) throw new Error("Error while booking stand")

    return { is_already_booked: false, is_booking_allowed: true, booked_user: null }
  }

  public async findBookingByNamespaceId(namespace_id: number): Promise<Array<BookingAttributes> | Error> {
    try {
      return await DB.models.Booking.findAll({
        where: {
          namespace_id
        },
        include: [
          {
            model: DB.models.User,
            as: "user",
            attributes: ["name", "id", "email"]
          }
        ]
      })
    } catch (e) {
      return e as Error
    }
  }

  public async findBookingById(id: number): Promise<BookingWithStandAndRepositoryResponse | Error> {
    try {
      const booking = await DB.models.Booking.findByPk(id, {
        include: [
          {
            model: DB.models.Repository,
            as: "repository",
            attributes: ["name"]
          },
          {
            model: DB.models.Stand,
            as: "stand",
            attributes: ["name"]
          }
        ]
      })
      if (booking instanceof Error || !booking) throw new Error("Booking not found")

      return booking
    } catch (error) {
      return error as Error
    }
  }

  public async removeBooking(
    id: number,
    user: UserResponseWithNameSpace,
    booking: BookingWithStandAndRepositoryResponse
  ): Promise<boolean> {
    if (booking.user_id === user.id || user.is_admin) {
      return !!(await DB.models.Booking.destroy({ where: { id } }))
    }

    return false
  }

  public async removeBookingsForSmokingTest(standId: number): Promise<boolean | Error> {
    try {
      await DB.models.Booking.destroy({ where: { stand_id: standId } })

      return true
    } catch (error) {
      return error as Error
    }
  }
}

export { BookingService }
