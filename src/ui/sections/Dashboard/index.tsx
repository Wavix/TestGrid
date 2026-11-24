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
import { StandSwitcher } from "./StandSwitcher"
import { StandView } from "./StandView"
import { isPersonalStand, isStandFreeFor, selectStand } from "./standSelection"
import style from "./style.module.scss"

import type { DashboardRepositoryItem, DashboardStandItem } from "@/app/backend/dashboard/interface"
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
    if (response.error || !response.stands) return

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

  const getRequestedStand = (): string | undefined =>
    typeof router.query.stand === "string" ? router.query.stand : undefined

  const handleSelectStand = (name: string) => {
    router.push({ query: { ...router.query, stand: name } }, undefined, { shallow: true })
  }

  const getVisibleRepositories = (stand: DashboardStandItem): Array<DashboardRepositoryItem> => {
    const componentsFilter = getComponentsFilter()
    const isOwnOnly = !!router.query.own

    return stand.repositories.filter(
      repository =>
        (!componentsFilter.length || componentsFilter.includes(repository.name)) &&
        (!isOwnOnly || repository.booking?.user?.id === user?.id)
    )
  }

  const stands = [
    ...booking.filter(stand => !isPersonalStand(stand)),
    ...booking.filter(stand => isPersonalStand(stand))
  ]
  const selectedStand = selectStand(stands, getRequestedStand())
  const componentsFilter = getComponentsFilter()
  const highlightedNames = stands.filter(stand => isStandFreeFor(stand, componentsFilter)).map(stand => stand.name)

  return (
    <>
      <Head>
        <title>TestGrid - Dashboards</title>
      </Head>

      <SectionWrapper title="Dashboard" description={user?.namespace.name}>
        <StandSwitcher
          stands={stands}
          selectedName={selectedStand?.name}
          highlightedNames={highlightedNames}
          onSelect={handleSelectStand}
        />

        <DashboardFilters items={booking} />

        {selectedStand && (
          <div className={style.selectedStand}>
            <StandView
              key={selectedStand.id}
              item={selectedStand}
              repositories={getVisibleRepositories(selectedStand)}
              user={user}
              onRelease={onRelease}
              onChangeSmokeTestMode={onChangeSmokeTestMode}
            />
          </div>
        )}

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
