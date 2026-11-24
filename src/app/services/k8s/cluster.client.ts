import { readFile } from "fs/promises"
import http from "http"
import https from "https"

import type { K8sConfig } from "@/config"

export interface ClusterClient {
  listStandNames(): Promise<Array<string> | Error>
}

interface K8sNamespaceList {
  items: Array<{
    metadata: {
      name: string
      labels?: Record<string, string>
    }
  }>
}

const REQUEST_TIMEOUT_MS = 5000
const HTTP_OK = 200

export class K8sClusterClient implements ClusterClient {
  private readonly options: K8sConfig

  constructor(options: K8sConfig) {
    this.options = options
  }

  public async listStandNames(): Promise<Array<string> | Error> {
    try {
      const url = new URL("/api/v1/namespaces", this.options.apiUrl)
      url.searchParams.set("labelSelector", this.options.standLabel)

      const list = await this.getJson<K8sNamespaceList>(url)
      const names = list.items
        .map(item => item.metadata.labels?.[this.options.standLabel])
        .filter((name): name is string => Boolean(name))

      return Array.from(new Set(names)).sort()
    } catch (e) {
      return e as Error
    }
  }

  private async getJson<T>(url: URL): Promise<T> {
    const isHttps = url.protocol === "https:"
    // Kubernetes rotates the projected service account token, so it is read per request
    const token = this.options.tokenFile ? (await readFile(this.options.tokenFile, "utf8")).trim() : ""
    const ca = isHttps && this.options.caFile ? await readFile(this.options.caFile) : undefined
    const headers = { Accept: "application/json", ...(token && { Authorization: `Bearer ${token}` }) }

    return new Promise<T>((resolve, reject) => {
      const onResponse = (response: http.IncomingMessage) => {
        const chunks: Array<Buffer> = []

        response.on("data", (chunk: Buffer) => chunks.push(chunk))
        response.on("error", reject)
        response.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8")

          if (response.statusCode !== HTTP_OK) {
            reject(new Error(`Kubernetes API ${url.pathname} responded ${response.statusCode}: ${body.slice(0, 200)}`))
            return
          }

          try {
            resolve(JSON.parse(body) as T)
          } catch (e) {
            reject(e)
          }
        })
      }

      const request = isHttps
        ? https.get(url, { headers, ca, timeout: REQUEST_TIMEOUT_MS }, onResponse)
        : http.get(url, { headers, timeout: REQUEST_TIMEOUT_MS }, onResponse)

      request.on("timeout", () => request.destroy(new Error(`Kubernetes API ${url.pathname} timed out`)))
      request.on("error", reject)
    })
  }
}
