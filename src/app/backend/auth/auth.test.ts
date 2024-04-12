import { destroy } from "@/helpers/jest"
import RequestHelper from "@/helpers/tests/request.helper"
import User from "@/helpers/tests/user.helper"

import { POST, GET } from "./route"
import { POST as setPassword } from "./set-password/route"

// yarn test src/app/backend/auth/auth.test.ts

describe("Backend auth", () => {
  it("Auth test", async () => {
    const password = "test"
    const user = await new User().create({ email: "1@test.wavix", name: "1@test", password })
    if (!user.data) throw new Error()

    const payload = {
      email: user.data.email,
      password
    }

    const requestHelper = new RequestHelper(user.token)
    const request = requestHelper.postRequest(payload)

    const response = await POST(request)

    await user.destroy()

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.user).toBeDefined()
    expect(body.user.id).toBe(user.id)
  })

  it("Get token test", async () => {
    const user = await new User().create({ email: "1@test.wavix", name: "1@test" })
    if (!user.data) throw new Error()

    const requestHelper = new RequestHelper(user.token)
    const { request } = requestHelper.getRequest()

    const response = await GET(request)

    await user.destroy()

    expect(response.status).toBe(200)

    const { user: body } = await response.json()

    expect(body.name).toBe(user.data.name)
    expect(body.email).toBe(user.data.email)
    expect(body.is_admin).toBe(user.data.is_admin)

    expect(body.namespace.id).toBe(user.data.namespace_id)
    expect(body.namespace.name).toBe(user.data.namespace?.name)
  })

  it("Set password test", async () => {
    const user = await new User().create({ email: "1@test.wavix", name: "1@test" })
    if (!user.data) throw new Error()

    const payload = {
      email: user.data.email,
      password: "test"
    }

    const requestHelper = new RequestHelper(user.token)
    const request = requestHelper.postRequest(payload)

    const response = await setPassword(request)

    await user.destroy()

    expect(response.status).toBe(200)

    const { user: body } = await response.json()

    expect(body.name).toBe(user.data.name)
    expect(body.email).toBe(user.data.email)
    expect(body.is_admin).toBe(user.data.is_admin)

    expect(body.namespace.id).toBe(user.data.namespace_id)
    expect(body.namespace.name).toBe(user.data.namespace?.name)
  })
})

afterAll(async () => {
  await destroy()
})
