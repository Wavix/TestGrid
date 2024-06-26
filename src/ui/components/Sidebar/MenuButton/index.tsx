import classNames from "classnames"
import { useRouter } from "next/router"
import React, { type FC } from "react"

import style from "./style.module.scss"

interface Props {
  content: JSX.Element
  href?: string
  onClick?: () => void
  active?: boolean
}

export const MenuButton: FC<Props> = ({ content, href, active, onClick }) => {
  const router = useRouter()

  const onClickHandler = () => {
    if (href) router.push(href, undefined, { shallow: true })
    if (onClick) onClick()
  }

  return (
    <div className={classNames(style.menuButtonWrapper, { [style.active]: active })} onClick={onClickHandler}>
      <div className={style.menuButtonIconWrapper}>{content}</div>
    </div>
  )
}
