import { useContext } from "react"

import { Theme, ThemeContext } from "@/ui/ThemeContext"

import { MenuButton } from "./MenuButton"

import type { FC } from "react"

const SunIcon: FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0-5a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Zm0 17a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1ZM4.2 4.2a1 1 0 0 1 1.4 0l.7.7a1 1 0 0 1-1.4 1.4l-.7-.7a1 1 0 0 1 0-1.4Zm13.5 13.5a1 1 0 0 1 1.4 0l.7.7a1 1 0 0 1-1.4 1.4l-.7-.7a1 1 0 0 1 0-1.4ZM2 12a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1Zm17 0a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2h-1a1 1 0 0 1-1-1ZM6.3 17.7a1 1 0 0 1 0 1.4l-.7.7a1 1 0 0 1-1.4-1.4l.7-.7a1 1 0 0 1 1.4 0ZM19.8 4.2a1 1 0 0 1 0 1.4l-.7.7a1 1 0 1 1-1.4-1.4l.7-.7a1 1 0 0 1 1.4 0Z" />
  </svg>
)

const MoonIcon: FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.4 14.5A8.5 8.5 0 0 1 9.5 3.6a1 1 0 0 0-1.3-1.2 10.5 10.5 0 1 0 13.4 13.4 1 1 0 0 0-1.2-1.3Z" />
  </svg>
)

export const ThemeToggle: FC = () => {
  const { theme, toggleTheme } = useContext(ThemeContext)

  return <MenuButton content={theme === Theme.Dark ? <SunIcon /> : <MoonIcon />} onClick={toggleTheme} />
}
