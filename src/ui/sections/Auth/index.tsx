import getConfig from "next/config"
import Head from "next/head"
import { useRouter } from "next/router"
import { useState } from "react"

import { Lines } from "./Lines"
import { LogoIcon } from "./Logo"
import SetPasswordForm from "./SetPasswordForm"
import SignInForm from "./SignInForm"
import style from "./style.module.scss"

import type { NextPage } from "next"

const Auth: NextPage = () => {
  const router = useRouter()
  const section = router.pathname.split("/")[1]

  const { publicRuntimeConfig } = getConfig()

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const version = publicRuntimeConfig?.version

  const onError = (error: string | null) => {
    setErrorMessage(error)
  }

  return (
    <>
      <Head>
        <title>TestGrid - Welcome!</title>
      </Head>
      <div className={style.authPage}>
        <div className={style.mainWindow}>
          <div className={style.mainWindowContainer}>
            <div className={style.left}>
              <div className={style.container}>
                <LogoIcon />
                <div className={style.welcome}>Welcome Page</div>
                <div className={style.welcome2}>Sign in to start booking QA env</div>
                <div className={style.link}>
                  <a href="#" target="_blank">
                    testgrid.wavix.com
                  </a>
                </div>
              </div>
              <div className={style.lines}>
                <Lines />
              </div>
            </div>
            <div className={style.right}>
              <div className={style.container}>
                {section === "login" && <SignInForm onError={onError} />}
                {section === "set-password" && <SetPasswordForm onError={onError} />}
                <div className={style.errorMessage}>{errorMessage}</div>
              </div>
            </div>
          </div>
        </div>
        <div className={style.version}>v{version}</div>
      </div>
    </>
  )
}

export default Auth
