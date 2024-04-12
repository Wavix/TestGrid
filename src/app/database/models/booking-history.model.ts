import type { Models } from "../interfaces"
import type { BookingHistoryInstance, BookingHistoryModel } from "../interfaces/booking-history.interface"
import type Sequelize from "sequelize"

export const BookingHistory = (
  sequelize: Sequelize.Sequelize,
  DataTypes: typeof Sequelize.DataTypes
): BookingHistoryModel => {
  const model: Sequelize.ModelStatic<BookingHistoryInstance> = sequelize.define<BookingHistoryInstance>(
    "booking_histories",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      stand: {
        type: DataTypes.STRING,
        allowNull: false
      },
      repository: {
        type: DataTypes.STRING,
        allowNull: false
      },
      namespace_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      action: {
        type: DataTypes.STRING,
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
          fields: ["namespace_id"],
          name: "index_booking_history_on_namespace_id",
          using: "BTREE"
        },
        {
          fields: ["created_at"],
          name: "index_booking_history_on_created_at",
          using: "BTREE"
        },
        {
          fields: ["action"],
          name: "index_booking_history_on_action",
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

    model.belongsTo(models.Namespace, {
      foreignKey: "namespace_id",
      as: "namespace",
      onDelete: "CASCADE"
    })
  }

  return model
}
