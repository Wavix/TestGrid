import httpStatus from "http-status"
import { NextResponse } from "next/server"

import { BookingHistoryService } from "@/app/services/booking-history.service"
import { UserService } from "@/app/services/user.service"

import type { BookingHistoryResponse } from "@/interfaces/booking-history.interface"
import type { ErrorResponse } from "@/interfaces/general.interface"

const bookingHistoryService = new BookingHistoryService()
const userService = new UserService()

export const GET = async (request: Request) => await getBookingHistory(request)

const getBookingHistory = async (request: Request): Promise<NextResponse<BookingHistoryResponse | ErrorResponse>> => {
  try {
    const user = await userService.checkToken(request)
    if (user instanceof Error) return NextResponse.json({ error: "Invalid token" }, { status: httpStatus.FORBIDDEN })

    const bookingHistory = await bookingHistoryService.getBookingHistory(user.namespace.id)

    if (bookingHistory instanceof Error)
      return NextResponse.json({ error: bookingHistory.message }, { status: httpStatus.BAD_REQUEST })

    return NextResponse.json({ booking_history: bookingHistory })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: httpStatus.BAD_REQUEST })
  }
}
