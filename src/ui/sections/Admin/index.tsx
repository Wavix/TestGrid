import classNames from "classnames"
import Head from "next/head"
import { useRouter } from "next/router"
import React, { useContext, useEffect, useState } from "react"

import { Button, Checkbox, Table, Stack, Skeleton } from "@chakra-ui/react"

import { useFailureToast, useSuccessToast } from "@/hooks/toast"
import { LoginContext } from "@/ui/LoginContext"
import { getUsers, updateUser, resetPassword } from "@/ui/api/admin"
import { Card, SectionWrapper } from "@/ui/components/layout"

import style from "./style.module.scss"

import type { UserListItem } from "@/interfaces/auth.interface"

const TABLE_CSS = {
  "background": "transparent",
  "color": "white",
  "& tr": {
    background: "transparent"
  },
  "& th, & td": {
    background: "transparent",
    border: "none",
    color: "inherit",
    paddingInline: "24px"
  },
  "& th": {
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase"
  },
  "& td": {
    paddingBlock: "24px"
  }
}

const Admin = () => {
  const successToast = useSuccessToast()
  const failureToast = useFailureToast()
  const router = useRouter()
  const { user: currentUser } = useContext(LoginContext)

  const [isLoading, setLoading] = useState(false)
  const [users, setUsers] = useState<Array<UserListItem>>([])

  useEffect(() => {
    if (!currentUser?.is_admin) {
      router.replace("/dashboard")
    }

    getUsersList(true)
  }, [])

  const getUsersList = async (loader?: boolean) => {
    if (loader) setLoading(true)

    const response = await getUsers()

    setLoading(false)
    setUsers(response.users)
  }

  const onChangeCheckbox = async (user: UserListItem, field: "is_admin" | "is_active") => {
    await updateUser({ ...user, [field]: !user[field] })
    getUsersList(false)
  }

  const onResetPassword = async (userId: number) => {
    const response = await resetPassword(userId)

    response.success ? successToast("Successfully reset password") : failureToast("Error while reset password")
  }

  const onUserRedirectHandler = (userId: number) => {
    router.replace(`/admin/users/${userId}`)
  }

  return (
    <>
      <Head>
        <title>TestGrid - Admin</title>
      </Head>
      <SectionWrapper title="Admin" description={`User management area for ${currentUser?.namespace.name} namespace`}>
        <Card.Container>
          {isLoading ? (
            <Stack padding={4} gap={1}>
              {[...Array(4)].map((_, index) => (
                <Skeleton key={index} height="73px" opacity={0.1} />
              ))}
            </Stack>
          ) : (
            <Table.ScrollArea>
              <Table.Root css={TABLE_CSS}>
                <Table.Header>
                  <Table.Row className={style.tableHeader}>
                    <Table.ColumnHeader>ID</Table.ColumnHeader>
                    <Table.ColumnHeader>Name</Table.ColumnHeader>
                    <Table.ColumnHeader>Email</Table.ColumnHeader>
                    <Table.ColumnHeader>Active</Table.ColumnHeader>
                    <Table.ColumnHeader>Admin</Table.ColumnHeader>
                    <Table.ColumnHeader>Actions</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {users.map(item => (
                    <Table.Row key={item.id} className={style.tableItem}>
                      <Table.Cell>{item.id}</Table.Cell>
                      <Table.Cell
                        className={classNames({ [style.admin]: item.is_admin, [style.blocked]: !item.is_active })}
                      >
                        {item.name}
                      </Table.Cell>
                      <Table.Cell>
                        <span className={style.email} onClick={() => onUserRedirectHandler(item.id)}>
                          {item.email}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <Checkbox.Root
                          colorPalette="blue"
                          onCheckedChange={() => onChangeCheckbox(item, "is_active")}
                          checked={item.is_active}
                          disabled={item.id === currentUser?.id}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                        </Checkbox.Root>
                      </Table.Cell>
                      <Table.Cell>
                        <Checkbox.Root
                          colorPalette="blue"
                          onCheckedChange={() => onChangeCheckbox(item, "is_admin")}
                          checked={item.is_admin}
                          disabled={item.id === currentUser?.id}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                        </Checkbox.Root>
                      </Table.Cell>
                      <Table.Cell>
                        <Button variant="plain" color="white" fontWeight={700} onClick={() => onResetPassword(item.id)}>
                          Reset password
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Table.ScrollArea>
          )}
        </Card.Container>
      </SectionWrapper>
    </>
  )
}

export default Admin
