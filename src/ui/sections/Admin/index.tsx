import classNames from "classnames"
import Head from "next/head"
import { useRouter } from "next/router"
import React, { useContext, useEffect, useState } from "react"

import { Button, Checkbox, Table, TableContainer, Tbody, Td, Th, Thead, Tr, Stack, Skeleton } from "@chakra-ui/react"

import { useFailureToast, useSuccessToast } from "@/hooks/toast"
import { LoginContext } from "@/ui/LoginContext"
import { getUsers, updateUser, resetPassword } from "@/ui/api/admin"
import { Card, SectionWrapper } from "@/ui/components/layout"

import style from "./style.module.scss"

import type { UserListItem } from "@/interfaces/auth.interface"

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
            <Stack padding={4} spacing={1}>
              {[...Array(4)].map((_, index) => (
                <Skeleton key={index} height="73px" fadeDuration={1} opacity={0.1} />
              ))}
            </Stack>
          ) : (
            <TableContainer>
              <Table variant="striped" colorScheme="blackAlpha">
                <Thead>
                  <Tr className={style.tableHeader}>
                    <Th>ID</Th>
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>Active</Th>
                    <Th>Admin</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {users.map(item => (
                    <Tr key={item.id} className={style.tableItem}>
                      <Td>{item.id}</Td>
                      <Td className={classNames({ [style.admin]: item.is_admin, [style.blocked]: !item.is_active })}>
                        {item.name}
                      </Td>
                      <Td>
                        <span className={style.email} onClick={() => onUserRedirectHandler(item.id)}>
                          {item.email}
                        </span>
                      </Td>
                      <Td>
                        <Checkbox
                          onChange={() => onChangeCheckbox(item, "is_active")}
                          isChecked={item.is_active}
                          disabled={item.id === currentUser?.id}
                        />
                      </Td>
                      <Td>
                        <Checkbox
                          onChange={() => onChangeCheckbox(item, "is_admin")}
                          isChecked={item.is_admin}
                          disabled={item.id === currentUser?.id}
                        />
                      </Td>
                      <Td>
                        <Button colorScheme="telegram" onClick={() => onResetPassword(item.id)}>
                          Reset password
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </Card.Container>
      </SectionWrapper>
    </>
  )
}

export default Admin
