import React, { type FC } from "react"

import style from "./style.module.scss"

interface Props {
  text: string
}

export const H1: FC<Props> = ({ text }) => {
  return <h1 className={style.h1}>{text}</h1>
}
