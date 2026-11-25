import type { Model, ModelStatic, Optional } from "sequelize"

export interface NamespaceAttributes {
  id: number
  name: string
  booking_free_branches: string
  created_at: Date
}

export interface NamespaceCreationAttributes extends Optional<
  NamespaceAttributes,
  "id" | "booking_free_branches" | "created_at"
> {}

export interface NamespaceInstance
  extends Model<NamespaceAttributes, NamespaceCreationAttributes>, NamespaceAttributes {}

export interface NamespaceModel extends ModelStatic<NamespaceInstance> {}
