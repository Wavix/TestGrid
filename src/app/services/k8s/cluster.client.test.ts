import { mkdtemp, rm, writeFile } from "fs/promises"
import http from "http"
import { tmpdir } from "os"
import path from "path"

import { K8sClusterClient } from "./cluster.client"

import type { K8sConfig } from "@/config"
import type { AddressInfo } from "net"

const STAND_LABEL = "example.org/stand"

interface ReceivedRequest {
  url: string
  authorization?: string
}

const startApiServer = async (status: number, body: unknown) => {
  const received: Array<ReceivedRequest> = []
  const server = http.createServer((request, response) => {
    received.push({ url: request.url || "", authorization: request.headers.authorization })
    response.writeHead(status, { "Content-Type": "application/json" })
    response.end(JSON.stringify(body))
  })

  await new Promise<void>(resolve => {
    server.listen(0, "127.0.0.1", resolve)
  })

  const { port } = server.address() as AddressInfo

  return {
    received,
    apiUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise(resolve => server.close(resolve))
  }
}

const optionsFor = (apiUrl: string, tokenFile = ""): K8sConfig => ({
  enabled: true,
  standLabel: STAND_LABEL,
  testgridNamespace: "myorg",
  apiUrl,
  tokenFile,
  caFile: ""
})

const namespace = (name: string, stand?: string) => ({
  metadata: { name, labels: stand ? { [STAND_LABEL]: stand } : {} }
})

describe("Kubernetes cluster client", () => {
  it("groups namespaces that share a stand label value into one stand", async () => {
    const api = await startApiServer(200, {
      items: [namespace("qa2", "qa2"), namespace("qa1", "qa1"), namespace("qa1-sip-nl", "qa1")]
    })

    const names = await new K8sClusterClient(optionsFor(api.apiUrl)).listStandNames()
    await api.close()

    expect(names).toEqual(["qa1", "qa2"])
    expect(api.received[0].url).toBe(`/api/v1/namespaces?labelSelector=${encodeURIComponent(STAND_LABEL)}`)
    expect(api.received[0].authorization).toBeUndefined()
  })

  it("sends the service account token as a bearer token", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "testgrid-k8s-"))
    const tokenFile = path.join(dir, "token")
    await writeFile(tokenFile, "sa-token\n")
    const api = await startApiServer(200, { items: [] })

    const names = await new K8sClusterClient(optionsFor(api.apiUrl, tokenFile)).listStandNames()
    await api.close()
    await rm(dir, { recursive: true })

    expect(names).toEqual([])
    expect(api.received[0].authorization).toBe("Bearer sa-token")
  })

  it("returns an error with the status when the API refuses the request", async () => {
    const api = await startApiServer(403, { message: "namespaces is forbidden" })

    const names = await new K8sClusterClient(optionsFor(api.apiUrl)).listStandNames()
    await api.close()

    expect(names).toBeInstanceOf(Error)
    expect((names as Error).message).toContain("403")
  })

  it("returns an error when the token file is missing", async () => {
    const api = await startApiServer(200, { items: [] })

    const names = await new K8sClusterClient(optionsFor(api.apiUrl, "/nonexistent/token")).listStandNames()
    await api.close()

    expect(Array.isArray(names)).toBe(false)
    expect((names as Error).message).toContain("ENOENT")
    expect(api.received).toHaveLength(0)
  })
})
