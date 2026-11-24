import { StandKind } from "@/interfaces/stand.interface"
import { Switch } from "@/ui/components/form"
import { Card } from "@/ui/components/layout"

import { K8sPanel } from "./K8sPanel"
import { RepositoryItem } from "./RepositoryItem"
import style from "./style.module.scss"

import type { ClusterCapacity, DashboardStandItem, StandAction } from "@/app/backend/dashboard/interface"
import type { User } from "@/ui/LoginContext"
import type { FC } from "react"

interface Props {
  item: DashboardStandItem
  cluster?: ClusterCapacity
  user: User
  onRelease: (repositoryId: number) => void
  onChangeSmokeTestMode: (id: number, state: boolean) => void
  onStandAction: (stand: DashboardStandItem, action: StandAction) => void
}

export const StandItem: FC<Props> = ({ user, item, cluster, onRelease, onChangeSmokeTestMode, onStandAction }) => {
  const isPersonal = item.kind === StandKind.Ephemeral
  const isOwner = !!item.owner && item.owner === user?.email
  const canManage = !!user?.is_admin || (isPersonal && isOwner)

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
        {item.k8s && cluster && (
          <K8sPanel
            info={item.k8s}
            cluster={cluster}
            canManage={canManage}
            canDelete={isPersonal && canManage}
            onAction={action => onStandAction(item, action)}
          />
        )}
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
