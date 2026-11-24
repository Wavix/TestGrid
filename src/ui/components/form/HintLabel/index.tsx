import { LuCircleHelp } from "react-icons/lu"

import { Portal, Tooltip } from "@chakra-ui/react"

import style from "./style.module.scss"

import type { FC } from "react"

interface Props {
  value: string
  hint?: string
}

export const HintLabel: FC<Props> = ({ value, hint }) => {
  return (
    <div className={style.hintLabel}>
      <div>{value}</div>
      {hint && (
        <div className={style.infoWrapper}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <span>
                <LuCircleHelp color="gray" />
              </span>
            </Tooltip.Trigger>
            <Portal>
              <Tooltip.Positioner>
                <Tooltip.Content
                  css={{ "--tooltip-bg": "black" }}
                  color="white"
                  fontSize="12px"
                  fontWeight={400}
                  maxWidth="250px"
                >
                  <Tooltip.Arrow>
                    <Tooltip.ArrowTip />
                  </Tooltip.Arrow>
                  {hint}
                </Tooltip.Content>
              </Tooltip.Positioner>
            </Portal>
          </Tooltip.Root>
        </div>
      )}
    </div>
  )
}
