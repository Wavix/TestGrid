import React, { type FC } from "react"

import style from "./style.module.scss"

interface Props {
  onClick: () => void
}

export const ReleaseButton: FC<Props> = ({ onClick }) => {
  return (
    <div className={style.releaseButton} onClick={onClick}>
      Release
    </div>
  )
}
