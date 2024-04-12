import type { Model, ModelStatic, Optional } from "sequelize"

export interface RepositoryAttributes {
  id: number
  name: string
  namespace_id: number
  created_at: Date
}

export interface RepositoryCreationAttributes extends Optional<RepositoryAttributes, "id" | "created_at"> {}

export interface RepositoryInstance
  extends Model<RepositoryAttributes, RepositoryCreationAttributes>,
    RepositoryAttributes {}

export interface RepositoryModel extends ModelStatic<RepositoryInstance> {}
