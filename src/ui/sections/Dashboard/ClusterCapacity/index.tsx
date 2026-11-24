import { Card } from "@/ui/components/layout"

import style from "./style.module.scss"

import type { ClusterCapacity as Capacity, DashboardStandItem } from "@/app/backend/dashboard/interface"
import type { FC } from "react"

interface Props {
  cluster: Capacity
  stands: Array<DashboardStandItem>
}

interface Segment {
  name: string
  value: number
  color: string
}

interface ResourceBarProps {
  label: string
  unit: string
  capacity: number
  segments: Array<Segment>
}

const STAND_COLORS = ["#38bdf8b3", "#a78bfab3", "#fbbf24b3", "#34d399b3", "#f472b6b3", "#2dd4bfb3"]
const SYSTEM_COLOR = "#71717a99"

const round = (value: number): number => Math.round(value * 10) / 10

const ResourceBar: FC<ResourceBarProps> = ({ label, unit, capacity, segments }) => {
  const reserved = segments.reduce((sum, segment) => sum + segment.value, 0)
  const free = round(capacity - reserved)

  return (
    <div className={style.resource}>
      <div className={style.resourceHead}>
        <span className={style.resourceLabel}>{label}</span>
        <span className={style.resourceNumbers}>
          <b>{round(reserved)}</b> of <b>{capacity}</b> {unit} reserved · <b>{free}</b> free
        </span>
      </div>
      <div className={style.bar}>
        {segments.map(segment => (
          <div
            key={segment.name}
            title={`${segment.name}: ${segment.value} ${unit}`}
            style={{ width: `${(segment.value / capacity) * 100}%`, background: segment.color }}
          />
        ))}
      </div>
    </div>
  )
}

export const ClusterCapacity: FC<Props> = ({ cluster, stands }) => {
  const k8sStands = stands.filter(stand => stand.k8s)
  const colorOf = (index: number): string => STAND_COLORS[index % STAND_COLORS.length]

  const cpuSegments: Array<Segment> = [
    ...k8sStands.map((stand, index) => ({
      name: stand.name,
      value: stand.k8s?.cpu_cores.requested || 0,
      color: colorOf(index)
    })),
    { name: "system", value: cluster.system_cpu_cores, color: SYSTEM_COLOR }
  ]

  const memorySegments: Array<Segment> = [
    ...k8sStands.map((stand, index) => ({
      name: stand.name,
      value: stand.k8s?.memory_gib.requested || 0,
      color: colorOf(index)
    })),
    { name: "system", value: cluster.system_memory_gib, color: SYSTEM_COLOR }
  ]

  return (
    <Card.Container gutterTop>
      <div className={style.clusterCapacity}>
        <div className={style.head}>
          <Card.Header>Cluster capacity</Card.Header>
          <span className={style.nodes}>
            {cluster.nodes} {cluster.nodes === 1 ? "node" : "nodes"}
          </span>
        </div>

        <div className={style.resources}>
          <ResourceBar label="CPU" unit="cores" capacity={cluster.cluster_cpu_cores} segments={cpuSegments} />
          <ResourceBar label="Memory" unit="GiB" capacity={cluster.cluster_memory_gib} segments={memorySegments} />
        </div>

        <div className={style.legend}>
          {memorySegments.map(segment => (
            <span key={segment.name} className={style.legendItem}>
              <i style={{ background: segment.color }} />
              {segment.name.toUpperCase()} <em>{segment.value} GiB</em>
            </span>
          ))}
        </div>
      </div>
    </Card.Container>
  )
}
