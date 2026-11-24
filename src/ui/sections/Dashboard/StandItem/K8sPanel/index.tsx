import classNames from "classnames"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { useState } from "react"

import { StandAction, StandK8sState } from "@/app/backend/dashboard/interface"

import style from "./style.module.scss"

import type { ClusterCapacity, ResourceUsage, StandK8sInfo } from "@/app/backend/dashboard/interface"
import type { FC } from "react"

interface Props {
  info: StandK8sInfo
  cluster: ClusterCapacity
  canManage: boolean
  canDelete: boolean
  onAction: (action: StandAction) => void
}

interface UsageRowProps {
  label: string
  unit: string
  usage: ResourceUsage
  nodeCapacity: number
  clusterCapacity: number
}

dayjs.extend(relativeTime)

const STATE_LABELS: Record<StandK8sState, string> = {
  [StandK8sState.Running]: "Running",
  [StandK8sState.Degraded]: "Degraded",
  [StandK8sState.Sleeping]: "Sleeping"
}

const percent = (value: number, total: number): number => (total ? Math.round((value / total) * 100) : 0)

const UsageRow: FC<UsageRowProps> = ({ label, unit, usage, nodeCapacity, clusterCapacity }) => (
  <div className={style.usageRow}>
    <div className={style.usageHead}>
      <span className={style.usageLabel}>{label}</span>
      <span className={style.usageNumbers}>
        <b>{usage.used}</b> used / <b>{usage.requested}</b> reserved {unit}
      </span>
    </div>
    <div className={style.bar}>
      <div className={style.reserved} style={{ width: `${percent(usage.requested, nodeCapacity)}%` }} />
      <div className={style.used} style={{ width: `${percent(usage.used, nodeCapacity)}%` }} />
    </div>
    <div className={style.usageShare}>
      reserved: {percent(usage.requested, nodeCapacity)}% of node · {percent(usage.requested, clusterCapacity)}% of
      cluster
    </div>
  </div>
)

export const K8sPanel: FC<Props> = ({ info, cluster, canManage, canDelete, onAction }) => {
  const [isServicesOpen, setServicesOpen] = useState(false)

  const unhealthy = info.services.filter(service => !service.is_healthy).length
  const outOfSync = info.services.filter(service => !service.is_synced).length
  const isSleeping = info.state === StandK8sState.Sleeping

  return (
    <div className={style.k8sPanel}>
      <div className={style.statusRow}>
        <span className={classNames(style.state, style[info.state])}>{STATE_LABELS[info.state]}</span>
        <span className={style.node}>{info.node}</span>
        <div className={style.urls}>
          {info.urls.map(url => (
            <a key={url} href={`https://${url}`} target="_blank" rel="noreferrer">
              {url}
            </a>
          ))}
        </div>
      </div>

      {info.owner_name && (
        <div className={style.ownerRow}>
          <span>
            Owner <b>{info.owner_name}</b>
          </span>
          {info.created_at && <span>created {dayjs(info.created_at).fromNow()}</span>}
          {info.expires_at && <span className={style.expires}>expires {dayjs(info.expires_at).fromNow()}</span>}
        </div>
      )}

      <div className={style.usage}>
        <UsageRow
          label="CPU"
          unit="cores"
          usage={info.cpu_cores}
          nodeCapacity={cluster.node_cpu_cores}
          clusterCapacity={cluster.cluster_cpu_cores}
        />
        <UsageRow
          label="Memory"
          unit="GiB"
          usage={info.memory_gib}
          nodeCapacity={cluster.node_memory_gib}
          clusterCapacity={cluster.cluster_memory_gib}
        />
      </div>

      <button type="button" className={style.servicesToggle} onClick={() => setServicesOpen(!isServicesOpen)}>
        <span>
          {info.services.length} services
          {unhealthy > 0 && <span className={style.bad}> · {unhealthy} unhealthy</span>}
          {outOfSync > 0 && <span className={style.warn}> · {outOfSync} out of sync</span>}
          {unhealthy === 0 && outOfSync === 0 && !isSleeping && <span className={style.good}> · all healthy</span>}
        </span>
        <span>{isServicesOpen ? "▴" : "▾"}</span>
      </button>

      {isServicesOpen && (
        <div className={style.servicesList}>
          {info.services.map(service => (
            <div key={service.name} className={style.service}>
              <span className={classNames(style.dot, { [style.bad]: !service.is_healthy && !isSleeping })} />
              <span className={style.serviceName}>{service.name}</span>
              <span className={style.serviceVersion}>{service.version}</span>
              <span className={classNames(style.serviceSync, { [style.warn]: !service.is_synced })}>
                {service.is_synced ? "Synced" : "OutOfSync"}
              </span>
            </div>
          ))}
        </div>
      )}

      {canManage && (
        <div className={style.actions}>
          {isSleeping ? (
            <button type="button" className={style.action} onClick={() => onAction(StandAction.Wake)}>
              Wake
            </button>
          ) : (
            <button type="button" className={style.action} onClick={() => onAction(StandAction.Sleep)}>
              Sleep
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              className={classNames(style.action, style.danger)}
              onClick={() => onAction(StandAction.Delete)}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}
