import { registerAs } from "@nestjs/config";

export default registerAs("app", () => ({
  env: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "3001", 10),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? "60000", 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? "10", 10),
  },
}));
