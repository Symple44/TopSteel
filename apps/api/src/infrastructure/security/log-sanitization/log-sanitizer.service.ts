/**
 * 🔒 SERVICE DE SANITISATION DES LOGS EN PRODUCTION
 *
 * Ce service nettoie automatiquement les données sensibles des logs
 * pour éviter l'exposition d'informations confidentielles.
 */
import { Injectable, Logger } from '@nestjs/common'

interface SanitizationRule {
  name: string
  pattern: RegExp
  replacement: string
  description: string
}

@Injectable()
export class LogSanitizerService {
  private readonly logger = new Logger(LogSanitizerService.name)

  private get isProduction(): boolean {
    return process.env.NODE_ENV === 'production'
  }

  private get enableSanitization(): boolean {
    return process.env.LOG_SANITIZATION_ENABLED !== 'false'
  }

  private get auditSanitization(): boolean {
    return process.env.LOG_SANITIZATION_AUDIT === 'true'
  }

  private readonly sensitiveDataRules: SanitizationRule[] = [
    // Mots de passe
    {
      name: 'password',
      pattern: /(["']?password["']?\s*[:=]\s*)(["'][^"']*["']|[^\s,}]+)/gi,
      replacement: '$1"[MASKED]"',
      description: 'Masque les mots de passe',
    },
    {
      name: 'pwd',
      pattern: /(["']?pwd["']?\s*[:=]\s*)(["'][^"']*["']|[^\s,}]+)/gi,
      replacement: '$1"[MASKED]"',
      description: 'Masque les mots de passe (pwd)',
    },
    // Tokens JWT
    {
      name: 'jwt_token',
      pattern: /eyJ[a-zA-Z0-9._-]{20,}/g,
      replacement: 'eyJ[JWT_TOKEN_MASKED]',
      description: 'Masque les tokens JWT',
    },
    // Authorization headers - Bearer tokens d'abord pour éviter les collisions
    {
      name: 'bearer_token',
      pattern: /(bearer\s+)([a-zA-Z0-9._-]{10,})/gi,
      replacement: '$1[TOKEN_MASKED]',
      description: 'Masque les tokens Bearer',
    },
    {
      name: 'authorization',
      pattern: /(["']authorization["']?\s*[:=]\s*)(["'][^"']*["']|[^\s,}]+)/gi,
      replacement: '$1"[MASKED]"',
      description: 'Masque les headers Authorization',
    },
    // Clés API
    {
      name: 'api_key',
      pattern: /(["']?(?:api[_-]?key|apikey)["']?\s*[:=]\s*)(["'][^"']*["']|[^\s,}]+)/gi,
      replacement: '$1"[MASKED]"',
      description: 'Masque les clés API',
    },
    // Secrets
    {
      name: 'secret',
      pattern: /(["']?(?:secret|client_secret)["']?\s*[:=]\s*)(["'][^"']*["']|[^\s,}]+)/gi,
      replacement: '$1"[MASKED]"',
      description: 'Masque les secrets',
    },
    // Numéros de carte de crédit
    {
      name: 'credit_card',
      pattern:
        /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
      replacement: '[CARD_NUMBER_MASKED]',
      description: 'Masque les numéros de carte de crédit',
    },
    // CVV
    {
      name: 'cvv',
      pattern: /(["']?(?:cvv|cvc|security_code)["']?\s*[:=]\s*)(["'][^"']*["']|[^\s,}]+)/gi,
      replacement: '$1"[MASKED]"',
      description: 'Masque les codes CVV',
    },
    // Emails (masquage partiel)
    {
      name: 'email_partial',
      pattern: /\b([a-zA-Z0-9._%+-]{1,3})[a-zA-Z0-9._%+-]*@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g,
      replacement: '$1***@$2',
      description: 'Masque partiellement les emails',
    },
    // Numéros de téléphone (format international et français)
    {
      name: 'phone',
      pattern: /\b(?:\+\d{1,3}\d{8,14}|\d{10,14}|0[1-9]\d{8})\b/g,
      replacement: '[PHONE_MASKED]',
      description: 'Masque les numéros de téléphone',
    },
    // Adresses IP (masquage partiel)
    {
      name: 'ip_address',
      pattern: /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.)\d{1,3}\b/g,
      replacement: '$1***',
      description: 'Masque partiellement les adresses IP',
    },
    // URLs avec query parameters sensibles
    {
      name: 'sensitive_url_params',
      pattern: /(\?|&)(token|key|password|secret|auth)=([^&\s]+)/gi,
      replacement: '$1$2=[MASKED]',
      description: 'Masque les paramètres sensibles dans les URLs',
    },
    // Session IDs
    {
      name: 'session_id',
      pattern: /(["']?(?:session[_-]?id|sessionid)["']?\s*[:=]\s*)(["'][^"']*["']|[^\s,}]+)/gi,
      replacement: '$1"[MASKED]"',
      description: 'Masque les IDs de session',
    },
    // Clés privées
    {
      name: 'private_key',
      pattern: /-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA )?PRIVATE KEY-----/g,
      replacement: '[PRIVATE_KEY_MASKED]',
      description: 'Masque les clés privées',
    },
    // Certificats
    {
      name: 'certificate',
      pattern: /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g,
      replacement: '[CERTIFICATE_MASKED]',
      description: 'Masque les certificats',
    },
  ]

  /**
   * Sanitise un message de log en masquant les données sensibles
   */
  sanitizeLogMessage(message: string): string {
    if (!this.enableSanitization || !this.isProduction) {
      return message
    }

    let sanitizedMessage = message
    const appliedRules: string[] = []

    for (const rule of this.sensitiveDataRules) {
      const originalMessage = sanitizedMessage
      sanitizedMessage = sanitizedMessage.replace(rule.pattern, rule.replacement)

      if (originalMessage !== sanitizedMessage) {
        appliedRules.push(rule.name)
      }
    }

    // Audit de la sanitisation si activé
    if (this.auditSanitization && appliedRules.length > 0) {
      this.logger.debug(`Log sanitized - Rules applied: ${appliedRules.join(', ')}`, {
        type: 'log_sanitization_audit',
        rulesApplied: appliedRules,
        originalLength: message.length,
        sanitizedLength: sanitizedMessage.length,
      })
    }

    return sanitizedMessage
  }

  /**
   * Sanitise un objet de log en profondeur
   */
  sanitizeLogObject(obj: unknown): any {
    if (!this.enableSanitization || !this.isProduction) {
      return obj
    }

    if (typeof obj === 'string') {
      return this.sanitizeLogMessage(obj)
    }

    if (typeof obj !== 'object' || obj === null) {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeLogObject(item))
    }

    const sanitizedObj = { ...obj }

    for (const [key, value] of Object.entries(sanitizedObj)) {
      // Masquer complètement certaines clés sensibles
      if (this.isSensitiveKey(key)) {
        sanitizedObj[key] = '[MASKED]'
      } else if (typeof value === 'string') {
        sanitizedObj[key] = this.sanitizeLogMessage(value)
      } else if (typeof value === 'object') {
        sanitizedObj[key] = this.sanitizeLogObject(value)
      }
    }

    return sanitizedObj
  }

  /**
   * Vérifie si une clé est considérée comme sensible
   */
  private isSensitiveKey(key: string): boolean {
    const exactSensitiveKeys = [
      'password',
      'pwd',
      'secret',
      'token',
      'key',
      'authorization',
      'auth',
      'bearer',
      'jwt',
      'apikey',
      'api_key',
      'session_id',
      'sessionid',
      'cvv',
      'cvc',
      'security_code',
      'private_key',
      'client_secret',
      'refresh_token',
      'access_token',
    ]

    const keyLower = key.toLowerCase()

    // Vérification exacte d'abord
    if (exactSensitiveKeys.includes(keyLower)) {
      return true
    }

    // Vérification par inclusion seulement pour certains patterns spécifiques
    const inclusionPatterns = [
      '_password',
      '_pwd',
      '_secret',
      '_key',
      '_token',
      'password_',
      'pwd_',
      'secret_',
      'key_',
      'token_',
    ]

    return inclusionPatterns.some((pattern) => keyLower.includes(pattern))
  }

  /**
   * Active temporairement le bypass de la sanitisation (pour debug)
   * ⚠️ À utiliser avec précaution - audit automatique
   */
  temporaryBypass(durationMs: number = 60000, reason: string): void {
    if (!this.isProduction) {
      this.logger.warn('Bypass request ignored in non-production environment')
      return
    }

    // Audit de sécurité obligatoire
    this.logger.warn('LOG SANITIZATION BYPASS ACTIVATED', {
      type: 'security_audit',
      severity: 'high',
      reason,
      duration: durationMs,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    })

    // Désactive temporairement
    process.env.LOG_SANITIZATION_ENABLED = 'false'

    // Réactive automatiquement après la durée spécifiée
    setTimeout(() => {
      process.env.LOG_SANITIZATION_ENABLED = 'true'
      this.logger.warn('LOG SANITIZATION REACTIVATED', {
        type: 'security_audit',
        severity: 'medium',
        reason: 'Automatic reactivation after bypass period',
        timestamp: new Date().toISOString(),
      })
    }, durationMs)
  }

  /**
   * Retourne les statistiques de sanitisation
   */
  getStats(): {
    isEnabled: boolean
    isProduction: boolean
    rulesCount: number
    auditEnabled: boolean
  } {
    return {
      isEnabled: this.enableSanitization,
      isProduction: this.isProduction,
      rulesCount: this.sensitiveDataRules.length,
      auditEnabled: this.auditSanitization,
    }
  }
}
