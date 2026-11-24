import type { Migration } from "../database/migrate"

export const up: Migration = async ({ context: sequelize }) => {
  const queries = [
    "ALTER TABLE stands ADD COLUMN kind VARCHAR(255) NOT NULL DEFAULT 'permanent';",
    "ALTER TABLE stands ADD COLUMN owner VARCHAR(255);"
  ]

  for (const query of queries) {
    // eslint-disable-next-line no-await-in-loop
    await sequelize.getQueryInterface().sequelize.query(query)
  }
}

export const down: Migration = async ({ context: sequelize }) => {
  const queries = ["ALTER TABLE stands DROP COLUMN owner;", "ALTER TABLE stands DROP COLUMN kind;"]

  for (const query of queries) {
    // eslint-disable-next-line no-await-in-loop
    await sequelize.getQueryInterface().sequelize.query(query)
  }
}
