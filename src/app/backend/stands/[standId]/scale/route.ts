import httpStatus from "http-status"
import { NextResponse } from "next/server"

import { getBodyPayload } from "@/app/backend/helpers"
import { resolveClusterStand } from "@/app/backend/stands/helpers"
import { createStandControlService } from "@/app/services/k8s/stand-control"

import { scaleSchema } from "./validation"

import type { ErrorResponse } from "@/interfaces/general.interface"
import type { ScaleRequestBody, ScaleResponse } from "@/interfaces/stand-control.interface"

const standControlService = createStandControlService()

export const POST = async (
  request: Request,
  query: NextQuery
): Promise<NextResponse<ScaleResponse | ErrorResponse>> => {
  const context = await resolveClusterStand(request, query)
  if (context instanceof NextResponse) return context

  const { error, value } = scaleSchema.validate(await getBodyPayload(request))
  if (error) return NextResponse.json({ error: error.message }, { status: httpStatus.UNPROCESSABLE_ENTITY })

  const body = value as ScaleRequestBody
  const result = await standControlService.scale(context.stand, context.user, body.action, body.workload)
  if (!result.success) return NextResponse.json({ error: result.error }, { status: result.code })

  return NextResponse.json(result.data)
}
