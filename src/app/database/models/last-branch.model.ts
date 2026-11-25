import type { LastBranchInstance, LastBranchModel } from "../interfaces/last-branch.interface"
import type Sequelize from "sequelize"

export const LastBranch = (sequelize: Sequelize.Sequelize, DataTypes: typeof Sequelize.DataTypes): LastBranchModel =>
  sequelize.define<LastBranchInstance>(
    "last_branches",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
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
        defaultValue: DataTypes.NOW
      }
    },
    {
      timestamps: false,
      underscored: true,
      indexes: [
        {
          fields: ["stand_id", "repository_id"],
          name: "index_last_branches_on_stand_repository",
          unique: true
        }
      ]
    }
  )
