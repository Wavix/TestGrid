import { destroy } from "@/helpers/jest"
import Booking from "@/helpers/tests/booking.helper"
import RequestHelper from "@/helpers/tests/request.helper"
import User from "@/helpers/tests/user.helper"

import { DELETE } from "./[bookingId]/route"

// yarn test src/app/backend/book-stand/book-stand.test.ts

describe("Backend book stand", () => {
  it("Release booked stand test", async () => {
    const user = await new User().create({ email: "1@test.wavix", name: "1@test" })
    if (!user.data) throw new Error()

    const booking = await new Booking(user.data).create()

    const requestHelper = new RequestHelper(user.token)
    const { request, query } = requestHelper.deleteRequest({ bookingId: `${booking.id}` })
    if (!query) throw new Error()

    const response = await DELETE(request, query)

    await user.destroy()
    await booking.destroy()

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body).toBeDefined()
    expect(body.success).toBeTruthy()
  })
})

afterAll(async () => {
  await destroy()
})
