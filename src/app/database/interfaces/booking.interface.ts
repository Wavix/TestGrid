import type { RepositoryInstance } from "@/app/database/interfaces/repository.interface"
import type { StandInstance } from "@/app/database/interfaces/stand.interface"
import type { UserInstance } from "@/app/database/interfaces/user.interface"
import type { Model, ModelStatic, NonAttribute, Optional } from "sequelize"

export interface BookingAttributes {
  id: number
  user_id: number
  stand_id: number
  repository_id: number
  namespace_id: number
  branch_name: string
  created_at: Date
  user?: NonAttribute<UserInstance>
  repository_name?: NonAttribute<RepositoryInstance>
  stand_name?: NonAttribute<StandInstance>
}

export interface BookingCreationAttributes extends Optional<BookingAttributes, "id" | "created_at"> {}

export interface BookingInstance extends Model<BookingAttributes, BookingCreationAttributes>, BookingAttributes {}

export interface BookingModel extends ModelStatic<BookingInstance> {}
