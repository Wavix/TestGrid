import type { NamespaceInstance } from "@/app/database/interfaces/namespace.interface"
import type { Model, ModelStatic, NonAttribute, Optional } from "sequelize"

export interface UserAttributes {
  id: number
  name: string
  email: string
  password: string
  is_admin: boolean
  is_active: boolean
  namespace_id: number
  created_at: Date
  namespace?: NonAttribute<NamespaceInstance>
}

export interface UserCreationAttributes
  extends Optional<UserAttributes, "id" | "created_at" | "is_admin" | "is_active" | "namespace"> {}

export interface UserInstance extends Model<UserAttributes, UserCreationAttributes>, UserAttributes {}

export interface UserModel extends ModelStatic<UserInstance> {}
