import classNames from "classnames"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import React, { useState, useContext, useEffect, type FC } from "react"

import { config } from "@/config/index"
import { BookStatus } from "@/interfaces/book.interface"
import { LoginContext } from "@/ui/LoginContext"
import { BookLabel, ReleaseButton } from "@/ui/components"

import style from "./style.module.scss"

import type { DashboardRepositoryItem } from "@/app/backend/dashboard/interface"

interface Props {
  item: DashboardRepositoryItem
  isSmokeTest: boolean
  onRelease: (repositoryId: number) => void
}

dayjs.extend(relativeTime)

export const RepositoryItem: FC<Props> = ({ item, isSmokeTest, onRelease }) => {
  const { user } = useContext(LoginContext)
  const [isReleased, setIsReleased] = useState(false)

  const isBooked = !!item.booking
  const canRelease = isBooked && (user?.id === item.booking?.user?.id || user?.is_admin)

  const onReleaseHandle = () => {
    if (!item.booking?.id) return
    setIsReleased(true)
    onRelease(item.booking.id)
  }

  const getLabelStatus = () => {
    if (isSmokeTest) return BookStatus.SmokeTestStart
    return isBooked ? BookStatus.Booked : BookStatus.Free
  }

  useEffect(() => {
    setIsReleased(false)
  }, [item])

  return (
    <div
      className={classNames(style.repositoryItem, {
        [style.booked]: isBooked,
        [style.own]: user?.id === item.booking?.user?.id
      })}
    >
      <div className={style.repositoryName}>{item.name}</div>
      <div>
        {isBooked && (
          <>
            <div className={style.repositoryBookingUser}>{item.booking?.user?.name || "Undefined"}</div>
            <div className={style.repositoryBookingMeta}>
              <span>{dayjs(item.booking?.created_at).fromNow()}</span>{" "}
              {item.booking?.task_name ? (
                <a
                  className={style.repositoryBookingMetaBranch}
                  href={`${config.jiraUrl}/browse/${item.booking.task_name}`}
                  target="_blank"
                >
                  {item.booking?.task_name}
                </a>
              ) : (
                <span className={style.repositoryBookingMetaBranch}>{item.booking?.branch_name}</span>
              )}
            </div>
          </>
        )}
      </div>
      <div className={style.actions}>
        {canRelease && !isReleased && <ReleaseButton onClick={onReleaseHandle} />}

        <BookLabel status={getLabelStatus()} />
      </div>
    </div>
  )
}
