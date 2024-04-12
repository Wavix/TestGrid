import type { Models } from "../interfaces"
import type { NotificationInstance, NotificationModel } from "@/app/database/interfaces/notification.interface"
import type Sequelize from "sequelize"

export const Notification = (
  sequelize: Sequelize.Sequelize,
  DataTypes: typeof Sequelize.DataTypes
): NotificationModel => {
  const model: Sequelize.ModelStatic<NotificationInstance> = sequelize.define<NotificationInstance>(
    "notifications",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      message: {
        type: DataTypes.STRING,
        allowNull: false
      },
      is_viewed: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      },
      user_id: {
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
          fields: ["user_id"],
          name: "index_notification_on_user_id",
          using: "BTREE"
        },
        {
          fields: ["is_viewed"],
          name: "index_notification_on_is_viewed",
          using: "BTREE"
        },
        {
          fields: ["created_at"],
          name: "index_notification_on_created_at",
          using: "BTREE"
        }
      ]
    }
  )

  model.associate = (models: Models) => {
    model.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE"
    })
  }

  return model
}
