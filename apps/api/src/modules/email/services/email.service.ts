import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ConfigService } from '@nestjs/config'
import { 
  EmailProvider, 
  EmailOptions, 
  EmailResult, 
  BulkEmailOptions, 
  BulkEmailResult,
  EmailConfiguration as IEmailConfiguration 
} from '../interfaces/email-provider.interface'
import { GoogleEmailProvider } from '../providers/google-email.provider'
import { MicrosoftEmailProvider } from '../providers/microsoft-email.provider'
import { SmtpEmailProvider } from '../providers/smtp-email.provider'
import { EmailLog } from '../entities/email-log.entity'
import { EmailConfiguration } from '../entities/email-configuration.entity'

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private providers: Map<string, EmailProvider> = new Map()
  private activeProvider: EmailProvider | null = null

  constructor(
    @InjectRepository(EmailLog)
    private emailLogRepository: Repository<EmailLog>,
    @InjectRepository(EmailConfiguration)
    private configRepository: Repository<EmailConfiguration>,
    private configService: ConfigService,
    @Inject(forwardRef(() => 'EmailQueueService')) private queueService: any,
    private googleProvider: GoogleEmailProvider,
    private microsoftProvider: MicrosoftEmailProvider,
    private smtpProvider: SmtpEmailProvider,
  ) {
    this.initializeProviders()
  }

  private async initializeProviders(): Promise<void> {
    try {
      // Récupérer la configuration depuis la base de données
      const configurations = await this.configRepository.find({ where: { enabled: true } })
      
      if (configurations.length === 0) {
        this.logger.warn('Aucune configuration email active trouvée')
        return
      }

      // Initialiser chaque provider configuré
      for (const config of configurations) {
        await this.initializeProvider(config)
      }

      // Définir le provider par défaut
      if (this.providers.size > 0) {
        const defaultProviderName = this.configService.get<string>('EMAIL_DEFAULT_PROVIDER') || 'smtp'
        this.activeProvider = this.providers.get(defaultProviderName) || this.providers.values().next().value || null
        this.logger.log(`Provider email actif: ${this.activeProvider?.getProviderName()}`)
      }
    } catch (error) {
      this.logger.error('Erreur lors de l\'initialisation des providers email:', error)
    }
  }

  private async initializeProvider(config: EmailConfiguration): Promise<void> {
    try {
      const providerConfig: IEmailConfiguration = {
        provider: config.provider as any,
        enabled: config.enabled,
        defaultFrom: config.defaultFrom,
        defaultFromName: config.defaultFromName || undefined,
        oauth2: config.oauth2Config ? JSON.parse(config.oauth2Config) : undefined,
        smtp: config.smtpConfig ? JSON.parse(config.smtpConfig) : undefined,
        rateLimit: config.rateLimitConfig ? JSON.parse(config.rateLimitConfig) : undefined,
        retry: config.retryConfig ? JSON.parse(config.retryConfig) : undefined,
      }

      let provider: EmailProvider

      switch (config.provider) {
        case 'google':
          provider = this.googleProvider
          break
        case 'microsoft':
          provider = this.microsoftProvider
          break
        case 'smtp':
          provider = this.smtpProvider
          break
        default:
          throw new Error(`Provider non supporté: ${config.provider}`)
      }

      await provider.initialize(providerConfig)
      this.providers.set(config.provider, provider)
      
      this.logger.log(`Provider ${config.provider} initialisé avec succès`)
    } catch (error) {
      this.logger.error(`Erreur lors de l'initialisation du provider ${config.provider}:`, error)
    }
  }

  /**
   * Envoyer un email simple
   */
  async sendEmail(options: EmailOptions, providerName?: string): Promise<EmailResult> {
    const provider = providerName ? this.providers.get(providerName) : this.activeProvider
    
    if (!provider) {
      throw new Error('Aucun provider email disponible')
    }

    const result = await provider.sendEmail(options)
    
    // Enregistrer le log
    await this.logEmail(options, result)
    
    return result
  }

  /**
   * Envoyer des emails en masse
   */
  async sendBulkEmails(options: BulkEmailOptions, providerName?: string): Promise<BulkEmailResult> {
    const provider = providerName ? this.providers.get(providerName) : this.activeProvider
    
    if (!provider) {
      throw new Error('Aucun provider email disponible')
    }

    const result = await provider.sendBulkEmails(options)
    
    // Enregistrer les logs pour chaque email
    await Promise.all(
      result.results.map((emailResult, index) => 
        this.logEmail(options.emails[index], emailResult)
      )
    )
    
    return result
  }

  /**
   * Ajouter un email à la queue pour traitement asynchrone
   */
  async queueEmail(options: EmailOptions, providerName?: string, delay?: number): Promise<any> {
    return await this.queueService.addEmailJob(options, providerName, delay)
  }

  /**
   * Ajouter des emails en masse à la queue
   */
  async queueBulkEmails(options: BulkEmailOptions, providerName?: string, delay?: number): Promise<void> {
    await this.queueService.addBulkEmailJob(options, providerName, delay)
  }

  /**
   * Valider la connexion d'un provider
   */
  async validateProvider(providerName: string): Promise<boolean> {
    const provider = this.providers.get(providerName)
    
    if (!provider) {
      return false
    }

    return await provider.validateConnection()
  }

  /**
   * Obtenir la liste des providers disponibles
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  /**
   * Obtenir les statistiques d'envoi
   */
  async getEmailStats(startDate?: Date, endDate?: Date): Promise<any> {
    const queryBuilder = this.emailLogRepository.createQueryBuilder('log')
    
    if (startDate) {
      queryBuilder.andWhere('log.sentAt >= :startDate', { startDate })
    }
    
    if (endDate) {
      queryBuilder.andWhere('log.sentAt <= :endDate', { endDate })
    }

    const total = await queryBuilder.getCount()
    const sent = await queryBuilder.andWhere('log.success = :success', { success: true }).getCount()
    const failed = await queryBuilder.andWhere('log.success = :success', { success: false }).getCount()

    // Statistiques par provider
    const providerStats = await this.emailLogRepository
      .createQueryBuilder('log')
      .select('log.provider', 'provider')
      .addSelect('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN log.success = true THEN 1 ELSE 0 END)', 'sent')
      .addSelect('SUM(CASE WHEN log.success = false THEN 1 ELSE 0 END)', 'failed')
      .groupBy('log.provider')
      .getRawMany()

    return {
      total,
      sent,
      failed,
      successRate: total > 0 ? (sent / total) * 100 : 0,
      providerStats,
    }
  }

  /**
   * Récupérer l'historique des emails
   */
  async getEmailHistory(limit = 100, offset = 0): Promise<EmailLog[]> {
    return await this.emailLogRepository.find({
      order: { sentAt: 'DESC' },
      take: limit,
      skip: offset,
    })
  }

  /**
   * Rafraîchir les tokens OAuth2 pour tous les providers
   */
  async refreshAllTokens(): Promise<void> {
    for (const [name, provider] of this.providers) {
      if (provider.refreshToken) {
        try {
          await provider.refreshToken()
          this.logger.log(`Token rafraîchi pour le provider ${name}`)
        } catch (error) {
          this.logger.error(`Erreur lors du rafraîchissement du token pour ${name}:`, error)
        }
      }
    }
  }

  /**
   * Configurer un nouveau provider
   */
  async configureProvider(config: IEmailConfiguration): Promise<void> {
    const entity = new EmailConfiguration()
    entity.provider = config.provider
    entity.enabled = config.enabled
    entity.defaultFrom = config.defaultFrom
    entity.defaultFromName = config.defaultFromName || null
    entity.oauth2Config = config.oauth2 ? JSON.stringify(config.oauth2) : null
    entity.smtpConfig = config.smtp ? JSON.stringify(config.smtp) : null
    entity.rateLimitConfig = config.rateLimit ? JSON.stringify(config.rateLimit) : null
    entity.retryConfig = config.retry ? JSON.stringify(config.retry) : null

    await this.configRepository.save(entity)
    await this.initializeProvider(entity)
  }

  /**
   * Enregistrer un log d'email
   */
  private async logEmail(options: EmailOptions, result: EmailResult): Promise<void> {
    try {
      const log = new EmailLog()
      log.provider = result.provider
      log.messageId = result.messageId || null
      log.to = Array.isArray(options.to) ? options.to.join(', ') : options.to
      log.cc = options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : null
      log.bcc = options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : null
      log.subject = options.subject
      log.success = result.success
      log.error = result.error || null
      log.sentAt = result.timestamp
      log.metadata = result.metadata ? JSON.stringify(result.metadata) : null

      await this.emailLogRepository.save(log)
    } catch (error) {
      this.logger.error('Erreur lors de l\'enregistrement du log email:', error)
    }
  }
}