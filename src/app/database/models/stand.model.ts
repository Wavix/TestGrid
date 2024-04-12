import type { StandInstance, StandModel } from "../interfaces/stand.interface"
import type { Models } from "@/app/database/interfaces"
import type Sequelize from "sequelize"

export const Stand = (sequelize: Sequelize.Sequelize, DataTypes: typeof Sequelize.DataTypes): StandModel => {
  const model: Sequelize.ModelStatic<StandInstance> = sequelize.define<StandInstance>(
    "stands",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      namespace_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      is_smoke_test: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      }
    },
    {
      createdAt: "created_at",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          fields: ["name"],
          name: "index_stand_on_name",
          using: "BTREE"
        },
        {
          fields: ["name", "namespace_id"],
          name: "index_stand_on_name_namespace_id",
          using: "BTREE"
        },
        {
          fields: ["is_smoke_test"],
          name: "index_stand_on_is_smoke_test",
          using: "BTREE"
        }
      ]
    }
  )

  model.associate = (models: Models) => {
    model.belongsTo(models.Namespace, {
      foreignKey: "namespace_id",
      as: "namespace",
      onDelete: "CASCADE"
    })
  }

  return model
}
