import httpStatus from "http-status"
import { NextResponse } from "next/server"

import { getBodyPayload } from "@/app/backend/helpers"
import { NotificationService } from "@/app/services/notification.service"
import { UserService } from "@/app/services/user.service"

import type { NotificationsViewResponse } from "@/app/backend/notifications/interface"
import type { ErrorResponse } from "@/interfaces/general.interface"

const userService = new UserService()
const notificationService = new NotificationService()

export const PATCH = async (request: Request) => await viewNotifications(request)

const viewNotifications = async (
  request: Request
): Promise<NextResponse<NotificationsViewResponse | ErrorResponse>> => {
  try {
    const user = await userService.checkToken(request)
    if (user instanceof Error) return NextResponse.json({ error: "Invalid token" }, { status: httpStatus.FORBIDDEN })

    const payload = await getBodyPayload(request)

    if (!payload) return NextResponse.json({ error: "Payload is required" }, { status: httpStatus.BAD_REQUEST })

    const { ids } = payload
    if (!ids) return NextResponse.json({ error: "IDs array is empty" }, { status: httpStatus.BAD_REQUEST })

    const response = await notificationService.viewNotifications(ids)
    if (response instanceof Error)
      return NextResponse.json({ error: response.message }, { status: httpStatus.BAD_REQUEST })

    return NextResponse.json({ success: response })
  } catch (e) {
    return NextResponse.json({ error: "Error while getting notifications" }, { status: httpStatus.BAD_REQUEST })
  }
}
