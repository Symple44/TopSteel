// apps/api/src/config/database.config.ts
export default () => ({
  database: {
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    name: process.env.DB_NAME || "erp_topsteel",
    ssl: process.env.DB_SSL === "true",
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS, 10) || 100,
  },
});
