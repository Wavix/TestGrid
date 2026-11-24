import { StandKind, StandSource } from "@/interfaces/stand.interface"
import { Switch } from "@/ui/components/form"
import { Card } from "@/ui/components/layout"

import { K8sPanel } from "./K8sPanel"
import { RepositoryItem } from "./RepositoryItem"
import style from "./style.module.scss"

import type { DashboardStandItem } from "@/app/backend/dashboard/interface"
import type { User } from "@/ui/LoginContext"
import type { FC } from "react"

interface Props {
  item: DashboardStandItem
  user: User
  onRelease: (repositoryId: number) => void
  onChangeSmokeTestMode: (id: number, state: boolean) => void
}

export const StandItem: FC<Props> = ({ user, item, onRelease, onChangeSmokeTestMode }) => {
  const isPersonal = item.kind === StandKind.Ephemeral

  return (
    <div className={style.standItemWrapper}>
      <Card.Container>
        <div className={style.header}>
          <div>
            <Card.Header>{item.name.toUpperCase()}</Card.Header>
          </div>
          {!isPersonal && (
            <div>
              <Switch
                title="Smoke test mode"
                hint="Block stand for review deployment and release all repositories in case of smoke test run"
                titlePosition="left"
                readonly={!user?.is_admin}
                isChecked={item.is_smoke_test}
                onChange={(state: boolean) => onChangeSmokeTestMode(item.id, state)}
              />
            </div>
          )}
        </div>
        {item.owner && (
          <div className={style.owner}>
            Owner <b>{item.owner}</b>
          </div>
        )}
        {item.source === StandSource.K8s && <K8sPanel standId={item.id} isShared={!isPersonal} />}
        {!isPersonal && (
          <div className={style.standRepositories}>
            {item.repositories.map(repository => (
              <RepositoryItem
                item={repository}
                isSmokeTest={item.is_smoke_test}
                key={repository.name}
                onRelease={onRelease}
              />
            ))}
          </div>
        )}
      </Card.Container>
    </div>
  )
}
