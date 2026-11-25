import type { Migration } from "../database/migrate"

export const up: Migration = async ({ context: sequelize }) => {
  await sequelize
    .getQueryInterface()
    .sequelize.query("ALTER TABLE namespaces ADD COLUMN booking_free_branches VARCHAR(255) NOT NULL DEFAULT '';")
}

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.getQueryInterface().sequelize.query("ALTER TABLE namespaces DROP COLUMN booking_free_branches;")
}
