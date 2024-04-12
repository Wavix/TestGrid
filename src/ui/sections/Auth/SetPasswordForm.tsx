import { useRouter } from "next/router"
import { useEffect, useState, useContext } from "react"

import { LoginContext } from "@/ui/LoginContext"
import * as API from "@/ui/api/user"

import { Button } from "./Button"
import { Input } from "./Input"
import style from "./style.module.scss"

import type { FC } from "react"

interface Props {
  onError: (error: string | null) => void
}

const SetPasswordForm: FC<Props> = ({ onError }) => {
  const router = useRouter()
  const { onLoginStateChange } = useContext(LoginContext)

  const [isLoading, setIsLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [user, setUser] = useState("")
  const [isFormDisabled, setIsFormDisabled] = useState(false)

  useEffect(() => {
    const { key } = router.query

    if (!key) {
      onError("Token incorrect")
      setIsFormDisabled(true)
      return
    }

    onError(null)
    setIsFormDisabled(false)

    const userKey = Buffer.from(key as string, "base64").toString("utf-8")
    setUser(userKey)
  }, [router.query])

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSetPassword()
  }

  const onSetPassword = async () => {
    setIsLoading(true)
    onError(null)

    try {
      if (password !== passwordConfirm) throw Error("Passwords do not match")
      if (password.length < 6) throw Error("Password must be at least 6 characters long")

      const response = await API.setPassword(user, password)

      if ("error" in response) throw Error(response.error)
      if ("token" in response) localStorage.setItem("auth_jwt", response.token)

      onLoginStateChange(true)
    } catch (error) {
      onError((error as Error).message)
      return
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <h1>Set password</h1>
      {!isFormDisabled && (
        <div>
          <div className={style.emailLabel}>{user}</div>
          <form className={style.form} onSubmit={onFormSubmit}>
            <Input
              type="password"
              placeHolder="password"
              value={password}
              focused
              onChange={value => setPassword(value)}
            />
            <Input
              type="password"
              placeHolder="password confirm"
              value={passwordConfirm}
              onChange={value => setPasswordConfirm(value)}
            />
            <button type="submit">Submit</button>
            <Button
              text="continue"
              disabled={isLoading || password !== passwordConfirm || !password.trim()}
              onClick={onSetPassword}
            />
          </form>
        </div>
      )}
    </>
  )
}

export default SetPasswordForm
