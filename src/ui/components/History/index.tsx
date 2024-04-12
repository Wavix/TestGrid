import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { type FC, useEffect, useRef, useState } from "react"

import { getHistory } from "@/ui/api/history"
import HistoryItem from "@/ui/components/HistoryItem"

import type { BookingHistoryItem } from "@/interfaces/booking-history.interface"

dayjs.extend(relativeTime)

const REFRESH_INTERVAL = 5_000

export const History: FC = () => {
  const [history, setHistory] = useState<Array<BookingHistoryItem>>([])
  const updateInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    getHistoryList()
    startUpdateInterval()

    return () => {
      if (updateInterval.current) clearInterval(updateInterval.current)
    }
  }, [])

  const getHistoryList = async () => {
    const response = await getHistory()
    if (!response?.booking_history) return

    setHistory(response.booking_history)
  }

  const startUpdateInterval = () => {
    if (updateInterval.current) clearInterval(updateInterval.current)
    updateInterval.current = setInterval(() => getHistoryList(), REFRESH_INTERVAL)
  }

  return (
    <div>
      {history.map((item, index) => (
        <HistoryItem key={index.toString()} item={item} />
      ))}
    </div>
  )
}
