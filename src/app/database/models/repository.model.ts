import type { RepositoryInstance, RepositoryModel } from "../interfaces/repository.interface"
import type { Models } from "@/app/database/interfaces"
import type Sequelize from "sequelize"

export const Repository = (sequelize: Sequelize.Sequelize, DataTypes: typeof Sequelize.DataTypes): RepositoryModel => {
  const model: Sequelize.ModelStatic<RepositoryInstance> = sequelize.define<RepositoryInstance>(
    "repositories",
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
      }
    },
    {
      createdAt: "created_at",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          fields: ["name"],
          name: "index_repository_on_name",
          using: "BTREE"
        },
        {
          fields: ["name", "namespace_id"],
          name: "index_repository_on_name_namespace_id",
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
