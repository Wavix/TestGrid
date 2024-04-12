import type { UserInstance, UserModel } from "../interfaces/user.interface"
import type { Models } from "@/app/database/interfaces"
import type Sequelize from "sequelize"

export const User = (sequelize: Sequelize.Sequelize, DataTypes: typeof Sequelize.DataTypes): UserModel => {
  const model: Sequelize.ModelStatic<UserInstance> = sequelize.define<UserInstance>(
    "users",
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
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      is_admin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
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
          fields: ["email"],
          name: "index_user_on_email",
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
