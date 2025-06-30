import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD ?? '',
  db: parseInt(process.env.REDIS_DB ?? '0', 10) ,
  ttl: parseInt(process.env.REDIS_TTL ?? '3600', 10) ,
  max: parseInt(process.env.REDIS_MAX ?? '100', 10) ,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
}));