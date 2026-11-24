import classNames from "classnames"
import { useState } from "react"

import { isPersonalStand } from "../standSelection"
import { useStandState } from "../useStandState"

import { StandSource } from "@/interfaces/stand.interface"
import { Card } from "@/ui/components/layout"

import { RepositoryItem } from "./RepositoryItem"
import { ServicesTab } from "./ServicesTab"
import { StandHeader } from "./StandHeader"
import style from "./style.module.scss"
import { useStandControl } from "./useStandControl"

import type { DashboardRepositoryItem, DashboardStandItem } from "@/app/backend/dashboard/interface"
import type { User } from "@/ui/LoginContext"
import type { FC } from "react"

interface Props {
  item: DashboardStandItem
  repositories: Array<DashboardRepositoryItem>
  user: User
  onRelease: (repositoryId: number) => void
  onChangeSmokeTestMode: (id: number, state: boolean) => void
}

enum StandTab {
  Booking = "booking",
  Kubernetes = "kubernetes"
}

const TAB_LABELS: Record<StandTab, string> = {
  [StandTab.Booking]: "Booking",
  [StandTab.Kubernetes]: "Kubernetes"
}

const STATE_REFRESH_MS = 10_000

export const StandView: FC<Props> = ({ item, repositories, user, onRelease, onChangeSmokeTestMode }) => {
  const isPersonal = isPersonalStand(item)
  const isK8s = item.source === StandSource.K8s
  const tabs = [...(isPersonal ? [] : [StandTab.Booking]), ...(isK8s ? [StandTab.Kubernetes] : [])]
  const [activeTab, setActiveTab] = useState<StandTab | undefined>(tabs.at(0))
  const { state, error, refresh } = useStandState(item.id, isK8s, STATE_REFRESH_MS)
  const control = useStandControl(item.id, !isPersonal, refresh)

  return (
    <Card.Container>
      <StandHeader
        item={item}
        user={user}
        state={state}
        error={error}
        control={control}
        onChangeSmokeTestMode={onChangeSmokeTestMode}
      />

      {tabs.length > 0 && (
        <div className={style.tabs} role="tablist">
          {tabs.map(tab => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={tab === activeTab}
              data-id={`dashboard.stand.tab.${tab}`}
              className={classNames(style.tab, { [style.active]: tab === activeTab })}
              onClick={() => setActiveTab(tab)}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      )}

      {activeTab === StandTab.Booking && (
        <div className={style.standRepositories}>
          {repositories.map(repository => (
            <RepositoryItem
              item={repository}
              isSmokeTest={item.is_smoke_test}
              key={repository.name}
              onRelease={onRelease}
            />
          ))}
        </div>
      )}

      {activeTab === StandTab.Kubernetes && <ServicesTab state={state} error={error} control={control} />}
    </Card.Container>
  )
}
