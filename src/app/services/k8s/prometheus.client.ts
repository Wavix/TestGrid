import { ClusterErrorReason, ClusterRequestError, requestJson } from "./http"

export interface PrometheusSample {
  labels: Record<string, string>
  value: number
}

export interface MetricsClient {
  query(promql: string): Promise<Array<PrometheusSample> | Error>
}

interface PrometheusResponse {
  status: string
  error?: string
  data?: {
    resultType: string
    result: Array<{ metric: Record<string, string>; value: [number, string] }>
  }
}

const REQUEST_TIMEOUT_MS = 5000
const VECTOR = "vector"

export class PrometheusClient implements MetricsClient {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  public async query(promql: string): Promise<Array<PrometheusSample> | Error> {
    try {
      const url = new URL("/api/v1/query", this.baseUrl)
      url.searchParams.set("query", promql)

      const response = await requestJson<PrometheusResponse>({ url, timeoutMs: REQUEST_TIMEOUT_MS })

      if (response.status !== "success" || response.data?.resultType !== VECTOR) {
        return new ClusterRequestError(
          ClusterErrorReason.Unexpected,
          `Prometheus query failed: ${response.error || `${response.status} ${response.data?.resultType}`}`
        )
      }

      return response.data.result.map(sample => ({ labels: sample.metric, value: Number(sample.value[1]) }))
    } catch (e) {
      return e as Error
    }
  }
}
