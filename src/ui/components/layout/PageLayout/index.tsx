import React, { type FC, type ReactNode } from "react"

import style from "./style.module.scss"

interface Props {
  children: ReactNode
}

export const PageLayout: FC<Props> = ({ children }) => {
  return <div className={style.pageLayout}>{children}</div>
}
