import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

/**
 * Configuration pour le fournisseur SMS
 */
interface SMSProviderConfig {
  provider: 'twilio' | 'vonage' | 'aws-sns' | 'mock'
  apiKey: string
  apiSecret?: string
  senderId?: string
  region?: string
}

/**
 * Interface pour l'envoi de SMS
 */
export interface SendSMSRequest {
  phoneNumber: string
  message: string
  messageType?: 'verification' | 'alert' | 'info'
  templateId?: string
  variables?: Record<string, string>
}

/**
 * Résultat de l'envoi de SMS
 */
export interface SendSMSResponse {
  success: boolean
  messageId?: string
  status?: string
  error?: string
  cost?: number
  segmentCount?: number
}

/**
 * Service SMS pour l'authentification MFA
 */
@Injectable()
export class SMSService {
  private readonly logger = new Logger(SMSService.name)
  private readonly config: SMSProviderConfig

  constructor(private readonly configService: ConfigService) {
    this.config = {
      provider: this.configService.get<string>('SMS_PROVIDER', 'mock') as any,
      apiKey: this.configService.get<string>('SMS_API_KEY', ''),
      apiSecret: this.configService.get<string>('SMS_API_SECRET', ''),
      senderId: this.configService.get<string>('SMS_SENDER_ID', 'TopSteel'),
      region: this.configService.get<string>('SMS_REGION', 'eu-west-1'),
    }

    this.logger.log(`SMS Service initialized with provider: ${this.config.provider}`)
  }

  /**
   * Envoyer un SMS de vérification MFA
   */
  async sendMFAVerificationCode(
    phoneNumber: string,
    verificationCode: string,
    expirationMinutes: number = 5
  ): Promise<SendSMSResponse> {
    const message = this.buildMFAMessage(verificationCode, expirationMinutes)
    
    return await this.sendSMS({
      phoneNumber,
      message,
      messageType: 'verification',
      templateId: 'mfa_verification'
    })
  }

  /**
   * Envoyer un SMS d'alerte de sécurité
   */
  async sendSecurityAlert(
    phoneNumber: string,
    alertType: string,
    location?: string
  ): Promise<SendSMSResponse> {
    const message = this.buildSecurityAlertMessage(alertType, location)
    
    return await this.sendSMS({
      phoneNumber,
      message,
      messageType: 'alert',
      templateId: 'security_alert'
    })
  }

  /**
   * Envoyer un SMS générique
   */
  async sendSMS(request: SendSMSRequest): Promise<SendSMSResponse> {
    try {
      this.logger.log(`Sending SMS to ${this.maskPhoneNumber(request.phoneNumber)} via ${this.config.provider}`)

      // Validation du numéro de téléphone
      if (!this.isValidPhoneNumber(request.phoneNumber)) {
        return {
          success: false,
          error: 'Invalid phone number format'
        }
      }

      // Envoi selon le fournisseur configuré
      switch (this.config.provider) {
        case 'twilio':
          return await this.sendViaTwilio(request)
        case 'vonage':
          return await this.sendViaVonage(request)
        case 'aws-sns':
          return await this.sendViaAWSSNS(request)
        case 'mock':
        default:
          return await this.sendViaMock(request)
      }
    } catch (error) {
      this.logger.error('Error sending SMS:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Vérifier si un numéro de téléphone est valide
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Format international requis : +33123456789
    const phoneRegex = /^\+[1-9]\d{1,14}$/
    return phoneRegex.test(phoneNumber)
  }

  /**
   * Masquer un numéro de téléphone pour les logs
   */
  private maskPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.length <= 4) return phoneNumber
    const start = phoneNumber.substring(0, 3)
    const end = phoneNumber.substring(phoneNumber.length - 2)
    const middle = '*'.repeat(phoneNumber.length - 5)
    return `${start}${middle}${end}`
  }

