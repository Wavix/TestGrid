import { NextRequest } from "next/server"

type RequestBody = Record<string, unknown>
type RequestParams = Record<string, string | Array<string>>

class RequestHelper {
  private baseUrl = "http://localhost:3000"
  private token?: string

  constructor(token?: string) {
    this.token = token
  }

  public getRequest<T extends RequestParams>(params?: T) {
    const request = new NextRequest(this.baseUrl, {
      method: "GET",
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {}
    })

    return {
      request,
      ...(params ? { query: { params } } : {})
    }
  }

  public deleteRequest<T extends RequestParams>(params?: T) {
    const request = new NextRequest(this.baseUrl, {
      method: "DELETE",
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {}
    })

    return {
      request,
      ...(params ? { query: { params } } : {})
    }
  }

  public postRequest<T extends RequestBody>(body: T) {
    return new NextRequest(this.baseUrl, {
      method: "POST",
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      body: JSON.stringify(body)
    })
  }

  public patchRequest<T extends RequestBody, Q extends RequestParams>(body: T, params: Q) {
    const request = new NextRequest(this.baseUrl, {
      method: "PATCH",
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      body: JSON.stringify(body)
    })

    return {
      request,
      query: { params }
    }
  }
}

export default RequestHelper
