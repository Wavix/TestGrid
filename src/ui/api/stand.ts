import { getAuthToken } from "./helpers"

import type {
  ScaleRequestBody,
  ScaleResponse,
  StandStateResponse,
  DeleteStandResponse
} from "@/interfaces/stand-control.interface"

const readJson = async <T>(response: Response): Promise<Partial<T> & ApiResponseError> => {
  try {
    return await response.json()
  } catch {
    const failure: ApiResponseError = { error: `Request failed with status ${response.status}` }
    return failure as Partial<T> & ApiResponseError
  }
}

export const getStandState = async (standId: number): Promise<Partial<StandStateResponse> & ApiResponseError> => {
  const response = await fetch(`/backend/stands/${standId}/state`, {
    headers: { Authorization: getAuthToken() }
  })

  return readJson<StandStateResponse>(response)
}

export const scaleStand = async (
  standId: number,
  body: ScaleRequestBody
): Promise<Partial<ScaleResponse> & ApiResponseError> => {
  const response = await fetch(`/backend/stands/${standId}/scale`, {
    headers: { Authorization: getAuthToken() },
    method: "POST",
    body: JSON.stringify(body)
  })

  return readJson<ScaleResponse>(response)
}

export const deleteStand = async (standId: number): Promise<Partial<DeleteStandResponse> & ApiResponseError> => {
  const response = await fetch(`/backend/stands/${standId}`, {
    headers: { Authorization: getAuthToken() },
    method: "DELETE"
  })

  return readJson<DeleteStandResponse>(response)
}
