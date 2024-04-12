import React, { type FC, type ReactNode } from "react"

import { Sidebar } from "@/ui/components"
import { PageLayout } from "@/ui/components/layout"

import style from "./style.module.scss"

interface Props {
  children: ReactNode
}

export const DefaultLayout: FC<Props> = ({ children }) => {
  return (
    <div className={style.mainLayout}>
      <Sidebar />
      <PageLayout>{children}</PageLayout>
    </div>
  )
}
