import { destroy } from "@/helpers/jest"
import BookingHistory from "@/helpers/tests/booking-history.helper"
import Booking from "@/helpers/tests/booking.helper"
import RequestHelper from "@/helpers/tests/request.helper"
import User from "@/helpers/tests/user.helper"
import { BookStatus } from "@/interfaces/book.interface"

import { GET as GetById } from "./[userId]/route"
import { GET } from "./route"

// yarn test src/app/backend/booking-history/booking-history.test.ts

describe("Backend booking history", () => {
  it("Get booking history test", async () => {
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
    if (!history.data) throw new Error()

    const requestHelper = new RequestHelper(testUser.token)
    const { request } = requestHelper.getRequest()

    const response = await GET(request)

    await testUser.destroy()
    await booking.destroy()
    await history.destroy()

    expect(response.status).toBe(200)

    const body = (await response.json()).booking_history.at(0)

    expect(body.id).toBe(history.id)
    expect(body.stand).toBe(history.data.stand)
    expect(body.repository).toBe(history.data.repository)
    expect(body.action).toBe(history.data.action)
    expect(body.created_at).toBe(history.data.created_at.toISOString())

    const { user } = body

    expect(user.id).toBe(testUser.id)
    expect(user.email).toBe(testUser.data.email)
    expect(user.name).toBe(testUser.data.name)
  })

  it("Get booking history by ID test", async () => {
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
    if (!history.data) throw new Error()

    const requestHelper = new RequestHelper(testUser.token)
    const { request, query } = requestHelper.getRequest({ userId: `${testUser.id}` })
    if (!query) throw new Error()

    const response = await GetById(request, query)

    await testUser.destroy()
    await booking.destroy()
    await history.destroy()

    expect(response.status).toBe(200)

    const body = (await response.json()).booking_history.at(0)

    expect(body.id).toBe(history.id)
    expect(body.stand).toBe(history.data.stand)
    expect(body.repository).toBe(history.data.repository)
    expect(body.action).toBe(history.data.action)
    expect(body.created_at).toBe(history.data.created_at.toISOString())

    const { user } = body

    expect(user.id).toBe(testUser.id)
    expect(user.email).toBe(testUser.data.email)
    expect(user.name).toBe(testUser.data.name)
  })
})

afterAll(async () => {
  await destroy()
})
