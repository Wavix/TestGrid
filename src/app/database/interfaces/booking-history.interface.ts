import type { UserInstance } from "@/app/database/interfaces/user.interface"
import type { Model, ModelStatic, NonAttribute, Optional } from "sequelize"

export interface BookingHistoryAttributes {
  id: number
  repository: string
  stand: string
  user_id: number
  namespace_id: number
  action: string
  created_at: Date
  user?: NonAttribute<UserInstance>
}

export interface BookingHistoryCreationAttributes extends Optional<BookingHistoryAttributes, "id" | "created_at"> {}

export interface BookingHistoryInstance
  extends Model<BookingHistoryAttributes, BookingHistoryCreationAttributes>,
    BookingHistoryAttributes {}

export interface BookingHistoryModel extends ModelStatic<BookingHistoryInstance> {}
