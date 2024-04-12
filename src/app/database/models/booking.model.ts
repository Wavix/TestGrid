import type { Models } from "../interfaces"
import type { BookingInstance, BookingModel } from "../interfaces/booking.interface"
import type Sequelize from "sequelize"

export const Booking = (sequelize: Sequelize.Sequelize, DataTypes: typeof Sequelize.DataTypes): BookingModel => {
  const model: Sequelize.ModelStatic<BookingInstance> = sequelize.define<BookingInstance>(
    "bookings",
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
      stand_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      repository_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      namespace_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      branch_name: {
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
          name: "index_booking_on_namespace_id",
          using: "BTREE"
        },
        {
          fields: ["user_id", "stand_id", "repository_id", "namespace_id"],
          name: "index_booking_on_user_id_stand_id_repository_id_namespace_id",
          using: "BTREE"
        },
        {
          fields: ["stand_id", "repository_id", "namespace_id"],
          name: "index_booking_on_stand_id_repository_id_namespace_id",
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

    model.belongsTo(models.Stand, {
      foreignKey: "stand_id",
      as: "stand",
      onDelete: "CASCADE"
    })

    model.belongsTo(models.Repository, {
      foreignKey: "repository_id",
      as: "repository",
      onDelete: "CASCADE"
    })
  }

  return model
}
