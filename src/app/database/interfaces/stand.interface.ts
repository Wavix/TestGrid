import type { Model, ModelStatic, Optional } from "sequelize"

export interface StandAttributes {
  id: number
  name: string
  namespace_id: number
  created_at: Date
  is_smoke_test: boolean
}

export interface StandCreationAttributes extends Optional<StandAttributes, "id" | "created_at" | "is_smoke_test"> {}

export interface StandInstance extends Model<StandAttributes, StandCreationAttributes>, StandAttributes {}

export interface StandModel extends ModelStatic<StandInstance> {}
