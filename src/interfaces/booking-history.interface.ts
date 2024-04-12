import type { BookStatus } from "@/interfaces/book.interface"

export interface BookingHistoryItem {
  id: number
  stand: string
  repository: string
  created_at: Date
  action: BookStatus
  user: {
    id: number
    name: string
    email: string
  } | null
}

export interface BookingHistoryResponse {
  booking_history: Array<BookingHistoryItem>
}
