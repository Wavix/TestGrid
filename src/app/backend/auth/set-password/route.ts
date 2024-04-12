import httpStatus from "http-status"
import { NextResponse } from "next/server"

import { getBodyPayload } from "@/app/backend/helpers"
import { UserService } from "@/app/services/user.service"

const userService = new UserService()

export const POST = async (request: Request) => await setPassword(request)

const setPassword = async (request: Request) => {
  try {
    const payload = await getBodyPayload(request)

    const { email, password } = payload

    const user = await userService.setPassword(email, password)
    if (user instanceof Error) return NextResponse.json({ error: user.message }, { status: httpStatus.FORBIDDEN })

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: httpStatus.FORBIDDEN })
  }
}
