import dayjs from "dayjs"
import Head from "next/head"
import { useRouter } from "next/router"
import { useContext, useEffect, useState } from "react"

import { LoginContext } from "@/ui/LoginContext"
import { getMetric } from "@/ui/api/metric"
import { RangeDatePicker } from "@/ui/components/form"
import { Card, SectionWrapper } from "@/ui/components/layout"

import { PieGraphic } from "./Pie"

import type { UserBookStatistics } from "@/interfaces/statistics.interface"
import type { NextPage } from "next"

type SelectedDate = Date | null

const MetricPage: NextPage = () => {
  const router = useRouter()

  const initialFrom = router.query.from ? dayjs(String(router.query.from)).toDate() : dayjs().startOf("day").toDate()
  const initialTo = router.query.to ? dayjs(String(router.query.to)).toDate() : dayjs().endOf("day").toDate()
  const [metrics, setMetrics] = useState<UserBookStatistics>({ users: [], total: 0 })
  const [range, setRange] = useState<[SelectedDate, SelectedDate]>([initialFrom, initialTo])

  const { user } = useContext(LoginContext)

  const getMetricHandle = async () => {
    const response = await getMetric(range[0], range[1])
    if (response.users) setMetrics(response)
  }

  const onDateChange = () => {
    const [from, to] = range

    if (!from) {
      delete router.query.from
    } else {
      router.query.from = dayjs(from).format()
    }

    if (!to) {
      delete router.query.to
    } else {
      router.query.to = dayjs(to).format()
    }

    router.push(router)
  }

  useEffect(() => {
    getMetricHandle()
  }, [router.query.from, router.query.to])

  useEffect(() => {
    onDateChange()
  }, [range])

  if (!user?.is_admin) return null

  return (
    <>
      <Head>
        <title>TestGrid - Metric</title>
      </Head>

      <SectionWrapper title="Metric">
        <Card.Container>
          <Card.Header>Chart</Card.Header>

          <RangeDatePicker
            startDate={range[0] || undefined}
            endDate={range[1] || undefined}
            onChange={selectedRange => setRange([selectedRange.from, selectedRange.to])}
          />

          <div style={{ width: "600px" }}>
            <PieGraphic stats={metrics} />
          </div>
        </Card.Container>
      </SectionWrapper>
    </>
  )
}

export default MetricPage
