import React, { type FC } from "react"

import style from "./style.module.scss"

interface Props {
  text: string
}

export const H2: FC<Props> = ({ text }) => {
  return <h2 className={style.h2}>{text}</h2>
}
