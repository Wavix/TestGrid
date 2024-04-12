const nextJest = require("next/jest")

/** @type {import('jest').Config} */
const createJestConfig = nextJest({
  dir: "."
})

const config = {
  coverageProvider: "v8",
  globalSetup: "./jest.before.ts",
  testEnvironment: "node"
}

module.exports = createJestConfig(config)
