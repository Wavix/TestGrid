import ReactSelect from "react-select"

import { HintLabel } from "../HintLabel"

import style from "./style.module.scss"

import type { FC } from "react"

type OptionValue = string | number | null | boolean

interface Option {
  label: string
  value: OptionValue
}

export type Value = OptionValue | undefined
export type MultiValue = Array<Value>

interface Props {
  title?: string
  hint?: string
  value: Value | MultiValue
  isMulti?: boolean
  disabled?: boolean
  placeholder?: string
  options: Array<Option>
  onChange?: (value: Value) => void
  onChangeMulti?: (value: MultiValue) => void
}

export const Select: FC<Props> = ({
  title,
  hint,
  value,
  options,
  isMulti,
  disabled,
  placeholder,
  onChange,
  onChangeMulti
}) => {
  const getValue = () => {
    if (isMulti)
      return options.filter((option: Option) =>
        (value as Array<number | string | null | boolean>).includes(option.value)
      )
    return options.find((option: Option) => option.value === value)
  }

  const onChangeHandler = (newValue: Array<Option> | Option) => {
    if (!onChange && !onChangeMulti) return
    if (isMulti && onChangeMulti) {
      const result = (newValue as Array<Option>).reduce((acc: Array<Value>, item: Option) => [...acc, item.value], [])
      onChangeMulti(result)
      return
    }

    if (onChange) onChange((newValue as Option).value)
  }

  return (
    <div>
      {title && <HintLabel value={title} hint={hint} />}
      <ReactSelect
        value={getValue()}
        isDisabled={disabled}
        placeholder={placeholder || "Select..."}
        // @ts-ignore
        onChange={onChangeHandler}
        options={options}
        className={style.multiSelect}
        isMulti={isMulti}
        classNamePrefix="dropdown"
      />
    </div>
  )
}
