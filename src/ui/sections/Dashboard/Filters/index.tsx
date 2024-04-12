import { useRouter } from "next/router"
import { useEffect, useState } from "react"

import { Select, Switch, type MultiValue } from "@/ui/components/form"
import { Card } from "@/ui/components/layout"

import style from "./style.module.scss"

import type { DashboardStandItem } from "@/app/backend/dashboard/interface"
import type { FC } from "react"

interface Props {
  items: Array<DashboardStandItem>
}

interface ComponentOption {
  label: string
  value: string
}

export const DashboardFilters: FC<Props> = ({ items }) => {
  const router = useRouter()
  const [componentsOptions, setComponentsOptions] = useState<Array<ComponentOption>>([])

  const onChangeComponentFilter = (option: MultiValue) => {
    if (!option.length) {
      delete router.query.components
      router.push(router)
      return
    }

    router.query.components = option.join(",")
    router.push(router)
  }

  const onOwnFilter = (checked: boolean) => {
    if (checked) {
      router.query.own = "true"
    } else {
      delete router.query.own
    }
    router.push(router)
  }

  const getComponentsValues = (): Array<string> => {
    if (!router.query.components) return []
    if (typeof router.query.components !== "string") return []
    return router.query.components.split(",")
  }

  useEffect(() => {
    if (!items.length) {
      setComponentsOptions([])
      return
    }

    const componentList = items?.at(0)?.repositories.map(repository => repository.name)
    if (!componentList) {
      setComponentsOptions([])
      return
    }

    const options = componentList.map(component => ({ label: component, value: component }))

    setComponentsOptions(options)
  }, [items])

  return (
    <Card.Container>
      <div className={style.filters}>
        <Select
          options={componentsOptions}
          placeholder="Find free stands for components"
          value={getComponentsValues()}
          onChangeMulti={onChangeComponentFilter}
          isMulti
        />
        <div className={style.column}>
          <Switch
            title="Only my bookings"
            isChecked={!!router.query.own}
            onChange={onOwnFilter}
            titlePosition="right"
          />
        </div>
      </div>
    </Card.Container>
  )
}
