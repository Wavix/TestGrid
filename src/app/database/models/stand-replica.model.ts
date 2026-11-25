import type { StandReplicaInstance, StandReplicaModel } from "../interfaces/stand-replica.interface"
import type Sequelize from "sequelize"

export const StandReplica = (
  sequelize: Sequelize.Sequelize,
  DataTypes: typeof Sequelize.DataTypes
): StandReplicaModel => {
  const model: Sequelize.ModelStatic<StandReplicaInstance> = sequelize.define<StandReplicaInstance>(
    "stand_replicas",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      stand: {
        type: DataTypes.STRING,
        allowNull: false
      },
      kind: {
        type: DataTypes.STRING,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      replicas: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      createdAt: "created_at",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          fields: ["stand", "kind", "name"],
          name: "index_stand_replicas_on_stand_kind_name",
          unique: true
        }
      ]
    }
  )

  return model
}
