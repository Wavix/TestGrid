import type { StandKind, StandSource } from "@/interfaces/stand.interface"
import type { Model, ModelStatic, Optional } from "sequelize"

export interface StandAttributes {
  id: number
  name: string
  namespace_id: number
  created_at: Date
  is_smoke_test: boolean
  source: StandSource
  kind: StandKind
  owner: string | null
}

export interface StandCreationAttributes extends Optional<
  StandAttributes,
  "id" | "created_at" | "is_smoke_test" | "source" | "kind" | "owner"
> {}

export interface StandInstance extends Model<StandAttributes, StandCreationAttributes>, StandAttributes {}

export interface StandModel extends ModelStatic<StandInstance> {}
