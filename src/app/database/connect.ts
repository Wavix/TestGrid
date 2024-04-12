/* eslint-disable no-console */
import { DataTypes, Sequelize } from "sequelize"

import * as Models from "./models"

import type { Db } from "./interfaces"

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "database.sqlite",
  logging: false
})

const DB: Db = {
  sequelize,
  connected: false,
  models: {
    User: Models.User(sequelize, DataTypes),
    Repository: Models.Repository(sequelize, DataTypes),
    Stand: Models.Stand(sequelize, DataTypes),
    Booking: Models.Booking(sequelize, DataTypes),
    Namespace: Models.Namespace(sequelize, DataTypes),
    BookingHistory: Models.BookingHistory(sequelize, DataTypes),
    Notification: Models.Notification(sequelize, DataTypes)
  }
}

Object.keys(DB.models).forEach(item => {
  // @ts-ignore
  if (DB.models[item].associate) {
    // @ts-ignore
    DB.models[item].associate(DB.models)
  }
})

export const dbConnect = async () => {
  try {
    await DB.sequelize.sync({ alter: { drop: false } })
    console.log("Database connected")
  } catch (err) {
    console.log("ERROR", err)
  }
  DB.connected = true
}

export const dbCreate = async () => {
  await DB.sequelize.sync({ force: true })
  console.log("Database created")
}

export { DB }
