import { useRouter } from "next/router"
import { useEffect, useState } from "react"

import { ChakraProvider } from "@chakra-ui/react"

import { LoginContext } from "@/ui/LoginContext"
import { checkToken } from "@/ui/api/user"
import { DefaultLayout } from "@/ui/components/layout"

import "../index.css"
import type { UserResponseWithNameSpace } from "@/interfaces/auth.interface"
import type { AppProps } from "next/app"

const UNAUTHENTICATED_ROUTES = ["/login", "/set-password"]

const MyApp = ({ Component, pageProps }: AppProps) => {
  const router = useRouter()

  const [isLogin, setLoginIsLogin] = useState(false)
  const [isTokenChecked, setTokenChecked] = useState(false)
  const [user, setUser] = useState<UserResponseWithNameSpace | null>(null)

  const onChangeLoginState = (isLoginState: boolean) => {
    setLoginIsLogin(isLoginState)

    if (isLoginState) onGetUserByToken()
  }

  const checkAuthTonken = async () => {
    const success = await onGetUserByToken()

    setTokenChecked(true)
    onChangeLoginState(success)
  }

  const onGetUserByToken = async (): Promise<boolean> => {
    const token = localStorage.getItem("auth_jwt")
    if (!token) {
      setTokenChecked(true)
      return false
    }

    const response = await checkToken(token)
    if (response?.error) {
      setTokenChecked(true)
      return false
    }

    setUser(response)
    return true
  }

  useEffect(() => {
    if (!isLogin && isTokenChecked && !UNAUTHENTICATED_ROUTES.includes(router.pathname)) {
      router.push("/login")
    }
  }, [router.pathname, isTokenChecked, isLogin])

  useEffect(() => {
    if (isLogin && UNAUTHENTICATED_ROUTES.includes(router.pathname))
      router.push("/dashboard", undefined, { shallow: true })
  }, [isLogin])

  useEffect(() => {
    checkAuthTonken()
  }, [])

  if (!isTokenChecked) return null

  return (
    <ChakraProvider>
      <LoginContext.Provider value={{ onLoginStateChange: onChangeLoginState, user }}>
        {isLogin ? (
          <DefaultLayout>
            <Component {...pageProps} />
          </DefaultLayout>
        ) : (
          <Component {...pageProps} />
        )}
      </LoginContext.Provider>
    </ChakraProvider>
  )
}

export default MyApp
