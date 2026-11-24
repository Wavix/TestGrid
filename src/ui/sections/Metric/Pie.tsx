import { Chart as ChartJS, Legend, Tooltip, ArcElement } from "chart.js"
import { useContext } from "react"
import { Pie } from "react-chartjs-2"

import { Theme, ThemeContext } from "@/ui/ThemeContext"

import type { UserBookStatistics } from "@/interfaces/statistics.interface"
import type { FC } from "react"

interface Props {
  stats: UserBookStatistics
}

ChartJS.register(ArcElement, Tooltip, Legend)

const LEGEND_COLORS: Record<Theme, string> = {
  [Theme.Dark]: "#fafafa",
  [Theme.Light]: "#171717"
}

export const PieGraphic: FC<Props> = ({ stats }) => {
  const { theme } = useContext(ThemeContext)
  const getColor = (username: string): string => {
    const hashCode = username.split("").reduce((prev, curr) => prev + curr.charCodeAt(0), 0)

    const red = (hashCode * 89) % 256
    const green = (hashCode * 43) % 256
    const blue = (hashCode * 157) % 256

    const alpha = 0.3

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`
  }

  const users = stats.users.map(item => `${item.user.name} [${item.total}]`)
  const userStats = stats.users.map(item => item.total)
  const colors = users.map(user => getColor(user))

  const data = {
    labels: users,
    datasets: [
      {
        label: "review deployments",
        data: userStats,
        borderWidth: 0,
        backgroundColor: colors
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    defaultFontColor: LEGEND_COLORS[theme],
    plugins: {
      legend: {
        display: true,
        position: "right",
        labels: {
          color: LEGEND_COLORS[theme],
          font: {
            size: 15
          }
        }
      },
      tooltip: {
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        displayColors: true
      }
    }
  }

  // @ts-ignore
  return <Pie height={100} options={options} data={data} />
}
