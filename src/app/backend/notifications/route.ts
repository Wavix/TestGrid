import httpStatus from "http-status"
import { NextResponse } from "next/server"

import { NotificationService } from "@/app/services/notification.service"
import { UserService } from "@/app/services/user.service"

import type { NotificationsListResponse } from "@/app/backend/notifications/interface"
import type { ErrorResponse } from "@/interfaces/general.interface"

const userService = new UserService()
const notificationService = new NotificationService()

export const GET = async (request: Request) => await getNotifications(request)

const getNotifications = async (request: Request): Promise<NextResponse<NotificationsListResponse | ErrorResponse>> => {
  try {
    const user = await userService.checkToken(request)
    if (user instanceof Error) return NextResponse.json({ error: "Invalid token" }, { status: httpStatus.FORBIDDEN })

    const notifications = await notificationService.getNotificationsByUserId(user.id)
    if (notifications instanceof Error)
      return NextResponse.json({ error: notifications.message }, { status: httpStatus.BAD_REQUEST })

    return NextResponse.json({ notifications })
  } catch (e) {
    return NextResponse.json({ error: "Error while getting notifications" }, { status: httpStatus.BAD_REQUEST })
  }
}
