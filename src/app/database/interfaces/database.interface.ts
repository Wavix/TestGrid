import type { UserModel } from "./user.interface"
import type { BookingHistoryModel } from "@/app/database/interfaces/booking-history.interface"
import type { BookingModel } from "@/app/database/interfaces/booking.interface"
import type { NamespaceModel } from "@/app/database/interfaces/namespace.interface"
import type { NotificationModel } from "@/app/database/interfaces/notification.interface"
import type { RepositoryModel } from "@/app/database/interfaces/repository.interface"
import type { StandModel } from "@/app/database/interfaces/stand.interface"
import type { Sequelize } from "sequelize"

export interface Models {
  User: UserModel
  Booking: BookingModel
  Repository: RepositoryModel
  Stand: StandModel
  Namespace: NamespaceModel
  BookingHistory: BookingHistoryModel
  Notification: NotificationModel
}

export interface Db {
  connected: boolean
  sequelize: Sequelize
  models: Models
}
