import type { NamespaceInstance, NamespaceModel } from "../interfaces/namespace.interface"
import type Sequelize from "sequelize"

export const Namespace = (sequelize: Sequelize.Sequelize, DataTypes: typeof Sequelize.DataTypes): NamespaceModel => {
  return sequelize.define<NamespaceInstance>(
    "namespaces",
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
          name: "index_namespace_on_name",
          using: "BTREE"
        }
      ]
    }
  )
}
