import { registerAs } from '@nestjs/config'

export const appConfig = registerAs('app', () => ({
  name: process.env.APP_NAME || 'TopSteel Marketplace API',
  port: parseInt(process.env.PORT) || 3006,
  environment: process.env.NODE_ENV || 'development',

  // Pagination
  defaultItemsPerPage: parseInt(process.env.DEFAULT_ITEMS_PER_PAGE) || 20,
  maxItemsPerPage: parseInt(process.env.MAX_ITEMS_PER_PAGE) || 100,

  // Cache
  cacheTtl: parseInt(process.env.CACHE_TTL) || 300,

  // Upload
  maxFileSize: process.env.MAX_FILE_SIZE || '10MB',
  uploadPath: process.env.UPLOAD_PATH || './uploads',

  // CORS
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3007'],
}))
