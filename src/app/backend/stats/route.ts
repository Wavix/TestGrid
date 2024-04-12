import dayjs from "dayjs"
import httpStatus from "http-status"
import { NextResponse } from "next/server"

import { StatisticService } from "@/app/services/statistic.service"
import { UserService } from "@/app/services/user.service"

import type { ErrorResponse } from "@/interfaces/general.interface"
import type { UserBookStatistics } from "@/interfaces/statistics.interface"

const userService = new UserService()
const statisticService = new StatisticService()

interface DateFilter {
  from: string
  to: string
}

export const GET = async (request: Request) => await getStatistic(request)

const getStatistic = async (request: Request): Promise<NextResponse<UserBookStatistics | ErrorResponse>> => {
  try {
    const user = await userService.checkToken(request)
    if (user instanceof Error) return NextResponse.json({ error: "Invalid token" }, { status: httpStatus.FORBIDDEN })

    if (!user.is_admin) return NextResponse.json({ error: "Unauthorized" }, { status: httpStatus.NOT_FOUND })

    const params = new URL(request.url).searchParams
    const dateFilter = getDateFilter(params.get("from"), params.get("to"))

    const filters = {
      from: dateFilter.from,
      to: dateFilter.to,
      ...(params.get("user_id") && { userId: Number(params.get("user_id")) })
    }

    const userBookMetric = await statisticService.getUsersMetric(filters)
    if (userBookMetric instanceof Error)
      return NextResponse.json({ error: userBookMetric.message }, { status: httpStatus.BAD_REQUEST })

    return NextResponse.json(userBookMetric)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: httpStatus.FORBIDDEN })
  }
}

const getDateFilter = (from: string | null, to: string | null): DateFilter => {
  const startFormat = "YYYY-MM-DD 00:00:00"
  const endFormat = "YYYY-MM-DD 23:59:59"
  const startDate = from ? dayjs(from, "MM/DD/YYYY").format(startFormat) : dayjs().startOf("month").format(startFormat)
  const endDate = to
    ? dayjs(to, "MM/DD/YYYY").format(endFormat)
    : dayjs(startDate, startFormat).endOf("month").format(endFormat)

  return { from: startDate, to: endDate }
}
