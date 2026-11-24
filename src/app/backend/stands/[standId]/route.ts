import httpStatus from "http-status"
import { NextResponse } from "next/server"

import { resolveClusterStand } from "@/app/backend/stands/helpers"
import { createStandControlService } from "@/app/services/k8s/stand-control"

import type { ErrorResponse } from "@/interfaces/general.interface"
import type { DeleteStandResponse } from "@/interfaces/stand-control.interface"

const standControlService = createStandControlService()

export const DELETE = async (
  request: Request,
  query: NextQuery
): Promise<NextResponse<DeleteStandResponse | ErrorResponse>> => {
  const context = await resolveClusterStand(request, query)
  if (context instanceof NextResponse) return context

  const result = await standControlService.deleteStand(context.stand, context.user)
  if (!result.success) return NextResponse.json({ error: result.error }, { status: result.code })

  return NextResponse.json(result.data, { status: httpStatus.ACCEPTED })
}
