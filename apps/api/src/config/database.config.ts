// apps/api/src/config/database.config.ts
import { registerAs } from "@nestjs/config";

export default registerAs("database", () => {
  const config = {
    type: "postgres" as const,
    host: process.env.DB_HOST ?? "localhost",
    port: parseInt(process.env.DB_PORT ?? "5432", 10),
    username: process.env.DB_USERNAME ?? "postgres",
    password: process.env.DB_PASSWORD ?? "postgres",
    database: process.env.DB_NAME ?? "erp_topsteel",
    ssl: process.env.DB_SSL === "true",
    synchronize:
      process.env.NODE_ENV === "development" && process.env.USE_SYNC === "true",
    logging: process.env.DB_LOGGING === "true",
  };

  return config;
});
