import { DataTypes } from "sequelize"

import type { Migration } from "../database/migrate"

const TABLE = "stand_replicas"
const UNIQUE_INDEX = "index_stand_replicas_on_stand_kind_name"

export const up: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface()

  await queryInterface.createTable(TABLE, {
    id: {
      primaryKey: true,
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false
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
      allowNull: false
    }
  })

  await queryInterface.addIndex(TABLE, ["stand", "kind", "name"], { name: UNIQUE_INDEX, unique: true })
}

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.getQueryInterface().dropTable(TABLE)
}
