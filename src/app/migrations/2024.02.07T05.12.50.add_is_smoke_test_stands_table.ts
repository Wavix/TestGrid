import type { Migration } from "../database/migrate"

export const up: Migration = async ({ context: sequelize }) => {
  const query = `
ALTER TABLE stands
ADD COLUMN is_smoke_test BOOLEAN DEFAULT FALSE;
`

  await sequelize.getQueryInterface().sequelize.query(query)
}

export const down: Migration = async ({ context: sequelize }) => {
  const query = `
ALTER TABLE stands
DROP COLUMN is_smoke_test;
`

  await sequelize.getQueryInterface().sequelize.query(query)
}
