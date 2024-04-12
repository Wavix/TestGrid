import type { DashboardStandItem } from "@/app/backend/dashboard/interface"
import type { BookingAttributes } from "@/app/database/interfaces/booking.interface"
import type { RepositoryAttributes } from "@/app/database/interfaces/repository.interface"
import type { StandAttributes } from "@/app/database/interfaces/stand.interface"
import type { UserAttributes } from "@/app/database/interfaces/user.interface"
import type { BaseUserResponse } from "@/interfaces/auth.interface"

export class DashboardService {
  public getDashboard(
    stands: Array<StandAttributes>,
    books: Array<BookingAttributes>,
    repositories: Array<RepositoryAttributes>,
    user: BaseUserResponse
  ): Array<DashboardStandItem> {
    return stands.map(stand => {
      const standBooks = books.filter(booking => booking.stand_id === stand.id)

      return {
        id: stand.id,
        name: stand.name,
        is_smoke_test: stand.is_smoke_test,
        repositories: repositories.map(repo => {
          const booking = standBooks.find(item => item.repository_id === repo.id)

          return {
            id: repo.id,
            name: repo.name,
            booking: booking
              ? {
                  id: booking.id,
                  created_at: booking.created_at,
                  can_release: booking.user?.id === user.id || user.is_admin,
                  branch_name: booking.branch_name,
                  task_name: this.getJiraTaskName(booking.branch_name),
                  user: booking.user as UserAttributes
                }
              : null
          }
        })
      }
    })
  }

  private getJiraTaskName(branchName: string): string | null {
    const regex = /([A-Za-z]+-\d+)/
    const match = branchName.match(regex)

    if (match) return match[0].toUpperCase()
    return null
  }
}
