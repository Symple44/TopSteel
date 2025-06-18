// apps/api/src/config/app.config.ts
export default () => ({
    app: {
      name: process.env.APP_NAME || "ERP TOPSTEEL API",
      version: process.env.APP_VERSION || "1.0.0",
      env: process.env.NODE_ENV || "development",
      port: parseInt(process.env.PORT, 10) || 3001,
      url: process.env.APP_URL || "http://localhost:3001",
      
      // CORS Configuration
      cors: {
        origin: process.env.CORS_ORIGIN 
          ? process.env.CORS_ORIGIN.split(",")
          : ["http://localhost:3000", "http://localhost:3001"],
        credentials: process.env.CORS_CREDENTIALS === "true",
      },
  
      // Rate limiting
      throttle: {
        ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60000, // 60 secondes
        limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100, // 100 requêtes par minute
      },
  
      // File uploads
      upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: process.env.ALLOWED_MIME_TYPES?.split(",") || [
          "image/jpeg",
          "image/png",
          "image/gif",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
      },
  
      // Pagination
      pagination: {
        defaultLimit: parseInt(process.env.DEFAULT_PAGINATION_LIMIT, 10) || 20,
        maxLimit: parseInt(process.env.MAX_PAGINATION_LIMIT, 10) || 100,
      },
  
      // Logging
      logging: {
        level: process.env.LOG_LEVEL || "info",
        file: process.env.LOG_FILE === "true",
      },
    },
  });