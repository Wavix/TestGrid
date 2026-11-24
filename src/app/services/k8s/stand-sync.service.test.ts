import { DB } from "@/app/database"
import { destroy } from "@/helpers/jest"
import { StandSource } from "@/interfaces/stand.interface"

import { StandSyncService } from "./stand-sync.service"

import type { ClusterClient } from "./cluster.client"

const clusterWith = (result: Array<string> | Error): ClusterClient => ({
  listStandNames: async () => result
})

const standsBySource = async (namespaceId: number): Promise<Record<string, string>> => {
  const stands = await DB.models.Stand.findAll({ where: { namespace_id: namespaceId } })

  return Object.fromEntries(stands.map(stand => [stand.name, stand.source]))
}

describe("Kubernetes stand sync", () => {
  let namespaceId: number

  beforeEach(async () => {
    const namespace = await DB.models.Namespace.create({ name: "k8s sync namespace" })
    namespaceId = namespace.id
  })

  afterEach(async () => {
    await DB.models.Stand.destroy({ where: { namespace_id: namespaceId } })
    await DB.models.Namespace.destroy({ where: { id: namespaceId } })
  })

  it("creates a k8s stand for every stand found in the cluster", async () => {
    const result = await new StandSyncService(clusterWith(["sync-qa1", "sync-qa2"])).syncNamespaceStands(namespaceId)

    expect(result).toBeNull()
    expect(await standsBySource(namespaceId)).toEqual({
      "sync-qa1": StandSource.K8s,
      "sync-qa2": StandSource.K8s
    })
  })

  it("turns a manual stand with a cluster stand's name into a k8s stand, keeping its id", async () => {
    const manual = await DB.models.Stand.create({ name: "sync-qa1", namespace_id: namespaceId })

    await new StandSyncService(clusterWith(["sync-qa1"])).syncNamespaceStands(namespaceId)

    const stands = await DB.models.Stand.findAll({ where: { namespace_id: namespaceId } })
    expect(stands).toHaveLength(1)
    expect(stands[0].id).toBe(manual.id)
    expect(stands[0].source).toBe(StandSource.K8s)
  })

  it("removes k8s stands that left the cluster and keeps manual stands", async () => {
    await DB.models.Stand.create({ name: "sync-swarm", namespace_id: namespaceId })
    await new StandSyncService(clusterWith(["sync-qa1", "sync-qa2"])).syncNamespaceStands(namespaceId)

    await new StandSyncService(clusterWith(["sync-qa2"])).syncNamespaceStands(namespaceId)

    expect(await standsBySource(namespaceId)).toEqual({
      "sync-qa2": StandSource.K8s,
      "sync-swarm": StandSource.Manual
    })
  })

  it("changes nothing when the cluster cannot be read", async () => {
    await new StandSyncService(clusterWith(["sync-qa1"])).syncNamespaceStands(namespaceId)

    const result = await new StandSyncService(clusterWith(new Error("cluster unreachable"))).syncNamespaceStands(
      namespaceId
    )

    expect(result).toBeInstanceOf(Error)
    expect(await standsBySource(namespaceId)).toEqual({ "sync-qa1": StandSource.K8s })
  })

  it("leaves another namespace's stands alone", async () => {
    const other = await DB.models.Namespace.create({ name: "k8s sync other namespace" })
    await new StandSyncService(clusterWith(["sync-other"])).syncNamespaceStands(other.id)

    await new StandSyncService(clusterWith([])).syncNamespaceStands(namespaceId)

    const otherStands = await standsBySource(other.id)
    await DB.models.Stand.destroy({ where: { namespace_id: other.id } })
    await DB.models.Namespace.destroy({ where: { id: other.id } })

    expect(otherStands).toEqual({ "sync-other": StandSource.K8s })
  })
})

afterAll(async () => {
  await destroy()
})
