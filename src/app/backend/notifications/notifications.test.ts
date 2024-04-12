import { destroy } from "@/helpers/jest"
import Notification from "@/helpers/tests/notification.helper"
import RequestHelper from "@/helpers/tests/request.helper"
import User from "@/helpers/tests/user.helper"

import { GET } from "./route"
import { PATCH } from "./view-notifications/route"

// yarn test src/app/backend/notifications/notifications.test.ts

describe("Backend notifications", () => {
  it("Get notification test", async () => {
    const user = await new User().create({ email: "2@test.wavix", name: "2@test" })
    if (!user.data) throw new Error()

    const notification = await new Notification(user.id).create()
    if (!notification.data) throw new Error()

    const requestHelper = new RequestHelper(user.token)
    const { request } = requestHelper.getRequest()

    const response = await GET(request)

    await user.destroy()
    await notification.destroy()

    expect(response.status).toBe(200)

    const body = (await response.json()).notifications.at(0)

    expect(body).toBeDefined()
    expect(body.id).toBe(notification.id)
    expect(body.is_viewed).toBe(notification.data.is_viewed)
    expect(body.message).toBe(notification.data.message)
    expect(body.created_at).toBe(notification.data.created_at.toISOString())
  })

  it("View notification test", async () => {
    const user = await new User().create({ email: "2@test.wavix", name: "2@test" })
    if (!user.data) throw new Error()

    const notification = await new Notification(user.id).create({ is_viewed: false })
    if (!notification.data) throw new Error()

    const payload = {
      ids: [notification.id]
    }

    const requestHelper = new RequestHelper(user.token)
    const { request } = requestHelper.patchRequest(payload, {})

    const response = await PATCH(request)

    await user.destroy()
    await notification.destroy()

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toBeDefined()
    expect(body.success).toBeTruthy()
  })
})

afterAll(async () => {
  await destroy()
})
