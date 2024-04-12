import { useRouter } from "next/router"
import { useState, useContext } from "react"

import { LoginContext } from "@/ui/LoginContext"
import * as API from "@/ui/api/user"

import { Button } from "./Button"
import { Input } from "./Input"
import style from "./style.module.scss"

import type { FC } from "react"

interface Props {
  onError: (error: string | null) => void
}

const SignInForm: FC<Props> = ({ onError }) => {
  const router = useRouter()
  const { onLoginStateChange } = useContext(LoginContext)

  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    auth()
  }

  const auth = async () => {
    onError(null)
    setIsLoading(true)

    try {
      const response = await API.auth(email, password)

      if ("is_first_login" in response) return onFirstLogin()
      if ("error" in response) return onError(response.error)
      if ("token" in response) localStorage.setItem("auth_jwt", response.token)

      onLoginStateChange(true)
    } catch (error) {
      onError((error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const onFirstLogin = () => {
    const base64 = Buffer.from(email, "utf-8").toString("base64")
    router.push(`/set-password?key=${base64}`, undefined, { shallow: true })
  }

  return (
    <>
      <h1>Sign In</h1>
      <form className={style.form} onSubmit={onFormSubmit}>
        <Input type="text" placeHolder="email" name="email" value={email} focused onChange={value => setEmail(value)} />
        <Input
          type="password"
          placeHolder="password"
          name="password"
          value={password}
          onChange={value => setPassword(value)}
        />
        <button type="submit">Submit</button>
        <Button text="continue" disabled={isLoading} onClick={auth} />
      </form>
    </>
  )
}

export default SignInForm