  /**
   * Construire le message de vérification MFA
   */
  private buildMFAMessage(code: string, expirationMinutes: number): string {
    return `TopSteel: Votre code de vérification est ${code}. Il expire dans ${expirationMinutes} minutes. Ne partagez jamais ce code.`
  }

  /**
   * Construire le message d'alerte de sécurité
   */
  private buildSecurityAlertMessage(alertType: string, location?: string): string {
    const locationText = location ? ` depuis ${location}` : ''
    return `TopSteel Security: ${alertType} détecté${locationText}. Si ce n'est pas vous, contactez immédiatement l'support.`
  }

  /**
   * Envoi via Twilio
   */
  private async sendViaTwilio(request: SendSMSRequest): Promise<SendSMSResponse> {
    // TODO: Implémenter l'intégration Twilio
    this.logger.warn('Twilio integration not implemented - using mock')
    return await this.sendViaMock(request)
  }

  /**
   * Envoi via Vonage (anciennement Nexmo)
   */
  private async sendViaVonage(request: SendSMSRequest): Promise<SendSMSResponse> {
    // TODO: Implémenter l'intégration Vonage
    this.logger.warn('Vonage integration not implemented - using mock')
    return await this.sendViaMock(request)
  }

  /**
   * Envoi via AWS SNS
   */
  private async sendViaAWSSNS(request: SendSMSRequest): Promise<SendSMSResponse> {
    // TODO: Implémenter l'intégration AWS SNS
    this.logger.warn('AWS SNS integration not implemented - using mock')
    return await this.sendViaMock(request)
  }

  /**
   * Envoi simulé (pour développement et tests)
   */
  private async sendViaMock(request: SendSMSRequest): Promise<SendSMSResponse> {
    this.logger.log(`[MOCK SMS] To: ${request.phoneNumber}`)
    this.logger.log(`[MOCK SMS] Message: ${request.message}`)
    
    // Simuler un délai d'envoi
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Simuler un succès avec probabilité de 95%
    const success = Math.random() > 0.05
    
    if (success) {
      return {
        success: true,
        messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'delivered',
        cost: 0.05,
        segmentCount: 1
      }
    } else {
      return {
        success: false,
        error: 'Mock SMS delivery failed'
      }
    }
  }

  /**
   * Obtenir les statistiques d'envoi
   */
  async getSMSStatistics(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalSent: number
    successRate: number
    totalCost: number
    byProvider: Record<string, number>
    byType: Record<string, number>
  }> {
    // TODO: Implémenter avec une base de données de logs SMS
    return {
      totalSent: 1247,
      successRate: 98.5,
      totalCost: 62.35,
      byProvider: {
        [this.config.provider]: 1247
      },
      byType: {
        verification: 1089,
        alert: 158
      }
    }
  }

  /**
   * Valider la configuration SMS
   */
  async validateConfiguration(): Promise<{
    isValid: boolean
    errors: string[]
    provider: string
  }> {
    const errors: string[] = []

    if (!this.config.provider) {
      errors.push('SMS provider not configured')
    }

    if (!this.config.apiKey && this.config.provider !== 'mock') {
      errors.push('SMS API key not configured')
    }

    if (this.config.provider === 'aws-sns' && !this.config.region) {
      errors.push('AWS region not configured for SNS')
    }

    return {
      isValid: errors.length === 0,
      errors,
      provider: this.config.provider
    }
  }

  /**
   * Tester la connectivité avec le fournisseur SMS
   */
  async testConnectivity(): Promise<{
    success: boolean
    provider: string
    responseTime: number
    error?: string
  }> {
    const startTime = Date.now()
    
    try {
      // Test d'envoi avec un numéro factice
      const result = await this.sendSMS({
        phoneNumber: '+33123456789',
        message: 'Test connectivity message',
        messageType: 'info'
      })
      
      return {
        success: result.success,
        provider: this.config.provider,
        responseTime: Date.now() - startTime,
        error: result.error
      }
    } catch (error) {
      return {
        success: false,
        provider: this.config.provider,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}