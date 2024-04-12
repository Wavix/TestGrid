import httpStatus from "http-status"
import { NextResponse } from "next/server"

import { BookingHistoryService } from "@/app/services/booking-history.service"
import { BookingService } from "@/app/services/booking.service"
import { UserService } from "@/app/services/user.service"
import { BookStatus } from "@/interfaces/book.interface"

import type { ReleaseStandResponse } from "@/interfaces/book.interface"
import type { ErrorResponse } from "@/interfaces/general.interface"

const bookingService = new BookingService()
const userService = new UserService()
const bookingHistoryService = new BookingHistoryService()

export const DELETE = async (request: Request, query: NextQuery) => await releaseStand(request, query)

const releaseStand = async (
  request: Request,
  query: NextQuery
): Promise<NextResponse<ReleaseStandResponse | ErrorResponse>> => {
  const user = await userService.checkToken(request)

  if (user instanceof Error) return NextResponse.json({ error: user.message }, { status: httpStatus.BAD_REQUEST })

  const bookingId = Number(query.params.bookingId || 0)
  if (!bookingId) return NextResponse.json({ error: "Booking id must be a number" }, { status: httpStatus.BAD_REQUEST })

  try {
    const booking = await bookingService.findBookingById(bookingId)
    if (booking instanceof Error)
      return NextResponse.json({ error: booking.message }, { status: httpStatus.BAD_REQUEST })

    const success = await bookingService.removeBooking(bookingId, user, booking)

    if (success) {
      const bookingHistoryResult = await bookingHistoryService.createBookingHistory(
        user.id,
        user.namespace.id,
        booking.repository?.name || "",
        booking.stand?.name || "",
        BookStatus.Release
      )

      if (bookingHistoryResult instanceof Error)
        return NextResponse.json({ error: bookingHistoryResult.message }, { status: httpStatus.BAD_REQUEST })
    }

    return NextResponse.json({ success })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: httpStatus.BAD_REQUEST })
  }
}
