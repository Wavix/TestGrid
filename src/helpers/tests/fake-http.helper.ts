import http from "http"

import type { AddressInfo } from "net"

export interface FakeRequest {
  method: string
  path: string
  query: URLSearchParams
  body: string
  contentType?: string
}

export interface FakeReply {
  status: number
  body: unknown
}

export type FakeRoute = (request: FakeRequest) => FakeReply

export interface FakeServer {
  url: string
  received: Array<FakeRequest>
  routes: Map<string, FakeRoute>
  close: () => Promise<void>
}

const NOT_FOUND: FakeReply = { status: 404, body: { message: "not found" } }

export const routeKey = (method: string, path: string): string => `${method} ${path}`

export const startFakeServer = async (): Promise<FakeServer> => {
  const received: Array<FakeRequest> = []
  const routes = new Map<string, FakeRoute>()

  const server = http.createServer((request, response) => {
    const chunks: Array<Buffer> = []

    request.on("data", (chunk: Buffer) => chunks.push(chunk))
    request.on("end", () => {
      const url = new URL(request.url || "/", "http://fake")
      const fakeRequest: FakeRequest = {
        method: request.method || "GET",
        path: url.pathname,
        query: url.searchParams,
        body: Buffer.concat(chunks).toString("utf8"),
        contentType: request.headers["content-type"]
      }
      received.push(fakeRequest)

      const route = routes.get(routeKey(fakeRequest.method, fakeRequest.path))
      const reply = route ? route(fakeRequest) : NOT_FOUND

      response.writeHead(reply.status, { "Content-Type": "application/json" })
      response.end(JSON.stringify(reply.body))
    })
  })

  await new Promise<void>(resolve => {
    server.listen(0, "127.0.0.1", resolve)
  })

  const { port } = server.address() as AddressInfo

  return {
    url: `http://127.0.0.1:${port}`,
    received,
    routes,
    close: () =>
      new Promise<void>(resolve => {
        server.close(() => resolve())
      })
  }
}
