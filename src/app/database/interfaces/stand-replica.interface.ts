import type { WorkloadKind } from "@/interfaces/stand-control.interface"
import type { Model, ModelStatic, Optional } from "sequelize"

export interface StandReplicaAttributes {
  id: number
  stand: string
  kind: WorkloadKind
  name: string
  replicas: number
  created_at: Date
}

export interface StandReplicaCreationAttributes extends Optional<StandReplicaAttributes, "id" | "created_at"> {}

export interface StandReplicaInstance
  extends Model<StandReplicaAttributes, StandReplicaCreationAttributes>, StandReplicaAttributes {}

export interface StandReplicaModel extends ModelStatic<StandReplicaInstance> {}
