import httpStatus from "http-status"
import { NextResponse } from "next/server"

import { UserService } from "@/app/services/user.service"

import type { ErrorResponse } from "@/interfaces/general.interface"
import type { UserResetPasswordResponse } from "@/interfaces/user.interface"

const userService = new UserService()

export const PATCH = async (request: Request, query: NextQuery) => await resetPassword(request, query)

const resetPassword = async (
  request: Request,
  query: NextQuery
): Promise<NextResponse<UserResetPasswordResponse | ErrorResponse>> => {
  const user = await userService.checkToken(request)

  if (user instanceof Error) return NextResponse.json({ error: user.message }, { status: httpStatus.BAD_REQUEST })
  if (!user.is_admin) return NextResponse.json({ error: "Unauthorized" }, { status: httpStatus.FORBIDDEN })

  const userId = Number(query.params.userId || 0)
  if (!userId)
    return NextResponse.json({ error: "User id must be a number" }, { status: httpStatus.INTERNAL_SERVER_ERROR })

  try {
    const patchUser = await userService.resetPassword(userId)
    if (patchUser instanceof Error)
      return NextResponse.json({ error: patchUser.message }, { status: httpStatus.BAD_REQUEST })

    return NextResponse.json({ success: patchUser })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: httpStatus.BAD_REQUEST })
  }
}
