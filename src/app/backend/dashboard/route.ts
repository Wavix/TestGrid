import httpStatus from "http-status"
import { NextResponse } from "next/server"

import { BookingService } from "@/app/services/booking.service"
import { DashboardService } from "@/app/services/dashboard.service"
import { NamespaceService } from "@/app/services/namespace.service"
import { RepositoryService } from "@/app/services/repository.service"
import { StandService } from "@/app/services/stand.service"
import { UserService } from "@/app/services/user.service"

import type { Dashboard } from "@/app/backend/dashboard/interface"
import type { ErrorResponse } from "@/interfaces/general.interface"

const namepsaceService = new NamespaceService()
const standService = new StandService()
const repositoryService = new RepositoryService()
const bookingService = new BookingService()
const dashboardService = new DashboardService()
const userService = new UserService()

export const GET = async (request: Request) => await getStandsDashboard(request)

const getStandsDashboard = async (request: Request): Promise<NextResponse<Dashboard | ErrorResponse>> => {
  try {
    const user = await userService.checkToken(request)
    if (user instanceof Error) return NextResponse.json({ error: "Invalid token" }, { status: httpStatus.FORBIDDEN })

    const namespace = await namepsaceService.findNamespaceById(user.namespace.id)
    if (namespace instanceof Error)
      return NextResponse.json({ error: namespace.message }, { status: httpStatus.NOT_FOUND })

    const stands = await standService.findStandsByNamespaceId(namespace.id)
    if (stands instanceof Error) return NextResponse.json({ error: stands.message }, { status: httpStatus.BAD_REQUEST })

    const books = await bookingService.findBookingByNamespaceId(namespace.id)
    if (books instanceof Error) return NextResponse.json({ error: books.message }, { status: httpStatus.BAD_REQUEST })

    const repositories = await repositoryService.findRepositoriesByNamespaceId(namespace.id)
    if (repositories instanceof Error)
      return NextResponse.json({ error: repositories.message }, { status: httpStatus.BAD_REQUEST })

    return NextResponse.json(
      { stands: dashboardService.getDashboard(stands, books, repositories, user) },
      { status: httpStatus.OK }
    )
  } catch (e) {
    return NextResponse.json({ error: "Can't get dashboard" }, { status: httpStatus.BAD_REQUEST })
  }
}
