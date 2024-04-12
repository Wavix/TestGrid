import { destroy } from "@/helpers/jest"
import RequestHelper from "@/helpers/tests/request.helper"
import Stand from "@/helpers/tests/stand.helper"
import User from "@/helpers/tests/user.helper"

import { PATCH } from "./stands/[standId]/route"
import { PATCH as updateUser, GET as getById } from "./users/[userId]/route"
import { PATCH as resetPassword } from "./users/reset-password/[userId]/route"
import { GET } from "./users/route"

import type { StandCreationAttributes } from "@/app/database/interfaces/stand.interface"

// yarn test src/app/backend/admin/admin.test.ts

describe("Backend admin stands", () => {
  it("Patch stand by ID test", async () => {
    const user = await new User().create({ email: "1@test.wavix", name: "1@test" })
    if (!user.data) throw new Error()

    const stand = await new Stand(user.data.namespace_id).create()

    const payload: Partial<StandCreationAttributes> = {
      name: "New stand name",
      is_smoke_test: false,
      namespace_id: user.data.namespace_id
    }

    const requestHelper = new RequestHelper(user.token)
    const { request, query } = requestHelper.patchRequest(payload, { standId: `${stand.id}` })

    const response = await PATCH(request, query)

    await user.destroy()
    await stand.destroy()

    expect(response.status).toBe(200)

    const body = (await response.json()).stand

    expect(body.id).toBe(stand.id)

    expect(body.name).toBe(payload.name)
    expect(body.namespace_id).toBe(payload.namespace_id)
    expect(body.is_smoke_test).toBe(payload.is_smoke_test)
  })
})

describe("Backend admin users", () => {
  it("Get users list test", async () => {
    const user = await new User().create({ email: "1@test.wavix", name: "1@test" })
    if (!user.data) throw new Error()

    const requestHelper = new RequestHelper(user.token)
    const { request } = requestHelper.getRequest()

    const response = await GET(request)

    await user.destroy()

    expect(response.status).toBe(200)

    const body = (await response.json()).users.at(0)

    expect(body.id).toBe(user.id)

    expect(body.name).toBe(user.data.name)
    expect(body.email).toBe(user.data.email)
    expect(body.is_admin).toBe(user.data.is_admin)
    expect(body.is_active).toBe(user.data.is_active)

    expect(body.namespace.id).toBe(user.data.namespace_id)
    expect(body.namespace.name).toBe(user.data.namespace?.name)
  })

  it("Get user by ID test", async () => {
    const user = await new User().create({ email: "1@test.wavix", name: "1@test" })
    if (!user.data) throw new Error()

    const requestHelper = new RequestHelper(user.token)
    const { request, query } = requestHelper.getRequest({ userId: `${user.id}` })
    if (!query) throw new Error()

    const response = await getById(request, query)

    await user.destroy()

    expect(response.status).toBe(200)

    const { user: body } = await response.json()

    expect(body.id).toBe(user.id)

    expect(body.name).toBe(user.data.name)
    expect(body.email).toBe(user.data.email)
    expect(body.is_admin).toBe(user.data.is_admin)
    expect(body.is_active).toBe(user.data.is_active)

    expect(body.namespace.id).toBe(user.data.namespace_id)
    expect(body.namespace.name).toBe(user.data.namespace?.name)
  })

  it("Patch user by ID test", async () => {
    const user = await new User().create({
      email: "1@test.wavix",
      name: "1@test",
      is_admin: true,
      is_active: false
    })
    if (!user.data) throw new Error()

    const payload = {
      name: "Updated user name",
      is_admin: false,
      is_active: true
    }

    const requestHelper = new RequestHelper(user.token)
    const { request, query } = requestHelper.patchRequest(payload, { userId: `${user.id}` })

    const response = await updateUser(request, query)

    await user.destroy()

    expect(response.status).toBe(200)

    const { user: body } = await response.json()

    expect(body.id).toBe(user.id)

    expect(body.name).toBe(payload.name)
    expect(body.is_admin).toBe(payload.is_admin)
    expect(body.is_active).toBe(payload.is_active)
  })

  it("Reset user password test", async () => {
    const user = await new User().create({ email: "1@test.wavix", name: "1@test" })
    if (!user.data) throw new Error()

    const requestHelper = new RequestHelper(user.token)
    const { request, query } = requestHelper.patchRequest({}, { userId: `${user.id}` })

    const response = await resetPassword(request, query)

    await user.destroy()

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.success).toBeTruthy()
  })
})

afterAll(async () => {
  await destroy()
})
