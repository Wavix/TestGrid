import Head from "next/head"
import { useRouter } from "next/router"
import { useEffect, useRef, useState, useContext } from "react"

import { useFailureToast, useSuccessToast } from "@/hooks/toast"
import { LoginContext } from "@/ui/LoginContext"
import { updateStand } from "@/ui/api/admin"
import { getBooking, release } from "@/ui/api/booking"
import { History } from "@/ui/components"
import { Card, SectionWrapper } from "@/ui/components/layout"

import { DashboardFilters } from "./Filters"
import { StandItem } from "./StandItem"
import style from "./style.module.scss"

import type { DashboardStandItem } from "@/app/backend/dashboard/interface"
import type { NextPage } from "next"

const REFRESH_BOOKINGS_INTERVAL_SEC = 5

const DashboardPage: NextPage = () => {
  const router = useRouter()
  const successToast = useSuccessToast()
  const failureToast = useFailureToast()
  const { user } = useContext(LoginContext)
  const [booking, setBooking] = useState<Array<DashboardStandItem>>([])

  const updateInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    getBookings()
    startUpdateInterval()

    return () => {
      if (updateInterval.current) clearInterval(updateInterval.current)
    }
  }, [])

  const getBookings = async () => {
    const response = await getBooking()
    setBooking(response.stands)
  }

  const getComponentsFilter = (): Array<string> => {
    if (!router.query.components) return []
    if (typeof router.query.components !== "string") return []
    return router.query.components.split(",")
  }

  const startUpdateInterval = () => {
    if (updateInterval.current) clearInterval(updateInterval.current)
    updateInterval.current = setInterval(() => getBookings(), REFRESH_BOOKINGS_INTERVAL_SEC * 1000)
  }

  const onRelease = async (repositoryId: number) => {
    const response = await release(repositoryId)
    if (response?.error) {
      failureToast(response.error)
      return
    }

    successToast("Successfully released")
    getBookings()
  }

  const onChangeSmokeTestMode = async (id: number, state: boolean) => {
    const message = state ? "Stand blocked for smoke tests" : "Stand unblocked"
    const response = await updateStand(id, { is_smoke_test: state })

    if (response?.error) {
      failureToast(response.error)
      return
    }

    successToast(message)

    getBookings()
  }

  const getList = (): Array<DashboardStandItem> => {
    if (!booking.length) return []

    const componentsFilter = getComponentsFilter()
    const ownFilter = !!router.query.own
    const hasFilters = componentsFilter.length > 0 || ownFilter

    return booking.reduce((acc: Array<DashboardStandItem>, item) => {
      if (!hasFilters) return [...acc, item]

      if (ownFilter) {
        if (!item.repositories.some(repository => repository.booking?.user?.id === user?.id)) return acc

        const repositories = item.repositories.filter(repo => repo.booking?.user?.id === user?.id)
        return [...acc, { ...item, repositories }]
      }

      if (componentsFilter) {
        const repositories = item.repositories.filter(
          repository =>
            componentsFilter.includes(repository.name) &&
            (!repository.booking || repository.booking?.user?.id === user?.id)
        )

        if (repositories.length < componentsFilter.length) return acc

        return [...acc, { ...item, repositories }]
      }

      return [...acc, item]
    }, [])
  }

  return (
    <>
      <Head>
        <title>TestGrid - Dashboards</title>
      </Head>

      <SectionWrapper title="Dashboard" description={user?.namespace.name}>
        <DashboardFilters items={booking} />

        <div className={style.standsLayout}>
          {getList().map(stand => (
            <StandItem
              user={user}
              item={stand}
              key={stand.name}
              onRelease={onRelease}
              onChangeSmokeTestMode={onChangeSmokeTestMode}
            />
          ))}
        </div>

        <Card.Container>
          <Card.Header>History</Card.Header>
          <div className={style.historyWrapper}>
            <History />
          </div>
        </Card.Container>
      </SectionWrapper>
    </>
  )
}

export default DashboardPage
