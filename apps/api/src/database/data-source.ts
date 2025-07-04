// apps/api/src/database/data-source.ts
import { ConfigService } from "@nestjs/config";
import { config } from "dotenv";
import type { DataSourceOptions } from "typeorm";
import { DataSource } from "typeorm";

config();

const configService = new ConfigService();
const isDevelopment = configService.get("NODE_ENV") === "development";

export const dataSourceOptions: DataSourceOptions = {
  type: "postgres",
  host: configService.get("DB_HOST", "localhost"),
  port: configService.get("DB_PORT", 5432),
  username: configService.get("DB_USERNAME", "postgres"),
  password: configService.get("DB_PASSWORD", "postgres"),
  database: configService.get("DB_NAME", "erp_topsteel"),
  entities: [__dirname + "/../**/*.entity{.ts,.js}"],
  synchronize:
    isDevelopment && configService.get("USE_SYNC", "false") === "true",
  migrations: isDevelopment ? [] : [__dirname + "/migrations/*{.ts,.js}"],
  logging: configService.get("NODE_ENV") === "development",
  ssl:
    configService.get("DB_SSL") === "true"
      ? {
          rejectUnauthorized: false,
        }
      : false,
};

export default new DataSource(dataSourceOptions);
