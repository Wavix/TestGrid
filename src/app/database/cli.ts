/* eslint-disable no-console */
import { dbCreate } from "./connect"

enum Command {
  CreateDatabase = "dbcreate"
}

const main = async (args: Array<string>) => {
  const command = args[0]

  switch (command) {
    case Command.CreateDatabase:
      await dbCreate()
      break

    default:
      console.log("Unknown command")
  }
}

main(process.argv.slice(2))
