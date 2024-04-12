import { createContext } from "react"

import type { UserResponseWithNameSpace } from "@/interfaces/auth.interface"

export type User = UserResponseWithNameSpace | null

interface LoginContextProps {
  user: User
  onLoginStateChange: (isLoginState: boolean) => void
}

export const LoginContext = createContext<LoginContextProps>({
  user: null,

  /* eslint-disable-next-line */
  onLoginStateChange: (isLoginState: boolean) => {}
})
