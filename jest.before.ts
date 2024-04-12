import { DB } from "@/app/database"

const before = async () => {
  await DB.sequelize.getQueryInterface().dropAllTables()

  await DB.sequelize.sync({ force: true })
}

export default before
