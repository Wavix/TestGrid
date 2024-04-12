import Head from "next/head"
import { useContext } from "react"

import { LoginContext } from "@/ui/LoginContext"
import { Card, SectionWrapper } from "@/ui/components/layout"

import type { NextPage } from "next"

const ProfilePage: NextPage = () => {
  const { user } = useContext(LoginContext)

  const getStatus = () => {
    return user?.is_admin ? "Admin" : "User"
  }

  return (
    <>
      <Head>
        <title>TestGrid - Profile</title>
      </Head>

      <SectionWrapper title="Profile">
        <Card.Container>
          <p>{user?.email}</p>
          <p>{user?.name}</p>

          <p>Status: {getStatus()}</p>
        </Card.Container>
      </SectionWrapper>
    </>
  )
}

export default ProfilePage
