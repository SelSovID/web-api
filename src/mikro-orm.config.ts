import "dotenv/config"
import { Options } from "@mikro-orm/core"
import { PostgreSqlDriver } from "@mikro-orm/postgresql"
import { TsMorphMetadataProvider } from "@mikro-orm/reflection"
import logger from "./log.js"
import User from "./model/User.js"
import VCRequest from "./model/VCRequest.js"

const dbConnctionString = process.env.DB_CONNECTION

if (!dbConnctionString) {
  console.error("No database connection string provided, exiting")
  process.exit(3)
} else {
  console.log(`dbSting: ${dbConnctionString}`)
}

const config: Options<PostgreSqlDriver> = {
  metadataProvider: TsMorphMetadataProvider,
  clientUrl: dbConnctionString,
  entities: [User, VCRequest],
  type: "postgresql",
  migrations: {
    path: "build/migrations",
    pathTs: "src/migrations",
    disableForeignKeys: false,
  },
  seeder: {
    path: "./src/seeders", // path to the folder with seeders
    emit: "ts", // seeder generation mode
  },
  logger: msg => logger.trace({ mikroOrm: msg }, "micro-orm"),
}

export default config
