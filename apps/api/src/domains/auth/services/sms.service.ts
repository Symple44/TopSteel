import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between } from 'typeorm'
import * as Twilio from 'twilio'
import { Vonage } from '@vonage/server-sdk'
import { Auth } from '@vonage/auth'
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'
import { SMSLog } from '../entities/sms-log.entity'

/**
 * Configuration pour le fournisseur SMS
 */
interface SMSProviderConfig {
  provider: 'twilio' | 'vonage' | 'aws-sns' | 'mock'
  apiKey: string
  apiSecret?: string
  senderId?: string
  region?: string
  twilioAccountSid?: string
  twilioPhoneNumber?: string
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
  private twilioClient?: Twilio.Twilio
  private vonageClient?: Vonage
  private snsClient?: SNSClient

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(SMSLog)
    private readonly smsLogRepository: Repository<SMSLog>,
  ) {
    this.config = {
      provider: this.configService.get<string>('SMS_PROVIDER', 'mock') as any,
      apiKey: this.configService.get<string>('SMS_API_KEY', ''),
      apiSecret: this.configService.get<string>('SMS_API_SECRET', ''),
      senderId: this.configService.get<string>('SMS_SENDER_ID', 'TopSteel'),
      region: this.configService.get<string>('SMS_REGION', 'eu-west-1'),
      twilioAccountSid: this.configService.get<string>('TWILIO_ACCOUNT_SID', ''),
      twilioPhoneNumber: this.configService.get<string>('TWILIO_PHONE_NUMBER', ''),
    }

    this.initializeProvider()
    this.logger.log(`SMS Service initialized with provider: ${this.config.provider}`)
  }

  /**
   * Initialiser le fournisseur SMS selon la configuration
   */
  private initializeProvider(): void {
    try {
      switch (this.config.provider) {
        case 'twilio':
          if (this.config.twilioAccountSid && this.config.apiKey) {
            this.twilioClient = Twilio.default(
              this.config.twilioAccountSid,
              this.config.apiKey
            )
            this.logger.log('Twilio client initialized successfully')
          }
          break

        case 'vonage':
          if (this.config.apiKey && this.config.apiSecret) {
            this.vonageClient = new Vonage(
              new Auth({
                apiKey: this.config.apiKey,
                apiSecret: this.config.apiSecret,
              })
            )
            this.logger.log('Vonage client initialized successfully')
          }
          break

        case 'aws-sns':
          if (this.config.apiKey && this.config.apiSecret) {
            this.snsClient = new SNSClient({
              region: this.config.region || 'eu-west-1',
              credentials: {
                accessKeyId: this.config.apiKey,
                secretAccessKey: this.config.apiSecret,
              },
            })
            this.logger.log('AWS SNS client initialized successfully')
          }
          break

        default:
          this.logger.log('Using mock SMS provider')
      }
    } catch (error) {
      this.logger.error(`Failed to initialize ${this.config.provider} client:`, error)
    }
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
      templateId: 'mfa_verification',
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
      templateId: 'security_alert',
    })
  }

  /**
   * Envoyer un SMS générique
   */
  async sendSMS(request: SendSMSRequest): Promise<SendSMSResponse> {
    const startTime = Date.now()
    let response: SendSMSResponse
    
    try {
      this.logger.log(
        `Sending SMS to ${this.maskPhoneNumber(request.phoneNumber)} via ${this.config.provider}`
      )

      // Validation du numéro de téléphone
      if (!this.isValidPhoneNumber(request.phoneNumber)) {
        response = {
          success: false,
          error: 'Invalid phone number format',
        }
        await this.logSMS(request, response, Date.now() - startTime)
        return response
      }

      // Envoi selon le fournisseur configuré
      switch (this.config.provider) {
        case 'twilio':
          response = await this.sendViaTwilio(request)
          break
        case 'vonage':
          response = await this.sendViaVonage(request)
          break
        case 'aws-sns':
          response = await this.sendViaAWSSNS(request)
          break
        default:
          response = await this.sendViaMock(request)
      }

      // Enregistrer le log
      await this.logSMS(request, response, Date.now() - startTime)
      
      return response
    } catch (error) {
      this.logger.error('Error sending SMS:', error)
      response = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
      
      await this.logSMS(request, response, Date.now() - startTime)
      return response
    }
  }

  /**
   * Enregistrer un log SMS dans la base de données
   */
  private async logSMS(
    request: SendSMSRequest,
    response: SendSMSResponse,
    responseTime: number
  ): Promise<void> {
    try {
      const log = this.smsLogRepository.create({
        phoneNumber: this.maskPhoneNumber(request.phoneNumber),
        message: request.message.substring(0, 160), // Stocker seulement les 160 premiers caractères
        messageType: request.messageType || 'info',
        provider: this.config.provider,
        status: response.success ? 'sent' : 'failed',
        messageId: response.messageId,
        cost: response.cost,
        segmentCount: response.segmentCount || 1,
        error: response.error,
        metadata: {
          templateId: request.templateId,
          variables: request.variables,
          responseTime,
        },
      })

      await this.smsLogRepository.save(log)
    } catch (error) {
      this.logger.error('Failed to log SMS:', error)
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
    if (!this.twilioClient) {
      this.logger.error('Twilio client not initialized')
      return {
        success: false,
        error: 'Twilio client not configured properly',
      }
    }

    try {
      const message = await this.twilioClient.messages.create({
        body: request.message,
        from: this.config.twilioPhoneNumber || this.config.senderId,
        to: request.phoneNumber,
      })

      this.logger.log(`Twilio SMS sent successfully: ${message.sid}`)

      return {
        success: true,
        messageId: message.sid,
        status: message.status,
        cost: message.price ? parseFloat(message.price) : undefined,
        segmentCount: message.numSegments ? parseInt(message.numSegments) : 1,
      }
    } catch (error) {
      this.logger.error('Twilio SMS sending failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Twilio sending failed',
      }
    }
  }

  /**
   * Envoi via Vonage (anciennement Nexmo)
   */
  private async sendViaVonage(request: SendSMSRequest): Promise<SendSMSResponse> {
    if (!this.vonageClient) {
      this.logger.error('Vonage client not initialized')
      return {
        success: false,
        error: 'Vonage client not configured properly',
      }
    }

    try {
      const response = await this.vonageClient.sms.send({
        from: this.config.senderId || 'TopSteel',
        to: request.phoneNumber.replace('+', ''),
        text: request.message,
      })

      const messageData = response.messages?.[0]
      
      if (messageData?.status === '0') {
        this.logger.log(`Vonage SMS sent successfully: ${messageData.messageId}`)
        
        return {
          success: true,
          messageId: messageData.messageId,
          status: 'sent',
          cost: messageData.messagePrice ? parseFloat(messageData.messagePrice) : undefined,
          segmentCount: 1,
        }
      } else {
        throw new Error(messageData?.errorText || 'Unknown Vonage error')
      }
    } catch (error) {
      this.logger.error('Vonage SMS sending failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Vonage sending failed',
      }
    }
  }

  /**
   * Envoi via AWS SNS
   */
  private async sendViaAWSSNS(request: SendSMSRequest): Promise<SendSMSResponse> {
    if (!this.snsClient) {
      this.logger.error('AWS SNS client not initialized')
      return {
        success: false,
        error: 'AWS SNS client not configured properly',
      }
    }

    try {
      const command = new PublishCommand({
        PhoneNumber: request.phoneNumber,
        Message: request.message,
        MessageAttributes: {
          'AWS.SNS.SMS.SenderID': {
            DataType: 'String',
            StringValue: this.config.senderId || 'TopSteel',
          },
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: request.messageType === 'verification' ? 'Transactional' : 'Promotional',
          },
        },
      })

      const response = await this.snsClient.send(command)
      
      this.logger.log(`AWS SNS SMS sent successfully: ${response.MessageId}`)

      return {
        success: true,
        messageId: response.MessageId,
        status: 'sent',
        segmentCount: 1,
      }
    } catch (error) {
      this.logger.error('AWS SNS SMS sending failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AWS SNS sending failed',
      }
    }
  }

  /**
   * Envoi simulé (pour développement et tests)
   */
  private async sendViaMock(request: SendSMSRequest): Promise<SendSMSResponse> {
    this.logger.log(`[MOCK SMS] To: ${request.phoneNumber}`)
    this.logger.log(`[MOCK SMS] Message: ${request.message}`)

    // Simuler un délai d'envoi
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Simuler un succès avec probabilité de 95%
    const success = Math.random() > 0.05

    if (success) {
      return {
        success: true,
        messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'delivered',
        cost: 0.05,
        segmentCount: 1,
      }
    } else {
      return {
        success: false,
        error: 'Mock SMS delivery failed',
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
    try {
      // Récupérer tous les logs dans la période
      const logs = await this.smsLogRepository.find({
        where: {
          createdAt: Between(startDate, endDate),
        },
      })

      if (logs.length === 0) {
        return {
          totalSent: 0,
          successRate: 0,
          totalCost: 0,
          byProvider: {},
          byType: {},
        }
      }

      // Calculer les statistiques
      const totalSent = logs.length
      const successCount = logs.filter(log => log.status === 'sent').length
      const successRate = (successCount / totalSent) * 100
      const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0)

      // Grouper par fournisseur
      const byProvider: Record<string, number> = {}
      logs.forEach(log => {
        byProvider[log.provider] = (byProvider[log.provider] || 0) + 1
      })

      // Grouper par type
      const byType: Record<string, number> = {}
      logs.forEach(log => {
        byType[log.messageType] = (byType[log.messageType] || 0) + 1
      })

      return {
        totalSent,
        successRate: Math.round(successRate * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        byProvider,
        byType,
      }
    } catch (error) {
      this.logger.error('Failed to get SMS statistics:', error)
      return {
        totalSent: 0,
        successRate: 0,
        totalCost: 0,
        byProvider: {},
        byType: {},
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
      provider: this.config.provider,
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
        messageType: 'info',
      })

      return {
        success: result.success,
        provider: this.config.provider,
        responseTime: Date.now() - startTime,
        error: result.error,
      }
    } catch (error) {
      return {
        success: false,
        provider: this.config.provider,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
