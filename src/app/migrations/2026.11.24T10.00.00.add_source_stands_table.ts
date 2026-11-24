import type { Migration } from "../database/migrate"

export const up: Migration = async ({ context: sequelize }) => {
  const query = `
ALTER TABLE stands
ADD COLUMN source VARCHAR(255) NOT NULL DEFAULT 'manual';
`

  await sequelize.getQueryInterface().sequelize.query(query)
}

export const down: Migration = async ({ context: sequelize }) => {
  const query = `
ALTER TABLE stands
DROP COLUMN source;
`

  await sequelize.getQueryInterface().sequelize.query(query)
}
