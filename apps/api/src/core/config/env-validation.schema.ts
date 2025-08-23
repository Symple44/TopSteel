import { z } from 'zod'

/**
 * Environment variables validation schema
 * Provides runtime validation for all required environment variables
 */

// Helper schemas for common patterns
const stringNonEmpty = z.string().min(1, 'Cannot be empty')
const portSchema = z.coerce.number().int().min(1).max(65535)
const booleanSchema = z.string().transform(val => val === 'true').pipe(z.boolean())
const urlSchema = z.string().url()

// JWT Secret validation - must be at least 32 characters for security
const jwtSecretSchema = z.string().min(32, 'JWT secret must be at least 32 characters for security')

// Database URL validation
const databaseUrlSchema = z.string().regex(
  /^postgresql:\/\/[\w\-\.]+:[\w\-\.]*@[\w\-\.]+:\d+\/[\w\-\.]+(\?.*)?$/,
  'Invalid PostgreSQL connection string format'
)

// Email validation for SMTP
const emailSchema = z.string().email()

// Environment-specific schemas
const nodeEnvSchema = z.enum(['development', 'production', 'test', 'staging'])

// Log level validation
const logLevelSchema = z.enum(['error', 'warn', 'info', 'debug', 'verbose'])

// SMS Provider validation
const smsProviderSchema = z.enum(['twilio', 'vonage', 'aws']).optional()

