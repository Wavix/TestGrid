import classNames from "classnames"

import { freeModulesCount, isPersonalStand } from "../standSelection"
import { useStandState } from "../useStandState"

import { StandAccess } from "@/interfaces/stand-control.interface"
import { StandSource } from "@/interfaces/stand.interface"

import style from "./style.module.scss"

import type { DashboardStandItem } from "@/app/backend/dashboard/interface"
import type { FC } from "react"

interface Props {
  stands: Array<DashboardStandItem>
  selectedName: string | undefined
  highlightedNames: Array<string>
  onSelect: (name: string) => void
}

interface ChipProps {
  stand: DashboardStandItem
  isSelected: boolean
  isHighlighted: boolean
  onSelect: (name: string) => void
}

const CHIP_STATE_REFRESH_MS = 30_000

const StandChip: FC<ChipProps> = ({ stand, isSelected, isHighlighted, onSelect }) => {
  const { state, error } = useStandState(stand.id, stand.source === StandSource.K8s, CHIP_STATE_REFRESH_MS)
  const isStateUnknown = !!error || state?.access === StandAccess.Forbidden
  const dotState = isStateUnknown ? null : state?.state

  return (
    <button
      type="button"
      data-id={`dashboard.standChip.${stand.name}`}
      className={classNames(style.chip, { [style.selected]: isSelected, [style.highlighted]: isHighlighted })}
      onClick={() => onSelect(stand.name)}
    >
      <span className={classNames(style.dot, dotState && style[dotState])} />
      <span className={style.name}>{stand.name.toUpperCase()}</span>
      {!isPersonalStand(stand) && <span className={style.free}>{freeModulesCount(stand)} free</span>}
    </button>
  )
}

export const StandSwitcher: FC<Props> = ({ stands, selectedName, highlightedNames, onSelect }) => (
  <div className={style.switcher}>
    {stands.map(stand => (
      <StandChip
        key={stand.name}
        stand={stand}
        isSelected={stand.name === selectedName}
        isHighlighted={highlightedNames.includes(stand.name)}
        onSelect={onSelect}
      />
    ))}
  </div>
)
