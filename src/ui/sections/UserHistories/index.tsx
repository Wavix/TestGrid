import Head from "next/head"
import { useRouter } from "next/router"
import React, { useContext, useEffect, useState } from "react"

import { ArrowBackIcon } from "@chakra-ui/icons"

import { LoginContext } from "@/ui/LoginContext"
import { getUserBookingHistoriesById } from "@/ui/api/admin"
import HistoryItem from "@/ui/components/HistoryItem"
import { SectionWrapper } from "@/ui/components/layout"

import style from "./style.module.scss"

import type { BookingHistoryItem } from "@/interfaces/booking-history.interface"

const UserEdit = () => {
  const router = useRouter()
  const { user } = useContext(LoginContext)

  const [bookingHistories, setBookingHistories] = useState<Array<BookingHistoryItem>>([])
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)

    if (!router.query.userId || !user?.is_admin) router.replace("/dashboards")

    getUser(Number(router.query.userId))
  }, [])

  const getUser = async (userId: number) => {
    const response = await getUserBookingHistoriesById(userId)

    if (response.booking_history) {
      setBookingHistories(response.booking_history)
    }

    setLoading(false)
  }

  const onClickHandler = () => {
    router.push("/admin")
  }

  return (
    <>
      <Head>
        <title>TestGrid - Admin user edit</title>
      </Head>
      {isLoading ? (
        <div>loader</div>
      ) : (
        <SectionWrapper title="User booking history">
          <ArrowBackIcon onClick={onClickHandler} className={style.arrowBack} />
          {bookingHistories.map((item, index) => (
            <HistoryItem key={index.toString()} item={item} />
          ))}
        </SectionWrapper>
      )}
    </>
  )
}

export default UserEdit
