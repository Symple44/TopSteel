export interface EmailProvider {
  initialize(config: EmailConfiguration): Promise<void>
  sendEmail(options: EmailOptions): Promise<EmailResult>
  sendBulkEmails(options: BulkEmailOptions): Promise<BulkEmailResult>
  validateConnection(): Promise<boolean>
  getProviderName(): string
  refreshToken?(): Promise<void>
}

export interface EmailOptions {
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  html?: string
  text?: string
  attachments?: EmailAttachment[]
  replyTo?: string
  headers?: Record<string, string>
  tags?: string[]
  metadata?: Record<string, any>
}

export interface BulkEmailOptions {
  emails: EmailOptions[]
  batchSize?: number
  delayBetweenBatches?: number
}

export interface EmailAttachment {
  filename: string
  content?: Buffer | string
  path?: string
  contentType?: string
  encoding?: string
  cid?: string // Content-ID pour les images inline
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  provider: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface BulkEmailResult {
  totalSent: number
  totalFailed: number
  results: EmailResult[]
  duration: number
}

export interface EmailConfiguration {
  provider: 'google' | 'microsoft' | 'smtp'
  enabled: boolean
  defaultFrom: string
  defaultFromName?: string
  
  // OAuth2 Configuration
  oauth2?: {
    clientId: string
    clientSecret: string
    refreshToken?: string
    accessToken?: string
    tokenExpiry?: Date
    redirectUri?: string
    scope?: string[]
  }
  
  // SMTP Configuration
  smtp?: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
    tls?: {
      rejectUnauthorized?: boolean
      minVersion?: string
    }
  }
  
  // Rate Limiting
  rateLimit?: {
    maxPerMinute?: number
    maxPerHour?: number
    maxPerDay?: number
  }
  
  // Retry Configuration
  retry?: {
    maxAttempts?: number
    backoffMultiplier?: number
    initialDelay?: number
  }
}

export interface EmailProviderFactory {
  createProvider(config: EmailConfiguration): EmailProvider
}