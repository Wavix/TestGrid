import { useRouter } from "next/router"
import React, { type FC, useContext } from "react"

import { Avatar } from "@chakra-ui/react"

import { LoginContext } from "@/ui/LoginContext"

import { MenuButton } from "./MenuButton"
import { Notifications } from "./Notifications"
import { HomeIcon, LogoIcon, LogoutIcon, TemplatesIcon, StatsIcon } from "./icons"
import style from "./style.module.scss"

enum Section {
  Dashboard = "dashboard",
  Admin = "admin",
  Metric = "metric"
}

export const Sidebar: FC = () => {
  const router = useRouter()
  const { onLoginStateChange, user } = useContext(LoginContext)

  const currentSection = router.asPath.split("/")[1].split(/[?&]/, 1)[0] || ""

  const logOut = () => {
    onLoginStateChange(false)
    localStorage.removeItem("auth_jwt")
    router.push("/login")
  }

  return (
    <div className={style.sidebar}>
      <div className={style.logoWrapper}>
        <LogoIcon />
      </div>
      <MenuButton content={<HomeIcon />} href="/dashboard" active={currentSection === Section.Dashboard} />
      {user?.is_admin && (
        <>
          <MenuButton content={<TemplatesIcon />} href="/admin" active={currentSection === Section.Admin} />
          <MenuButton content={<StatsIcon />} href="/metric" active={currentSection === Section.Metric} />
        </>
      )}

      <div className={style.bottom}>
        <Notifications />
        <MenuButton content={<LogoutIcon />} onClick={logOut} />
        <Avatar
          size="sm"
          name={user?.name}
          className={style.avatar}
          onClick={() => router.push("/profile", undefined, { shallow: true })}
        />
      </div>
    </div>
  )
}
