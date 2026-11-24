import http from "http"

import { routeKey, startFakeServer } from "@/helpers/tests/fake-http.helper"

import { ClusterErrorReason, ClusterRequestError, requestJson } from "./http"

import type { AddressInfo } from "net"

const reasonOf = async (promise: Promise<unknown>): Promise<ClusterErrorReason | null> => {
  try {
    await promise
    return null
  } catch (e) {
    return e instanceof ClusterRequestError ? e.reason : null
  }
}

describe("Cluster HTTP request", () => {
  it.each([
    [401, ClusterErrorReason.Unauthorized],
    [403, ClusterErrorReason.Forbidden],
    [404, ClusterErrorReason.NotFound],
    [500, ClusterErrorReason.Unexpected]
  ])("maps status %d to a typed error", async (status, reason) => {
    const api = await startFakeServer()
    api.routes.set(routeKey("GET", "/thing"), () => ({ status, body: { message: "nope" } }))

    const result = await reasonOf(requestJson({ url: new URL("/thing", api.url), timeoutMs: 1000 }))
    await api.close()

    expect(result).toBe(reason)
  })

  it("reports a timeout as a typed error", async () => {
    const server = http.createServer(() => {})
    await new Promise<void>(resolve => {
      server.listen(0, "127.0.0.1", resolve)
    })
    const { port } = server.address() as AddressInfo

    const result = await reasonOf(requestJson({ url: new URL(`http://127.0.0.1:${port}/slow`), timeoutMs: 50 }))
    server.closeAllConnections()
    await new Promise(resolve => {
      server.close(resolve)
    })

    expect(result).toBe(ClusterErrorReason.Timeout)
  })
})
