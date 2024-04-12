import { destroy } from "@/helpers/jest"
import BookingHistory from "@/helpers/tests/booking-history.helper"
import Booking from "@/helpers/tests/booking.helper"
import RequestHelper from "@/helpers/tests/request.helper"
import User from "@/helpers/tests/user.helper"
import { BookStatus } from "@/interfaces/book.interface"

import { GET } from "./route"

// yarn test src/app/backend/stats/stats.test.ts

describe("Backend stats", () => {
  it("Get stats test", async () => {
    const testUser = await new User().create({ email: "2@test.wavix", name: "2@test" })
    if (!testUser.data) throw new Error()

    const booking = await new Booking(testUser.data).create()
    const createdStand = booking.data?.stand_name?.toJSON()
    const createdRepository = booking.data?.repository_name?.toJSON()
    if (!createdStand || !createdRepository) throw new Error()

    const history = await new BookingHistory().create({
      namespace_id: testUser.data.namespace_id,
      repository: createdRepository.name,
      stand: createdStand.name,
      user_id: testUser.id,
      action: BookStatus.Booked
    })

    const requestHelper = new RequestHelper(testUser.token)
    const { request } = requestHelper.getRequest()

    const response = await GET(request)

    await testUser.destroy()
    await booking.destroy()
    await history.destroy()

    expect(response.status).toBe(200)

    const body = await response.json()

    expect(body.total).toBeGreaterThan(0)

    const { user, statistics } = body.users.at(0)

    expect(user.id).toBe(testUser.id)
    expect(user.email).toBe(testUser.data.email)
    expect(user.name).toBe(testUser.data.name)

    expect(statistics.at(0).date).toBeDefined()
  })
})

afterAll(async () => {
  await destroy()
})
