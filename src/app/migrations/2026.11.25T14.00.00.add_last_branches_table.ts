import { DataTypes } from "sequelize"

import type { Migration } from "../database/migrate"

const TABLE = "last_branches"
const UNIQUE_INDEX = "index_last_branches_on_stand_repository"

export const up: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface()

  await queryInterface.createTable(TABLE, {
    id: {
      primaryKey: true,
      autoIncrement: true,
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
    branch_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  })

  await queryInterface.addIndex(TABLE, ["stand_id", "repository_id"], { name: UNIQUE_INDEX, unique: true })
}

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.getQueryInterface().dropTable(TABLE)
}
