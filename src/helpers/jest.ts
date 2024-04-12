import { DB } from "@/app/database"

export const destroy = async () => {
  await DB.sequelize.close()
}
