import http from "http"
import https from "https"

export enum ClusterErrorReason {
  Unauthorized = "unauthorized",
  Forbidden = "forbidden",
  NotFound = "not_found",
  Timeout = "timeout",
  Unexpected = "unexpected"
}

export class ClusterRequestError extends Error {
  public readonly reason: ClusterErrorReason

  constructor(reason: ClusterErrorReason, message: string) {
    super(message)
    this.name = "ClusterRequestError"
    this.reason = reason
  }
}

export interface JsonRequest {
  url: URL
  method?: "GET" | "PATCH" | "POST" | "DELETE"
  headers?: Record<string, string>
  body?: string
  ca?: Buffer
  timeoutMs: number
}

const HTTP_UNAUTHORIZED = 401
const HTTP_FORBIDDEN = 403
const HTTP_NOT_FOUND = 404
const BODY_EXCERPT_LENGTH = 200

const isSuccess = (status: number): boolean => status >= 200 && status < 300

const reasonFor = (status: number): ClusterErrorReason => {
  if (status === HTTP_UNAUTHORIZED) return ClusterErrorReason.Unauthorized
  if (status === HTTP_FORBIDDEN) return ClusterErrorReason.Forbidden
  if (status === HTTP_NOT_FOUND) return ClusterErrorReason.NotFound

  return ClusterErrorReason.Unexpected
}

export const isForbidden = (error: unknown): boolean =>
  error instanceof ClusterRequestError && error.reason === ClusterErrorReason.Forbidden

export const requestJson = <T>({ url, method = "GET", headers = {}, body, ca, timeoutMs }: JsonRequest): Promise<T> => {
  const label = `${method} ${url.host}${url.pathname}`
  const options = {
    method,
    headers: { Accept: "application/json", ...headers },
    timeout: timeoutMs,
    ...(ca && { ca })
  }

  return new Promise<T>((resolve, reject) => {
    const onResponse = (response: http.IncomingMessage) => {
      const chunks: Array<Buffer> = []

      response.on("data", (chunk: Buffer) => chunks.push(chunk))
      response.on("error", reject)
      response.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8")
        const status = response.statusCode || 0

        if (!isSuccess(status)) {
          reject(
            new ClusterRequestError(
              reasonFor(status),
              `${label} responded ${status}: ${text.slice(0, BODY_EXCERPT_LENGTH)}`
            )
          )
          return
        }

        try {
          resolve(JSON.parse(text) as T)
        } catch (e) {
          reject(new ClusterRequestError(ClusterErrorReason.Unexpected, `${label} returned invalid JSON: ${e}`))
        }
      })
    }

    const request =
      url.protocol === "https:" ? https.request(url, options, onResponse) : http.request(url, options, onResponse)

    request.on("timeout", () =>
      request.destroy(new ClusterRequestError(ClusterErrorReason.Timeout, `${label} timed out`))
    )
    request.on("error", reject)
    request.end(body)
  })
}
