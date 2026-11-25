import { DB } from "@/app/database"
import { destroy } from "@/helpers/jest"
import Booking from "@/helpers/tests/booking.helper"
import RequestHelper from "@/helpers/tests/request.helper"
import User from "@/helpers/tests/user.helper"

import { GET } from "./route"

// yarn test src/app/backend/dashboard/dashboard.test.ts

describe("Backend dashboard", () => {
  it("Get dashboard test", async () => {
    const user = await new User().create({ email: "2@test.wavix", name: "2@test" })
    if (!user.data) throw new Error()

    const booking = await new Booking(user.data).create()
    const createdStand = booking.data?.stand_name?.toJSON()
    const createdRepository = booking.data?.repository_name?.toJSON()
    if (!createdStand || !createdRepository) throw new Error()
    await DB.models.LastBranch.create({
      stand_id: createdStand.id,
      repository_id: createdRepository.id,
      branch_name: "feature/DEV-9-last"
    })

    const requestHelper = new RequestHelper(user.token)
    const { request } = requestHelper.getRequest()

    const response = await GET(request)

    await user.destroy()
    await booking.destroy()
    await DB.models.LastBranch.destroy({ where: { stand_id: createdStand.id } })

    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.stands).toBeDefined()

    const stand = body.stands.at(0)
    expect(stand.id).toBe(createdStand.id)
    expect(stand.name).toBe(createdStand.name)
    expect(stand.is_smoke_test).toBe(createdStand.is_smoke_test)

    const repository = stand.repositories.at(0)
    expect(repository.id).toBe(createdRepository.id)
    expect(repository.name).toBe(createdRepository.name)
    expect(repository.last_branch).toBe("feature/DEV-9-last")

    expect(repository.booking.id).toBe(booking.data?.id)
    expect(repository.booking.branch_name).toBe(booking.data?.branch_name)
    expect(repository.booking.created_at).toBe(booking.data?.created_at.toISOString())

    expect(repository.booking.task_name).toBeDefined()
    expect(typeof repository.booking.can_release).toBe("boolean")
  })
})

afterAll(async () => {
  await destroy()
})
