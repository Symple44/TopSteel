// apps/api/src/config/app.config.ts
export default () => ({
  app: {
    name: process.env.APP_NAME || "ERP TOPSTEEL API",
    env: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT, 10) || 3001,
    corsOrigins: process.env.CORS_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
  },
});
