import httpStatus from "http-status"
import { NextResponse } from "next/server"

import { getBodyPayload } from "@/app/backend/helpers"
import { NamespaceService } from "@/app/services/namespace.service"
import { UserService } from "@/app/services/user.service"
import { parseBranchList } from "@/helpers/branch-list"

import { namespaceSettingsSchema } from "./validation"

import type { NamespaceAttributes } from "@/app/database/interfaces/namespace.interface"
import type { ErrorResponse } from "@/interfaces/general.interface"
import type { NamespaceSettingsResponse } from "@/interfaces/namespace.interface"

const userService = new UserService()
const namespaceService = new NamespaceService()

type SettingsResult = Promise<NextResponse<NamespaceSettingsResponse | ErrorResponse>>

const toSettingsResponse = (namespace: NamespaceAttributes) =>
  NextResponse.json({ settings: { booking_free_branches: parseBranchList(namespace.booking_free_branches) } })

export const GET = async (request: Request): SettingsResult => {
  const user = await userService.checkToken(request)
  if (user instanceof Error) return NextResponse.json({ error: "Invalid token" }, { status: httpStatus.FORBIDDEN })
  if (!user.is_admin) return NextResponse.json({ error: "Unauthorized" }, { status: httpStatus.FORBIDDEN })

  const namespace = await namespaceService.findNamespaceById(user.namespace.id)
  if (namespace instanceof Error)
    return NextResponse.json({ error: namespace.message }, { status: httpStatus.NOT_FOUND })

  return toSettingsResponse(namespace)
}

export const PATCH = async (request: Request): SettingsResult => {
  const user = await userService.checkToken(request)
  if (user instanceof Error) return NextResponse.json({ error: "Invalid token" }, { status: httpStatus.FORBIDDEN })
  if (!user.is_admin) return NextResponse.json({ error: "Unauthorized" }, { status: httpStatus.FORBIDDEN })

  const payload = await getBodyPayload(request)
  if (!payload) return NextResponse.json({ error: "Payload is required" }, { status: httpStatus.BAD_REQUEST })

  const result = namespaceSettingsSchema.validate(payload)
  if (result.error)
    return NextResponse.json({ error: result.error.message.replaceAll('"', "'") }, { status: httpStatus.BAD_REQUEST })

  const namespace = await namespaceService.updateBookingFreeBranches(
    user.namespace.id,
    result.value.booking_free_branches
  )
  if (namespace instanceof Error)
    return NextResponse.json({ error: namespace.message }, { status: httpStatus.BAD_REQUEST })

  return toSettingsResponse(namespace)
}
