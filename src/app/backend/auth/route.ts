import httpStatus from "http-status"
import { NextResponse } from "next/server"

import { getBodyPayload } from "../helpers"

import { UserService } from "@/app/services/user.service"

import type { UserAuthFirstLoginResponse, UserCheckTokenResponse, UserResponse } from "@/interfaces/auth.interface"
import type { ErrorResponse } from "@/interfaces/general.interface"

const userService = new UserService()

export const POST = async (request: Request) => await auth(request)

export const GET = async (request: Request) => await checkToken(request)

const auth = async (
  request: Request
): Promise<NextResponse<UserAuthFirstLoginResponse | UserResponse | ErrorResponse>> => {
  try {
    const payload = await getBodyPayload(request)
    const { email, password } = payload

    const firstLoginResponse = await userService.checkIsFirstLogin(email)
    if (firstLoginResponse instanceof Error)
      return NextResponse.json({ error: firstLoginResponse.message }, { status: httpStatus.FORBIDDEN })
    if (firstLoginResponse.is_first_login)
      return NextResponse.json({ is_first_login: firstLoginResponse.is_first_login })

    const user = await userService.auth(email, password)

    if (user instanceof Error) return NextResponse.json({ error: user.message }, { status: httpStatus.FORBIDDEN })
    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: httpStatus.FORBIDDEN })
  }
}

const checkToken = async (request: Request): Promise<NextResponse<UserCheckTokenResponse | ErrorResponse>> => {
  try {
    const user = await userService.checkToken(request)
    if (user instanceof Error) return NextResponse.json({ error: user.message }, { status: httpStatus.FORBIDDEN })
    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ error: "Token is invalid" }, { status: httpStatus.FORBIDDEN })
  }
}
