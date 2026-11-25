import type { Model, ModelStatic, Optional } from "sequelize"

export interface LastBranchAttributes {
  id: number
  stand_id: number
  repository_id: number
  branch_name: string
  updated_at: Date
}

export interface LastBranchCreationAttributes extends Optional<LastBranchAttributes, "id" | "updated_at"> {}

export interface LastBranchInstance
  extends Model<LastBranchAttributes, LastBranchCreationAttributes>, LastBranchAttributes {}

export interface LastBranchModel extends ModelStatic<LastBranchInstance> {}
