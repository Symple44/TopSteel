// apps/api/src/config/redis.config.ts
export default () => ({
    redis: {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB, 10) || 0,
      
      // Cache settings
      ttl: parseInt(process.env.REDIS_TTL, 10) || 3600, // 1 heure par défaut
      max: parseInt(process.env.REDIS_MAX_ITEMS, 10) || 1000, // Max 1000 items en cache
      
      // Bull Queue settings
      queue: {
        defaultJobOptions: {
          removeOnComplete: parseInt(process.env.REDIS_REMOVE_ON_COMPLETE, 10) || 10,
          removeOnFail: parseInt(process.env.REDIS_REMOVE_ON_FAIL, 10) || 5,
          attempts: parseInt(process.env.REDIS_JOB_ATTEMPTS, 10) || 3,
          backoff: {
            type: "exponential",
            delay: parseInt(process.env.REDIS_BACKOFF_DELAY, 10) || 2000,
          },
        },
      },
  
      // Connection options
      connectionOptions: {
        connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT, 10) || 10000,
        commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT, 10) || 5000,
        retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY, 10) || 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES, 10) || 3,
      },
    },
  });