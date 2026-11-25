import { createContext, useEffect, useState } from "react"

import type { FC, ReactNode } from "react"

export enum Theme {
  Light = "light",
  Dark = "dark"
}

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

export const THEME_STORAGE_KEY = "tg-theme"

export const ThemeContext = createContext<ThemeContextValue>({ theme: Theme.Dark, toggleTheme: () => {} })

export const ThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(Theme.Dark)

  useEffect(() => {
    setTheme(document.documentElement.dataset.tgTheme === Theme.Light ? Theme.Light : Theme.Dark)
  }, [])

  const toggleTheme = () => {
    const next = theme === Theme.Dark ? Theme.Light : Theme.Dark

    document.documentElement.dataset.tgTheme = next
    localStorage.setItem(THEME_STORAGE_KEY, next)
    setTheme(next)
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}
