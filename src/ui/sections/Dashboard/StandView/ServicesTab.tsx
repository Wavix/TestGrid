import classNames from "classnames"

import { ScaleAction, WorkloadKind } from "@/interfaces/stand-control.interface"

import style from "./k8s.module.scss"
import { workloadKey } from "./useStandControl"

import type { StandControl } from "./useStandControl"
import type { StandApplicationItem, StandStateResponse, StandWorkloadItem } from "@/interfaces/stand-control.interface"
import type { FC } from "react"

interface Props {
  state: StandStateResponse | null
  error: string | null
  control: StandControl
}

const KIND_LABELS: Record<WorkloadKind, string> = {
  [WorkloadKind.Deployment]: "deploy",
  [WorkloadKind.StatefulSet]: "sts"
}

const HEALTHY = "Healthy"
const SYNCED = "Synced"
const NO_VALUE = "—"

export const ServicesTab: FC<Props> = ({ state, error, control }) => {
  if (error) return <div className={style.bad}>{error}</div>
  if (!state) return <div className={style.muted}>Loading…</div>

  const applicationsByName = new Map(state.applications.map(app => [app.name, app]))
  const trackedNames = new Set(state.workloads.map(workload => workload.application))
  const untrackedApplications = state.applications.filter(app => !trackedNames.has(app.name))

  const renderAction = (workload: StandWorkloadItem) => {
    if (!state.can_control_workloads || workload.is_protected) return <span />

    const key = workloadKey(workload)
    const action = workload.desired > 0 ? ScaleAction.Stop : ScaleAction.Start
    const label = action === ScaleAction.Stop ? "Stop" : "Start"
    const handleClick = () => control.runScale(key, action, { kind: workload.kind, name: workload.name })

    return (
      <button
        type="button"
        data-id={`dashboard.service.${workload.name}.${action}`}
        className={classNames(style.action, style.small, { [style.danger]: action === ScaleAction.Stop })}
        disabled={!!control.busyKey}
        onClick={handleClick}
      >
        {control.actionLabel(key, label)}
      </button>
    )
  }

  const renderArgo = (app: StandApplicationItem | undefined) => (
    <>
      <span className={style.version}>{app?.version || NO_VALUE}</span>
      <span className={classNames(style.status, { [style.warn]: app && app.sync !== SYNCED })}>
        {app?.sync || NO_VALUE}
      </span>
      <span className={classNames(style.status, { [style.bad]: app && app.health !== HEALTHY })}>
        {app?.health || NO_VALUE}
      </span>
    </>
  )

  if (!state.workloads.length && !state.applications.length) return <div className={style.muted}>No services</div>

  return (
    <div className={style.services}>
      <div className={classNames(style.service, style.serviceHead)}>
        <span />
        <span>Service</span>
        <span>Kind</span>
        <span>Replicas</span>
        <span>Version</span>
        <span className={style.status}>Sync</span>
        <span className={style.status}>Health</span>
        <span />
      </div>
      {state.workloads.map(workload => (
        <div key={workloadKey(workload)} className={style.service}>
          <span
            className={classNames(style.dot, {
              [style.bad]: workload.ready < workload.desired,
              [style.off]: workload.desired === 0
            })}
          />
          <span className={style.name}>{workload.name}</span>
          <span className={style.muted}>{KIND_LABELS[workload.kind]}</span>
          <span className={style.muted}>
            {workload.ready}/{workload.desired}
            {workload.saved_replicas !== null && workload.desired === 0 && ` (was ${workload.saved_replicas})`}
          </span>
          {renderArgo(workload.application ? applicationsByName.get(workload.application) : undefined)}
          {renderAction(workload)}
        </div>
      ))}
      {untrackedApplications.map(app => (
        <div key={app.name} className={style.service}>
          <span className={classNames(style.dot, { [style.bad]: app.health !== HEALTHY })} />
          <span className={style.name}>{app.name}</span>
          <span className={style.muted}>app</span>
          <span className={style.muted}>{NO_VALUE}</span>
          {renderArgo(app)}
          <span />
        </div>
      ))}
    </div>
  )
}