export const envValidationSchema = z.object({
  // Core Application
  NODE_ENV: nodeEnvSchema.default('development'),
  PORT: portSchema.default(3002),
  HOST: stringNonEmpty.default('127.0.0.1'),
  API_PREFIX: stringNonEmpty.default('/api/v1'),

  // Database - Required
  DATABASE_URL: databaseUrlSchema,
  DATABASE_POOL_MIN: z.coerce.number().int().min(1).default(2),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).default(10),

  // Security - Required in production
  JWT_SECRET: z.string().refine(
    (val) => {
      if (process.env.NODE_ENV === 'production') {
        return val && val.length >= 32
      }
      return true // Allow any value in development
    },
    {
      message: 'JWT_SECRET must be set and at least 32 characters in production'
    }
  ),
  JWT_REFRESH_SECRET: z.string().refine(
    (val) => {
      if (process.env.NODE_ENV === 'production') {
        return val && val.length >= 32
      }
      return true
    },
    {
      message: 'JWT_REFRESH_SECRET must be set and at least 32 characters in production'
    }
  ),
  JWT_EXPIRES_IN: stringNonEmpty.default('7d'),
  JWT_REFRESH_EXPIRES_IN: stringNonEmpty.default('30d'),
  JWT_ISSUER: stringNonEmpty.default('topsteel-erp'),
  JWT_AUDIENCE: stringNonEmpty.default('topsteel-users'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(10),

  // Session Security
  SESSION_SECRET: z.string().refine(
    (val) => {
      if (process.env.NODE_ENV === 'production') {
        return val && val.length >= 32
      }
      return true
    },
    {
      message: 'SESSION_SECRET must be set and at least 32 characters in production'
    }
  ),
  SESSION_MAX_AGE: z.coerce.number().int().default(86400000),

  // Redis - Optional
  REDIS_URL: z.string().optional(),
  REDIS_HOST: stringNonEmpty.default('127.0.0.1'),
  REDIS_PORT: portSchema.default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().int().min(0).default(0),
  REDIS_TTL: z.coerce.number().int().default(3600),

  // CORS
  CORS_ORIGIN: stringNonEmpty.default('http://localhost:3000,http://localhost:3001'),
  CORS_CREDENTIALS: booleanSchema.default('true'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().default(100),

  // SMS Configuration - Conditional validation based on provider
  SMS_PROVIDER: smsProviderSchema,
  SMS_LOG_ENABLED: booleanSchema.default('true'),
  SMS_DRY_RUN: booleanSchema.default('false'),
  SMS_RATE_LIMIT_PER_HOUR: z.coerce.number().int().default(100),
  SMS_RATE_LIMIT_PER_DAY: z.coerce.number().int().default(1000),

  // Twilio (required if SMS_PROVIDER is twilio)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  TWILIO_MESSAGING_SERVICE_SID: z.string().optional(),

  // Vonage (required if SMS_PROVIDER is vonage)
  VONAGE_API_KEY: z.string().optional(),
  VONAGE_API_SECRET: z.string().optional(),
  VONAGE_FROM_NUMBER: z.string().optional(),
  VONAGE_BRAND_NAME: z.string().optional(),

  // AWS SNS (required if SMS_PROVIDER is aws)
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_SNS_SENDER_ID: z.string().optional(),
  AWS_SNS_MAX_PRICE: z.coerce.number().optional(),

  // Email Configuration
  SMTP_HOST: stringNonEmpty.optional(),
  SMTP_PORT: portSchema.optional(),
  SMTP_SECURE: booleanSchema.default('false'),
  SMTP_USER: emailSchema.optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // File Upload
  UPLOAD_DIR: stringNonEmpty.default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().int().default(10485760),
  ALLOWED_FILE_TYPES: z.string().default('image/jpeg,image/png,image/gif,application/pdf'),

  // ElasticSearch - Optional
  ELASTICSEARCH_NODE: z.string().optional(),
  ELASTICSEARCH_USERNAME: z.string().optional(),
  ELASTICSEARCH_PASSWORD: z.string().optional(),
  ELASTICSEARCH_INDEX_PREFIX: stringNonEmpty.default('topsteel_'),

  // External Services - Optional but validated if provided
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: stringNonEmpty.default('gpt-4'),

  // Monitoring - Optional
  SENTRY_DSN: urlSchema.optional(),
  SENTRY_ENABLED: booleanSchema.default('false'),
  SENTRY_ENVIRONMENT: stringNonEmpty.optional(),
  SENTRY_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(1.0),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),
  SENTRY_PROFILES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),
  SENTRY_DEBUG: booleanSchema.default('false'),
  SENTRY_ATTACH_STACKTRACE: booleanSchema.default('true'),

  // DataDog
  DATADOG_API_KEY: z.string().optional(),
  DATADOG_APP_KEY: z.string().optional(),
  DATADOG_SITE: stringNonEmpty.default('datadoghq.eu'),
  DATADOG_ENV: stringNonEmpty.optional(),
  DATADOG_SERVICE: stringNonEmpty.default('topsteel-erp'),

  // New Relic
  NEW_RELIC_LICENSE_KEY: z.string().optional(),
  NEW_RELIC_APP_NAME: stringNonEmpty.default('TopSteel ERP'),

  // Feature Flags
  FEATURE_SMS_ENABLED: booleanSchema.default('true'),
  FEATURE_EMAIL_ENABLED: booleanSchema.default('true'),
  FEATURE_ELASTICSEARCH_ENABLED: booleanSchema.default('false'),
  FEATURE_REDIS_CACHE_ENABLED: booleanSchema.default('true'),
  FEATURE_MONITORING_ENABLED: booleanSchema.default('false'),
  FEATURE_AI_ASSISTANT_ENABLED: booleanSchema.default('false'),

  // Development Tools
  DEBUG: booleanSchema.default('false'),
  LOG_LEVEL: logLevelSchema.default('info'),
  ENABLE_SWAGGER: booleanSchema.default('true'),
  ENABLE_GRAPHQL_PLAYGROUND: booleanSchema.default('true'),

  // Backup & Maintenance
  BACKUP_ENABLED: booleanSchema.default('false'),
  BACKUP_SCHEDULE: stringNonEmpty.default('0 2 * * *'),
  BACKUP_RETENTION_DAYS: z.coerce.number().int().default(30),
  MAINTENANCE_MODE: booleanSchema.default('false'),
  MAINTENANCE_MESSAGE: stringNonEmpty.default('System under maintenance. Please try again later.'),
})

// Custom validation for SMS provider dependencies
export const validateSmsProviderDependencies = (env: Record<string, any>) => {
  if (env.SMS_PROVIDER === 'twilio') {
    const requiredTwilioFields = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER']
    const missingFields = requiredTwilioFields.filter(field => !env[field])
    if (missingFields.length > 0) {
      throw new Error(`Twilio SMS provider requires: ${missingFields.join(', ')}`)
    }
  }

  if (env.SMS_PROVIDER === 'vonage') {
    const requiredVonageFields = ['VONAGE_API_KEY', 'VONAGE_API_SECRET']
    const missingFields = requiredVonageFields.filter(field => !env[field])
    if (missingFields.length > 0) {
      throw new Error(`Vonage SMS provider requires: ${missingFields.join(', ')}`)
    }
  }

  if (env.SMS_PROVIDER === 'aws') {
    const requiredAwsFields = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY']
    const missingFields = requiredAwsFields.filter(field => !env[field])
    if (missingFields.length > 0) {
      throw new Error(`AWS SNS SMS provider requires: ${missingFields.join(', ')}`)
    }
  }
}

export type ValidatedEnv = z.infer<typeof envValidationSchema>