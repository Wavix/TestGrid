import { destroy } from "@/helpers/jest"
import Booking from "@/helpers/tests/booking.helper"
import Repository from "@/helpers/tests/repository.helper"
import RequestHelper from "@/helpers/tests/request.helper"
import Stand from "@/helpers/tests/stand.helper"
import User from "@/helpers/tests/user.helper"

import { POST } from "./route"

// yarn test src/app/api/book/book.test.ts

describe("Api Book", () => {
  it("Book test", async () => {
    const user = await new User().create()
    if (!user.data || !user.data.namespace) throw new Error()

    const stand = await new Stand(user.data.namespace_id).create()
    const repository = await new Repository(user.data.namespace_id).create()

    const requestHelper = new RequestHelper()

    const payload = {
      user_name: user.data.name,
      user_email: user.data.email,
      namespace: user.data.namespace.name,
      repository: repository.data?.name,
      stand: stand.data?.name,
      branch: "test/test"
    }

    const request = requestHelper.postRequest(payload)
    const response = await POST(request)

    await stand.destroy()
    await repository.destroy()
    await user.destroy()

    expect(response instanceof Error).toBe(false)
    if (response instanceof Error) return

    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body).toBe("Success!")
  })

  it("Book test with smoke", async () => {
    const user = await new User().create()
    if (!user.data || !user.data.namespace) throw new Error()

    const stand = await new Stand(user.data.namespace_id).create({ is_smoke_test: true })
    const repository = await new Repository(user.data.namespace_id).create()

    const requestHelper = new RequestHelper()

    const payload = {
      user_name: user.data.name,
      user_email: user.data.email,
      namespace: user.data.namespace.name,
      repository: repository.data?.name,
      stand: stand.data?.name,
      branch: "test/test"
    }

    const request = requestHelper.postRequest(payload)

    const response = await POST(request)

    await stand.destroy()
    await repository.destroy()
    await user.destroy()

    expect(response instanceof Error).toBe(false)

    if (response instanceof Error) return
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body).toBe(`1|SMOKE TEST IS RUNNING NOW ON ${stand.data?.name.toUpperCase()}`)
  })

  it("Book test with already booked", async () => {
    const bookingUser = await new User().create({ email: "1@test.wavix", name: "1@test" })
    const currentUser = await new User().create({
      namespace_id: bookingUser.data?.namespace_id,
      email: "2@test.wavix",
      name: "2@test"
    })
    if (!bookingUser.data || !currentUser.data) throw new Error()

    const stand = await new Stand(bookingUser.data.namespace_id).create()
    const repository = await new Repository(bookingUser.data.namespace_id).create()
    const booking = await new Booking(bookingUser.data).create({
      stand_id: stand.id,
      repository_id: repository.id,
      user_id: bookingUser.id
    })

    const requestHelper = new RequestHelper()

    const payload = {
      user_name: currentUser.data.name,
      user_email: currentUser.data.email,
      namespace: bookingUser.data.namespace?.name,
      repository: repository.data?.name,
      stand: stand.data?.name,
      branch: "test/test"
    }

    const request = requestHelper.postRequest(payload)

    const response = await POST(request)

    await stand.destroy()
    await repository.destroy()
    await booking.destroy()
    await currentUser.destroy()
    await bookingUser.destroy()

    expect(response instanceof Error).toBe(false)

    if (response instanceof Error) return
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body).toBe(`1|STAND IS ALREADY BOOKED BY ${bookingUser.data.name.toUpperCase()}`)
  })
})

afterAll(async () => {
  await destroy()
})
