import classNames from "classnames"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

import { isPersonalStand } from "../standSelection"

import { ScaleAction, StandAccess, StandRuntimeState } from "@/interfaces/stand-control.interface"
import { StandSource } from "@/interfaces/stand.interface"
import { Switch } from "@/ui/components/form"
import { Card } from "@/ui/components/layout"

import style from "./k8s.module.scss"
import { DELETE_KEY, STAND_KEY } from "./useStandControl"

import type { StandControl } from "./useStandControl"
import type { DashboardStandItem } from "@/app/backend/dashboard/interface"
import type { StandStateResponse } from "@/interfaces/stand-control.interface"
import type { User } from "@/ui/LoginContext"
import type { FC } from "react"

interface Props {
  item: DashboardStandItem
  user: User
  state: StandStateResponse | null
  error: string | null
  control: StandControl
  onChangeSmokeTestMode: (id: number, state: boolean) => void
}

dayjs.extend(relativeTime)

const STATE_LABELS: Record<StandRuntimeState, string> = {
  [StandRuntimeState.Running]: "Running",
  [StandRuntimeState.Degraded]: "Degraded",
  [StandRuntimeState.Stopped]: "Stopped"
}

const NOT_AVAILABLE = "n/a"

const formatValue = (value: number | null, unit: string): string =>
  value === null ? NOT_AVAILABLE : `${value} ${unit}`

export const StandHeader: FC<Props> = ({ item, user, state, error, control, onChangeSmokeTestMode }) => {
  const isForbidden = state?.access === StandAccess.Forbidden
  const isStopped = state?.state === StandRuntimeState.Stopped
  const canControlStand = !!state?.can_control_stand && !isForbidden

  const handleToggleStand = () => control.runScale(STAND_KEY, isStopped ? ScaleAction.Start : ScaleAction.Stop)

  const renderState = () => {
    if (error) return <div className={style.bad}>{error}</div>
    if (!state) return <div className={style.muted}>Loading…</div>

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
          <span>
            CPU used <b>{formatValue(state.cpu_used_cores, "cores")}</b>
          </span>
          <span>
            CPU requested <b>{formatValue(state.cpu_requested_cores, "cores")}</b>
          </span>
          <span>
            memory used <b>{formatValue(state.memory_used_gib, "GiB")}</b>
          </span>
          <span>
            memory requested <b>{formatValue(state.memory_requested_gib, "GiB")}</b>
          </span>
          {state.created_at && <span>created {dayjs(state.created_at).fromNow()}</span>}
          {state.expires_at && dayjs(state.expires_at).isValid() && (
            <span className={style.warn}>
              {dayjs(state.expires_at).isBefore(dayjs()) ? "expired" : "expires"} {dayjs(state.expires_at).fromNow()}
            </span>
          )}
        </div>

        {state.warnings.length > 0 && (
          <ul className={style.warnings}>
            {state.warnings.map(warning => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        )}
      </>
    )
  }

  return (
    <div className={style.standHeader}>
      <div className={style.titleRow}>
        <Card.Header>{item.name.toUpperCase()}</Card.Header>
        {!isPersonalStand(item) && (
          <Switch
            title="Smoke test mode"
            hint="Block stand for review deployment and release all repositories in case of smoke test run"
            titlePosition="left"
            readonly={!user?.is_admin}
            isChecked={item.is_smoke_test}
            onChange={(isChecked: boolean) => onChangeSmokeTestMode(item.id, isChecked)}
          />
        )}
      </div>

      {item.owner && (
        <div className={style.owner}>
          Owner <b>{item.owner}</b>
        </div>
      )}

      {item.source === StandSource.K8s && renderState()}

      {(canControlStand || state?.can_delete) && (
        <div className={style.actions}>
          {canControlStand && (
            <button
              type="button"
              data-id="dashboard.stand.toggle"
              className={style.action}
              disabled={!!control.busyKey}
              onClick={handleToggleStand}
            >
              {control.actionLabel(STAND_KEY, isStopped ? "Start" : "Stop")}
            </button>
          )}
          {state?.can_delete && (
            <button
              type="button"
              data-id="dashboard.stand.delete"
              className={classNames(style.action, style.danger)}
              disabled={!!control.busyKey}
              onClick={control.runDelete}
            >
              {control.actionLabel(DELETE_KEY, "Delete")}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
