import httpStatus from "http-status"
import { NextResponse } from "next/server"

import { getBodyPayload } from "@/app/backend/helpers"
import { BookingHistoryService } from "@/app/services/booking-history.service"
import { BookingService } from "@/app/services/booking.service"
import { NamespaceService } from "@/app/services/namespace.service"
import { NotificationService } from "@/app/services/notification.service"
import { RepositoryService } from "@/app/services/repository.service"
import { StandService } from "@/app/services/stand.service"
import { UserService } from "@/app/services/user.service"
import { BookStatus } from "@/interfaces/book.interface"

import { schema } from "./validation"

const namepsaceService = new NamespaceService()
const standService = new StandService()
const repositoryService = new RepositoryService()
const bookingService = new BookingService()
const bookingHistoryService = new BookingHistoryService()
const userService = new UserService()
const notificationService = new NotificationService()

export const POST = async (request: Request) => await deploymentRequest(request)

const deploymentRequest = async (request: Request) => {
  const payload = await getBodyPayload(request)

  if (!payload) return NextResponse.json({ error: "Payload is required" }, { status: httpStatus.BAD_REQUEST })

  const result = schema.validate(payload)
  if (result.error?.message)
    return NextResponse.json({ error: result.error.message.replaceAll('"', "'") }, { status: httpStatus.BAD_REQUEST })

  try {
    const namespace = await namepsaceService.getOrCreateNamespace(payload.namespace)
    if (namespace instanceof Error)
      return NextResponse.json({ error: namespace.message }, { status: httpStatus.BAD_REQUEST })

    const stand = await standService.getOrCreateStand({ name: payload.stand, namespace_id: namespace.id })
    if (stand instanceof Error) return NextResponse.json({ error: stand.message }, { status: httpStatus.BAD_REQUEST })

    const repository = await repositoryService.getOrCreateRepositoryById({
      name: payload.repository,
      namespace_id: namespace.id
    })
    if (repository instanceof Error)
      return NextResponse.json({ error: repository.message }, { status: httpStatus.BAD_REQUEST })

    const user = await userService.getOrCreateUser({
      name: payload.user_name,
      email: payload.user_email,
      password: "",
      namespace_id: namespace.id
    })

    if (user instanceof Error) return NextResponse.json({ error: user.message }, { status: httpStatus.BAD_REQUEST })

    if (stand.is_smoke_test) {
      await bookingHistoryService.createBookingHistory(
        user.id,
        namespace.id,
        repository.name,
        stand.name,
        BookStatus.Blocked
      )

      return NextResponse.json(`1|Smoke test is running now on ${stand.name}`.toUpperCase())
    }

    const bookingResult = await bookingService.createBooking({
      namespace_id: namespace.id,
      user_id: user.id,
      branch_name: payload.branch,
      stand_id: stand.id,
      repository_id: repository.id
    })

    if (bookingResult instanceof Error)
      return NextResponse.json({ error: bookingResult.message }, { status: httpStatus.BAD_REQUEST })

    if (!bookingResult.is_already_booked && bookingResult.is_booking_allowed) {
      const bookingHistoryResult = await bookingHistoryService.createBookingHistory(
        user.id,
        namespace.id,
        repository.name,
        stand.name,
        BookStatus.Booked
      )

      if (bookingHistoryResult instanceof Error) return bookingHistoryResult
    }

    if (bookingResult.is_already_booked && !bookingResult.is_booking_allowed) {
      await bookingHistoryService.createBookingHistory(
        user.id,
        namespace.id,
        repository.name,
        stand.name,
        BookStatus.Blocked
      )

      const bookedUserName = bookingResult.booked_user?.user?.name ? ` by ${bookingResult.booked_user?.user?.name}` : ""

      await notificationService.createNotification(
        user.id,
        `${stand.name} ${repository.name} is already booked${bookedUserName}`
      )

      return NextResponse.json(`1|Stand is already booked${bookedUserName}`.toUpperCase())
    }

    if (bookingResult.is_booking_allowed) {
      return NextResponse.json("Success!")
    }

    return NextResponse.json("1|Error")
  } catch (error) {
    return NextResponse.json("Success!")
  }
}
