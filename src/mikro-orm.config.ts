import "dotenv/config"
import { Options } from "@mikro-orm/core"
import { PostgreSqlDriver } from "@mikro-orm/postgresql"
import { TsMorphMetadataProvider } from "@mikro-orm/reflection"
import logger from "./log"

const dbConnctionString = process.env.DB_CONNECTION

if (!dbConnctionString) {
  console.error("No database connection string provided, exiting")
  process.exit(3)
}

const config: Options<PostgreSqlDriver> = {
  metadataProvider: TsMorphMetadataProvider,
  clientUrl: dbConnctionString,
  entities: ["./build/model"],
  entitiesTs: ["./src/model"],
  type: "postgresql",
  migrations: {
    path: "build/migrations",
    pathTs: "src/migrations",
    disableForeignKeys: false,
  },
  logger: msg => logger.trace({ mikroOrm: msg }, "micro-orm"),
}

export default config
