import httpStatus from "http-status"
import { NextResponse } from "next/server"

import { DB } from "@/app/database"
import { UserService } from "@/app/services/user.service"
import { config } from "@/config"
import { StandSource } from "@/interfaces/stand.interface"

import type { StandAttributes } from "@/app/database/interfaces/stand.interface"
import type { UserResponseWithNameSpace } from "@/interfaces/auth.interface"
import type { ErrorResponse } from "@/interfaces/general.interface"

export interface ClusterStandContext {
  user: UserResponseWithNameSpace
  stand: StandAttributes
}

const userService = new UserService()

const errorResponse = (error: string, status: number): NextResponse<ErrorResponse> =>
  NextResponse.json({ error }, { status })

export const resolveClusterStand = async (
  request: Request,
  query: NextQuery
): Promise<ClusterStandContext | NextResponse<ErrorResponse>> => {
  const user = await userService.checkToken(request)
  if (user instanceof Error) return errorResponse("Invalid token", httpStatus.UNAUTHORIZED)
  if (!config.k8s.enabled) return errorResponse("Kubernetes stands are disabled", httpStatus.NOT_FOUND)

  const params = await query.params
  const standId = Number(params.standId)
  if (!Number.isInteger(standId) || standId <= 0)
    return errorResponse("Stand ID must be a number", httpStatus.UNPROCESSABLE_ENTITY)

  const stand = await DB.models.Stand.findOne({
    where: { id: standId, namespace_id: user.namespace.id, source: StandSource.K8s },
    raw: true
  })
  if (!stand) return errorResponse("Stand not found", httpStatus.NOT_FOUND)

  return { user, stand }
}
