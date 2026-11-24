import classNames from "classnames"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { useState } from "react"

import { useFailureToast, useSuccessToast } from "@/hooks/toast"
import { ScaleAction, StandAccess, StandRuntimeState, WorkloadKind } from "@/interfaces/stand-control.interface"
import { deleteStand, scaleStand } from "@/ui/api/stand"

import style from "./style.module.scss"
import { useStandState } from "./useStandState"

import type { StandWorkloadItem, WorkloadRef } from "@/interfaces/stand-control.interface"
import type { FC } from "react"

interface Props {
  standId: number
  isShared: boolean
}

dayjs.extend(relativeTime)

const STATE_LABELS: Record<StandRuntimeState, string> = {
  [StandRuntimeState.Running]: "Running",
  [StandRuntimeState.Degraded]: "Degraded",
  [StandRuntimeState.Stopped]: "Stopped"
}

const KIND_LABELS: Record<WorkloadKind, string> = {
  [WorkloadKind.Deployment]: "deploy",
  [WorkloadKind.StatefulSet]: "sts"
}

const HEALTHY = "Healthy"
const SYNCED = "Synced"
const STAND_KEY = "stand"
const DELETE_KEY = "delete"

const workloadKey = (workload: WorkloadRef): string => `${workload.kind}/${workload.name}`

export const K8sPanel: FC<Props> = ({ standId, isShared }) => {
  const [isOpen, setOpen] = useState(false)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [confirmKey, setConfirmKey] = useState<string | null>(null)
  const { state, error, refresh } = useStandState(standId, isOpen)
  const successToast = useSuccessToast()
  const failureToast = useFailureToast()

  const needsConfirm = (key: string, action: ScaleAction | typeof DELETE_KEY): boolean => {
    const isRisky = action === DELETE_KEY || (isShared && action === ScaleAction.Stop)
    if (!isRisky || confirmKey === key) return false

    setConfirmKey(key)
    return true
  }

  const runScale = async (key: string, action: ScaleAction, workload?: WorkloadRef) => {
    if (needsConfirm(key, action)) return

    setConfirmKey(null)
    setBusyKey(key)
    const response = await scaleStand(standId, { action, workload }).catch((e: Error) => ({
      error: e.message,
      failures: undefined
    }))
    setBusyKey(null)

    if (response.error) {
      failureToast(response.error)
    } else if (response.failures?.length) {
      failureToast(response.failures.map(failure => `${failure.name}: ${failure.error}`).join("\n"))
    } else {
      successToast(`${action === ScaleAction.Stop ? "Stopped" : "Started"} ${workload?.name || "stand"}`)
    }

    await refresh()
  }

  const runDelete = async () => {
    if (needsConfirm(DELETE_KEY, DELETE_KEY)) return

    setConfirmKey(null)
    setBusyKey(DELETE_KEY)
    const response = await deleteStand(standId).catch((e: Error) => ({ error: e.message }))
    setBusyKey(null)

    if (response.error) {
      failureToast(response.error)
      return
    }

    successToast("Stand deletion started")
  }

  const actionLabel = (key: string, label: string): string =>
    confirmKey === key ? `Confirm ${label.toLowerCase()}` : label

  const renderWorkloadAction = (workload: StandWorkloadItem) => {
    if (!state?.can_control_workloads || workload.is_protected) return <span />

    const key = workloadKey(workload)
    const action = workload.desired > 0 ? ScaleAction.Stop : ScaleAction.Start
    const label = action === ScaleAction.Stop ? "Stop" : "Start"

    return (
      <button
        type="button"
        className={classNames(style.action, style.small, { [style.danger]: action === ScaleAction.Stop })}
        disabled={!!busyKey}
        onClick={() => runScale(key, action, { kind: workload.kind, name: workload.name })}
      >
        {actionLabel(key, label)}
      </button>
    )
  }

  const renderBody = () => {
    if (error) return <div className={style.bad}>{error}</div>
    if (!state) return <div className={style.muted}>Loading…</div>

    const isForbidden = state.access === StandAccess.Forbidden
    const isStopped = state.state === StandRuntimeState.Stopped

    return (
      <>
        <div className={style.statusRow}>
          {isForbidden ? (
            <span className={classNames(style.state, style.degraded)}>No access, re-run bin/dev stand up</span>
          ) : (
            state.state && (
              <span className={classNames(style.state, style[state.state])}>{STATE_LABELS[state.state]}</span>
            )
          )}
          {state.nodes.length > 0 && <span className={style.muted}>{state.nodes.join(", ")}</span>}
          <div className={style.urls}>
            {state.urls.map(url => (
              <a key={url} href={url.includes("://") ? url : `https://${url}`} target="_blank" rel="noreferrer">
                {url.replace(/^https?:\/\//, "")}
              </a>
            ))}
          </div>
        </div>

        <div className={style.metaRow}>
          {state.created_at && <span>created {dayjs(state.created_at).fromNow()}</span>}
          {state.expires_at && dayjs(state.expires_at).isValid() && (
            <span className={style.warn}>
              {dayjs(state.expires_at).isBefore(dayjs()) ? "expired" : "expires"} {dayjs(state.expires_at).fromNow()}
            </span>
          )}
          <span>
            memory requested <b>{state.memory_requested_gib === null ? "n/a" : `${state.memory_requested_gib} GiB`}</b>
          </span>
        </div>

        {state.warnings.length > 0 && (
          <ul className={style.warnings}>
            {state.warnings.map(warning => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        )}

        {state.workloads.length > 0 && (
          <div className={style.list}>
            <div className={style.listTitle}>Workloads</div>
            {state.workloads.map(workload => (
              <div key={workloadKey(workload)} className={style.workload}>
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
                {renderWorkloadAction(workload)}
              </div>
            ))}
          </div>
        )}

        {state.applications.length > 0 && (
          <div className={style.list}>
            <div className={style.listTitle}>ArgoCD</div>
            {state.applications.map(app => (
              <div key={app.name} className={style.application}>
                <span className={classNames(style.dot, { [style.bad]: app.health !== HEALTHY })} />
                <span className={style.name}>{app.name}</span>
                <span className={style.version}>{app.version}</span>
                <span className={classNames(style.status, { [style.warn]: app.sync !== SYNCED })}>{app.sync}</span>
                <span className={classNames(style.status, { [style.bad]: app.health !== HEALTHY })}>{app.health}</span>
              </div>
            ))}
          </div>
        )}

        {(state.can_control_stand || state.can_delete) && (
          <div className={style.actions}>
            {state.can_control_stand && !isForbidden && (
              <button
                type="button"
                className={style.action}
                disabled={!!busyKey}
                onClick={() => runScale(STAND_KEY, isStopped ? ScaleAction.Start : ScaleAction.Stop)}
              >
                {actionLabel(STAND_KEY, isStopped ? "Start" : "Stop")}
              </button>
            )}
            {state.can_delete && (
              <button
                type="button"
                className={classNames(style.action, style.danger)}
                disabled={!!busyKey}
                onClick={runDelete}
              >
                {actionLabel(DELETE_KEY, "Delete")}
              </button>
            )}
          </div>
        )}
      </>
    )
  }

  return (
    <div className={style.k8sPanel}>
      <button type="button" className={style.toggle} onClick={() => setOpen(!isOpen)}>
        <span>Kubernetes</span>
        <span>{isOpen ? "▴" : "▾"}</span>
      </button>
      {isOpen && <div className={style.body}>{renderBody()}</div>}
    </div>
  )
}
