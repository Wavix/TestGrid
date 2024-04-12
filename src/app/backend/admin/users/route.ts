import httpStatus from "http-status"
import { NextResponse } from "next/server"

import { UserService } from "@/app/services/user.service"

import type { UserListResponse } from "@/interfaces/auth.interface"
import type { ErrorResponse } from "@/interfaces/general.interface"

const userService = new UserService()

export const GET = async (request: Request) => await getUsers(request)

const getUsers = async (request: Request): Promise<NextResponse<UserListResponse | ErrorResponse>> => {
  try {
    const user = await userService.checkToken(request)
    if (user instanceof Error) return NextResponse.json({ error: "Invalid token" }, { status: httpStatus.FORBIDDEN })

    if (!user.is_admin) return NextResponse.json({ error: "Unauthorized" }, { status: httpStatus.NOT_FOUND })

    const users = await userService.getUsersList(user.namespace.id, [
      ["is_admin", "DESC"],
      ["is_active", "DESC"],
      ["name", "ASC"]
    ])
    if (users instanceof Error) return NextResponse.json({ error: users.message }, { status: httpStatus.FORBIDDEN })

    return NextResponse.json({ users })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: httpStatus.FORBIDDEN })
  }
}
