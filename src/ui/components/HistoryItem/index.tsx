import classNames from "classnames"
import dayjs from "dayjs"
import { useRouter } from "next/router"
import React, { useContext } from "react"

import { LoginContext } from "@/ui/LoginContext"
import { BookLabel } from "@/ui/components"
import style from "@/ui/components/History/style.module.scss"

import type { BookingHistoryItem } from "@/interfaces/booking-history.interface"
import type { FC } from "react"

type Props = {
  item: BookingHistoryItem
}

const HistoryItem: FC<Props> = ({ item }) => {
  const router = useRouter()
  const { user } = useContext(LoginContext)

  const onClickHandler = () => {
    if (!user?.is_admin || !item.user?.id || router.pathname.includes("admin")) return

    router.push(`/admin/users/${item.user.id}`)
  }

  return (
    <div className={style.historyRow} key={item.id}>
      <BookLabel status={item.action} />
      <span
        onClick={onClickHandler}
        className={classNames(style.user, {
          [style.canRedirectOnUser]: user?.is_admin && !router.pathname.includes("admin")
        })}
      >
        {item.user?.name || ""}
      </span>
      <span>{item.repository}</span>
      <span className={style.stand}>{item.stand}</span>
      <span className={style.time}>{dayjs(item.created_at).fromNow()}</span>
    </div>
  )
}

export default HistoryItem
