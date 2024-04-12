import type { Model, ModelStatic, Optional } from "sequelize"

export interface NotificationAttributes {
  id: number
  message: string
  is_viewed: boolean
  user_id: number
  created_at: Date
}

export interface NotificationCreationAttributes extends Optional<NotificationAttributes, "id" | "created_at"> {}

export interface NotificationInstance
  extends Model<NotificationAttributes, NotificationCreationAttributes>,
    NotificationAttributes {}

export interface NotificationModel extends ModelStatic<NotificationInstance> {}
