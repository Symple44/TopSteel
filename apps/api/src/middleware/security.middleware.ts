// apps/api/src/middleware/security.middleware.ts
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { body, validationResult } from 'express-validator'

// Rate limiting par endpoint
export const rateLimiters = {
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 tentatives de connexion
    message: 'Trop de tentatives de connexion',
    standardHeaders: true,
    legacyHeaders: false,
  }),

  api: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requêtes par minute
    message: 'Limite de requêtes atteinte',
  }),

  upload: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 10, // 10 uploads par heure
    message: 'Limite d\'upload atteinte',
  }),
}

// Configuration helmet renforcée
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.API_URL],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
})