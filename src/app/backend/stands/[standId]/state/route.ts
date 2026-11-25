import { NextResponse } from "next/server"

import { resolveClusterStand } from "@/app/backend/stands/helpers"
import { createStandControlService } from "@/app/services/k8s/stand-control"

import type { ErrorResponse } from "@/interfaces/general.interface"
import type { StandStateResponse } from "@/interfaces/stand-control.interface"

const standControlService = createStandControlService()

export const GET = async (
  request: Request,
  query: NextQuery
): Promise<NextResponse<StandStateResponse | ErrorResponse>> => {
  const context = await resolveClusterStand(request, query)
  if (context instanceof NextResponse) return context

  const result = await standControlService.getState(context.stand, context.user)
  if (!result.success) return NextResponse.json({ error: result.error }, { status: result.code })

  return NextResponse.json(result.data)
}
