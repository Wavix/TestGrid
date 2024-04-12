import httpStatus from "http-status"
import { NextResponse } from "next/server"

import { getBodyPayload } from "@/app/backend/helpers"
import { BookingHistoryService } from "@/app/services/booking-history.service"
import { BookingService } from "@/app/services/booking.service"
import { StandService } from "@/app/services/stand.service"
import { UserService } from "@/app/services/user.service"
import { BookStatus } from "@/interfaces/book.interface"

import type { ErrorResponse } from "@/interfaces/general.interface"
import type { StandUpdateResponse } from "@/interfaces/stand.interface"

const userService = new UserService()
const standService = new StandService()
const bookingService = new BookingService()
const bookingHistoryService = new BookingHistoryService()

export const PATCH = async (request: Request, query: NextQuery) => await standPatch(request, query)

const standPatch = async (
  request: Request,
  query: NextQuery
): Promise<NextResponse<StandUpdateResponse | ErrorResponse>> => {
  const user = await userService.checkToken(request)

  if (user instanceof Error) return NextResponse.json({ error: user.message }, { status: httpStatus.BAD_REQUEST })
  if (!user.is_admin) return NextResponse.json({ error: "Unauthorized" }, { status: httpStatus.FORBIDDEN })

  const payload = await getBodyPayload(request)

  if (!payload) return NextResponse.json({ error: "Payload is required" }, { status: httpStatus.BAD_REQUEST })

  const standId = Number(query.params.standId || 0)
  if (!standId) return NextResponse.json({ error: "Stand ID must be a number" }, { status: httpStatus.BAD_REQUEST })

  try {
    const stand = await standService.updateStand(payload, standId)

    if (stand instanceof Error) return NextResponse.json({ error: stand.message }, { status: httpStatus.BAD_REQUEST })

    if (payload.is_smoke_test) {
      await bookingService.removeBookingsForSmokingTest(standId)

      await bookingHistoryService.createBookingHistory(
        user.id,
        user.namespace.id,
        "start smoke test",
        stand.name,
        BookStatus.SmokeTestStart
      )
    }

    if (payload.is_smoke_test === false && payload.is_smoke_test !== undefined) {
      await bookingHistoryService.createBookingHistory(
        user.id,
        user.namespace.id,
        "stop smoke test",
        stand.name,
        BookStatus.SmokeTestStop
      )
    }

    return NextResponse.json({ stand })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: httpStatus.BAD_REQUEST })
  }
}
