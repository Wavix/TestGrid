import classNames from "classnames"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import React, { type FC, useEffect, useState, useRef } from "react"
import useSound from "use-sound"

import { BellIcon } from "@chakra-ui/icons"
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure
} from "@chakra-ui/react"

import { getNotifications, readNotifications } from "@/ui/api/notifications"

import { MenuButton } from "./MenuButton"
import style from "./style.module.scss"

import type { NotificationListItem } from "@/app/backend/notifications/interface"

const REFRESH_INTERVAL_SEC = 5

dayjs.extend(relativeTime)

export const Notifications: FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [play] = useSound("/audio/notification.mp3")
  const [notifications, setNotifications] = useState<Array<NotificationListItem> | null>([])
  const updateInterval = useRef<NodeJS.Timeout | null>(null)
  const player = useRef<HTMLButtonElement | null>(null)

  const getNotificationsHandler = async () => {
    try {
      const response = await getNotifications()

      if (notifications && notifications.length < response.notifications.length) {
        onPlayNotification()
      }

      setNotifications(response.notifications)
    } catch (error) {
      console.error(error)
    }
  }

  const startUpdateInterval = () => {
    if (updateInterval.current) clearInterval(updateInterval.current)
    updateInterval.current = setInterval(() => getNotificationsHandler(), REFRESH_INTERVAL_SEC * 1000)
  }

  // Read all notifications on drawer CLOSE
  const readNotificationsHandler = () => {
    if (isOpen) return
    if (!notifications?.length) return

    const notificationsIds = notifications.map(notification => notification.id)
    readNotifications(notificationsIds)
  }

  const onPlayNotification = () => {
    player.current?.click()
  }

  useEffect(() => {
    getNotificationsHandler()
    startUpdateInterval()

    return () => {
      if (updateInterval.current) clearInterval(updateInterval.current)
    }
  }, [])

  useEffect(() => {
    readNotificationsHandler()
    if (!isOpen) setNotifications([])
  }, [isOpen])

  useEffect(() => {
    startUpdateInterval()
  }, [notifications])

  return (
    <div className={style.notifications}>
      <MenuButton
        content={
          <div
            className={classNames(style.notificationIcon, { [style.new]: notifications && notifications.length > 0 })}
          >
            <BellIcon />
          </div>
        }
        onClick={onOpen}
      />

      <button ref={player} onClick={() => play()} type="button" className={style.player}>
        Player
      </button>

      <Drawer size="lg" isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent className={style.notificationsDrawer}>
          <DrawerCloseButton className={style.closeButton} />
          <DrawerHeader className={style.header}>Notifications</DrawerHeader>
          <DrawerBody className={style.drawerBody}>
            {notifications && notifications.length > 0 ? (
              notifications.map(notification => (
                <div key={notification.id} className={style.notificationItem}>
                  <div className={style.date}>{dayjs(notification.created_at).fromNow()}</div>
                  <div className={style.message}>{notification.message}</div>
                </div>
              ))
            ) : (
              <p>No notifications</p>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
