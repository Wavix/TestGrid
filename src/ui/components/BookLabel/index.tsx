import classNames from "classnames"
import React, { type FC } from "react"

import { BookStatus } from "@/interfaces/book.interface"

import style from "./style.module.scss"

interface Props {
  status: BookStatus
}

export const BookLabel: FC<Props> = ({ status }) => {
  const getLabel = () => {
    switch (status) {
      case BookStatus.Free:
        return "free"
      case BookStatus.Release:
      case BookStatus.SmokeTestStop:
        return "release"
      case BookStatus.Booked:
        return "booked"
      case BookStatus.Blocked:
        return "blocked"
      case BookStatus.SmokeTestStart:
        return "smoke"
      default:
        return ""
    }
  }
  return (
    <div
      className={classNames(style.bookingLabel, {
        [style.booked]: status === BookStatus.Booked,
        [style.blocked]: status === BookStatus.Blocked,
        [style.smoke]: status === BookStatus.SmokeTestStart
      })}
    >
      {getLabel()}
    </div>
  )
}
