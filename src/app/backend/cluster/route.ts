import httpStatus from "http-status"
import { NextResponse } from "next/server"

import { createStandControlService } from "@/app/services/k8s/stand-control"
import { UserService } from "@/app/services/user.service"
import { config } from "@/config"

import type { ErrorResponse } from "@/interfaces/general.interface"
import type { ClusterResourcesResponse } from "@/interfaces/stand-control.interface"

const userService = new UserService()
const standControlService = createStandControlService()

export const GET = async (request: Request): Promise<NextResponse<ClusterResourcesResponse | ErrorResponse>> => {
  const user = await userService.checkToken(request)
  if (user instanceof Error) return NextResponse.json({ error: "Invalid token" }, { status: httpStatus.UNAUTHORIZED })
  if (!config.k8s.enabled)
    return NextResponse.json({ error: "Kubernetes stands are disabled" }, { status: httpStatus.NOT_FOUND })

  return NextResponse.json(await standControlService.getClusterResources())
}
