import classNames from "classnames"

import { Switch as ChakraSwitch } from "@chakra-ui/react"

import { HintLabel } from "../HintLabel"

import style from "./style.module.scss"

import type { FC } from "react"

interface Props {
  title: string
  hint?: string
  titlePosition?: "top" | "right" | "left"
  defaultChecked?: boolean
  isChecked?: boolean
  readonly?: boolean
  onChange?: (checked: boolean) => void
}

export const Switch: FC<Props> = ({
  title,
  hint,
  defaultChecked,
  isChecked,
  readonly,
  onChange,
  titlePosition = "top"
}) => {
  return (
    <div>
      {titlePosition === "top" && <HintLabel value={title} hint={hint} />}

      <div className={classNames(style.switchContainer, { [style.readonly]: readonly })}>
        {titlePosition === "left" && (
          <div className={classNames(style.inlineHint, style.left, { [style.hint]: !!hint })}>
            <HintLabel value={title} hint={hint} />
          </div>
        )}

        <ChakraSwitch
          size="lg"
          colorScheme="facebook"
          defaultChecked={defaultChecked}
          isChecked={isChecked}
          readOnly={readonly}
          onChange={e => (onChange ? onChange(e.target.checked) : undefined)}
        />

        {titlePosition === "right" && (
          <div className={style.inlineHint}>
            <HintLabel value={title} hint={hint} />
          </div>
        )}
      </div>
    </div>
  )
}
