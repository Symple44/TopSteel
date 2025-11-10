import { Injectable, Logger, type NestMiddleware } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { NextFunction, Request, Response } from 'express'
import { CSPNonceService } from './csp-nonce.service'

export interface CSPConfig {
  enabled: boolean
  reportUri?: string
  reportOnly?: boolean
  directives: {
    defaultSrc: string[]
    scriptSrc: string[]
    styleSrc: string[]
    imgSrc: string[]
    connectSrc: string[]
    fontSrc: string[]
    objectSrc: string[]
    mediaSrc: string[]
    frameSrc: string[]
    frameAncestors: string[]
    baseUri: string[]
    formAction: string[]
  }
}

@Injectable()
export class EnhancedCSPMiddleware implements NestMiddleware {
  private readonly logger = new Logger(EnhancedCSPMiddleware.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly nonceService: CSPNonceService
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const env = this.configService.get<string>('NODE_ENV', 'development')
    const isDevelopment = env === 'development'

    // Generate nonce for this request
    const requestId = req.headers['x-request-id'] as string
    const nonce = this.nonceService.generateNonce(requestId)

    // Store nonce in request for use in templates/responses
    req.cspNonce = nonce

    // Add nonce to response headers for client access
    res.setHeader('X-CSP-Nonce', nonce)

    const cspConfig = this.getCSPConfig(isDevelopment, nonce)

    if (cspConfig.enabled) {
      const cspHeaderValue = this.buildCSPHeader(cspConfig)
      const headerName = cspConfig.reportOnly
        ? 'Content-Security-Policy-Report-Only'
        : 'Content-Security-Policy'

      res.setHeader(headerName, cspHeaderValue)

      if (isDevelopment) {
        this.logger.debug(`CSP Header set: ${cspHeaderValue.substring(0, 100)}...`)
      }
    }

    // Add additional security headers
    this.addSecurityHeaders(res, isDevelopment)

    next()
  }

  private getCSPConfig(isDevelopment: boolean, nonce: string): CSPConfig {
    const baseConfig: CSPConfig = {
      enabled: true,
      reportOnly: isDevelopment, // Report-only in development, enforce in production
      reportUri: '/api/security/csp-violations',
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: isDevelopment
          ? [
              "'self'",
              `'nonce-${nonce}'`,
              "'strict-dynamic'",
              'https://cdn.jsdelivr.net',
              'https://unpkg.com',
            ]
          : ["'self'", `'nonce-${nonce}'`],
        styleSrc: isDevelopment
          ? [
              "'self'",
              `'nonce-${nonce}'`,
              'https://fonts.googleapis.com',
              'https://cdn.jsdelivr.net',
            ]
          : ["'self'", `'nonce-${nonce}'`],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: [
          "'self'",
          this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000'),
          this.configService.get<string>('API_URL', 'http://localhost:3002'),
          'https://api.topsteel.fr',
          'wss://api.topsteel.fr',
          ...(isDevelopment ? ['ws://localhost:*', 'http://localhost:*'] : []),
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    }

    // Override from configuration if available
    const configOverride = this.configService.get<Partial<CSPConfig>>('security.csp')
    if (configOverride) {
      return { ...baseConfig, ...configOverride }
    }

    return baseConfig
  }

  private buildCSPHeader(config: CSPConfig): string {
    const directives: string[] = []

    for (const [key, values] of Object.entries(config.directives)) {
      if (values && values.length > 0) {
        const kebabCaseKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
        directives.push(`${kebabCaseKey} ${values.join(' ')}`)
      }
    }

    // Add report-uri if configured
    if (config.reportUri) {
      directives.push(`report-uri ${config.reportUri}`)
    }

    // Add upgrade-insecure-requests for production
    if (process.env.NODE_ENV === 'production') {
      directives.push('upgrade-insecure-requests')
    }

    return directives.join('; ')
  }

  private addSecurityHeaders(res: Response, isDevelopment: boolean): void {
    // X-Frame-Options
    res.setHeader('X-Frame-Options', 'DENY')

    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff')

    // X-XSS-Protection (legacy support)
    res.setHeader('X-XSS-Protection', '1; mode=block')

    // Referrer-Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

    // HSTS (production only)
    if (!isDevelopment) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    }

    // Permissions Policy
    const permissionsPolicy = [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'speaker=()',
    ].join(', ')
    res.setHeader('Permissions-Policy', permissionsPolicy)

    // Cross-Origin Policies
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')

    // Remove powered by header
    res.removeHeader('X-Powered-By')
  }
}

// Extend Request interface to include nonce
declare global {
  namespace Express {
    interface Request {
      cspNonce?: string
    }
  }
}
