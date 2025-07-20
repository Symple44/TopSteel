import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  HttpStatus,
  HttpException,
  Logger
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { EmailService } from '../services/email.service'
import { EmailTemplateService, CreateTemplateDto, UpdateTemplateDto } from '../services/email-template.service'
import { EmailQueueService } from '../services/email-queue.service'
import { EmailOptions, BulkEmailOptions, EmailResult, BulkEmailResult } from '../interfaces/email-provider.interface'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { CurrentUser } from '../../../common/decorators/current-user.decorator'

// DTOs pour la validation
export class SendEmailDto implements EmailOptions {
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  html?: string
  text?: string
  attachments?: any[]
  replyTo?: string
  headers?: Record<string, string>
  tags?: string[]
  metadata?: Record<string, any>
  templateName?: string
  templateData?: Record<string, any>
}

export class SendBulkEmailDto implements BulkEmailOptions {
  emails: EmailOptions[]
  batchSize?: number
  delayBetweenBatches?: number
}

export class ScheduleEmailDto {
  email: SendEmailDto
  sendAt: string // ISO date string
  providerName?: string
}

export class ConfigureProviderDto {
  provider: 'google' | 'microsoft' | 'smtp'
  name: string
  enabled: boolean
  defaultFrom: string
  defaultFromName?: string
  oauth2Config?: any
  smtpConfig?: any
  rateLimitConfig?: any
  retryConfig?: any
  description?: string
}

@ApiTags('Email')
@Controller('email')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EmailController {
  private readonly logger = new Logger(EmailController.name)

  constructor(
    private readonly emailService: EmailService,
    private readonly templateService: EmailTemplateService,
    private readonly queueService: EmailQueueService,
  ) {}

  // === ENVOI D'EMAILS ===

  @Post('send')
  @ApiOperation({ summary: 'Envoyer un email' })
  @ApiResponse({ status: 200, description: 'Email envoyé avec succès' })
  @Roles('user', 'admin')
  async sendEmail(
    @Body() dto: SendEmailDto,
    @Query('provider') providerName?: string,
    @CurrentUser() user?: any
  ): Promise<EmailResult> {
    try {
      let emailOptions = dto

      // Si un template est spécifié, le rendre
      if (dto.templateName) {
        const rendered = await this.templateService.renderTemplate(
          dto.templateName, 
          dto.templateData || {}
        )
        
        emailOptions = {
          ...dto,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
        }
      }

      const result = await this.emailService.sendEmail(emailOptions, providerName)
      
      this.logger.log(`Email envoyé par ${user?.email}: ${dto.subject}`)
      
      return result
    } catch (error) {
      this.logger.error('Erreur lors de l\'envoi d\'email:', error)
      throw new HttpException((error as Error).message, HttpStatus.BAD_REQUEST)
    }
  }

  @Post('send-bulk')
  @ApiOperation({ summary: 'Envoyer des emails en masse' })
  @ApiResponse({ status: 200, description: 'Emails envoyés en masse' })
  @Roles('admin', 'marketing')
  async sendBulkEmails(
    @Body() dto: SendBulkEmailDto,
    @Query('provider') providerName?: string,
    @CurrentUser() user?: any
  ): Promise<BulkEmailResult> {
    try {
      const result = await this.emailService.sendBulkEmails(dto, providerName)
      
      this.logger.log(`Envoi en masse par ${user?.email}: ${dto.emails.length} emails`)
      
      return result
    } catch (error) {
      this.logger.error('Erreur lors de l\'envoi en masse:', error)
      throw new HttpException((error as Error).message, HttpStatus.BAD_REQUEST)
    }
  }

  @Post('queue')
  @ApiOperation({ summary: 'Ajouter un email à la queue' })
  @ApiResponse({ status: 200, description: 'Email ajouté à la queue' })
  @Roles('user', 'admin')
  async queueEmail(
    @Body() dto: SendEmailDto,
    @Query('provider') providerName?: string,
    @Query('delay') delay?: number,
    @CurrentUser() user?: any
  ): Promise<{ jobId: string }> {
    try {
      let emailOptions = dto

      if (dto.templateName) {
        const rendered = await this.templateService.renderTemplate(
          dto.templateName, 
          dto.templateData || {}
        )
        
        emailOptions = {
          ...dto,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
        }
      }

      const job = await this.emailService.queueEmail(emailOptions, providerName, delay)
      
      this.logger.log(`Email mis en queue par ${user?.email}: ${dto.subject}`)
      
      return { jobId: job.id.toString() }
    } catch (error) {
      this.logger.error('Erreur lors de la mise en queue:', error)
      throw new HttpException((error as Error).message, HttpStatus.BAD_REQUEST)
    }
  }

  @Post('schedule')
  @ApiOperation({ summary: 'Programmer un email' })
  @ApiResponse({ status: 200, description: 'Email programmé' })
  @Roles('user', 'admin')
  async scheduleEmail(
    @Body() dto: ScheduleEmailDto,
    @CurrentUser() user?: any
  ): Promise<{ jobId: string }> {
    try {
      const sendAt = new Date(dto.sendAt)
      
      let emailOptions = dto.email

      if (dto.email.templateName) {
        const rendered = await this.templateService.renderTemplate(
          dto.email.templateName, 
          dto.email.templateData || {}
        )
        
        emailOptions = {
          ...dto.email,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
        }
      }

      const job = await this.queueService.scheduleEmail(
        emailOptions, 
        sendAt, 
        dto.providerName
      )
      
      this.logger.log(`Email programmé par ${user?.email} pour ${sendAt.toISOString()}`)
      
      return { jobId: job.id.toString() }
    } catch (error) {
      this.logger.error('Erreur lors de la programmation:', error)
      throw new HttpException((error as Error).message, HttpStatus.BAD_REQUEST)
    }
  }

  // === TEMPLATES ===

  @Get('templates')
  @ApiOperation({ summary: 'Récupérer tous les templates' })
  @Roles('user', 'admin')
  async getTemplates(@Query('category') category?: string) {
    return await this.templateService.getAllTemplates(category)
  }

  @Get('templates/:name')
  @ApiOperation({ summary: 'Récupérer un template par nom' })
  @Roles('user', 'admin')
  async getTemplate(@Param('name') name: string) {
    return await this.templateService.getTemplate(name)
  }

  @Post('templates')
  @ApiOperation({ summary: 'Créer un nouveau template' })
  @Roles('admin', 'marketing')
  async createTemplate(
    @Body() dto: CreateTemplateDto,
    @CurrentUser() user?: any
  ) {
    try {
      const template = await this.templateService.createTemplate(dto)
      
      this.logger.log(`Template créé par ${user?.email}: ${dto.name}`)
      
      return template
    } catch (error) {
      this.logger.error('Erreur lors de la création du template:', error)
      throw new HttpException((error as Error).message, HttpStatus.BAD_REQUEST)
    }
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Mettre à jour un template' })
  @Roles('admin', 'marketing')
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
    @CurrentUser() user?: any
  ) {
    try {
      const template = await this.templateService.updateTemplate(id, dto)
      
      this.logger.log(`Template mis à jour par ${user?.email}: ${id}`)
      
      return template
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour du template:', error)
      throw new HttpException((error as Error).message, HttpStatus.BAD_REQUEST)
    }
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Supprimer un template' })
  @Roles('admin')
  async deleteTemplate(
    @Param('id') id: string,
    @CurrentUser() user?: any
  ) {
    try {
      await this.templateService.deleteTemplate(id)
      
      this.logger.log(`Template supprimé par ${user?.email}: ${id}`)
      
      return { message: 'Template supprimé avec succès' }
    } catch (error) {
      this.logger.error('Erreur lors de la suppression du template:', error)
      throw new HttpException((error as Error).message, HttpStatus.BAD_REQUEST)
    }
  }

  @Post('templates/:name/preview')
  @ApiOperation({ summary: 'Prévisualiser un template' })
  @Roles('user', 'admin')
  async previewTemplate(
    @Param('name') name: string,
    @Body() testData?: Record<string, any>
  ) {
    try {
      return await this.templateService.previewTemplate(name, testData)
    } catch (error) {
      this.logger.error('Erreur lors de la prévisualisation:', error)
      throw new HttpException((error as Error).message, HttpStatus.BAD_REQUEST)
    }
  }

  @Post('templates/validate')
  @ApiOperation({ summary: 'Valider un template Handlebars' })
  @Roles('user', 'admin')
  async validateTemplate(@Body() { content }: { content: string }) {
    return this.templateService.validateTemplate(content)
  }

  @Post('templates/:id/duplicate')
  @ApiOperation({ summary: 'Dupliquer un template' })
  @Roles('admin', 'marketing')
  async duplicateTemplate(
    @Param('id') id: string,
    @Body() { newName }: { newName: string },
    @CurrentUser() user?: any
  ) {
    try {
      const template = await this.templateService.duplicateTemplate(id, newName)
      
      this.logger.log(`Template dupliqué par ${user?.email}: ${id} -> ${newName}`)
      
      return template
    } catch (error) {
      this.logger.error('Erreur lors de la duplication:', error)
      throw new HttpException((error as Error).message, HttpStatus.BAD_REQUEST)
    }
  }

  // === QUEUE ET STATISTIQUES ===

  @Get('queue/stats')
  @ApiOperation({ summary: 'Statistiques de la queue' })
  @Roles('admin')
  async getQueueStats() {
    return await this.queueService.getQueueStats()
  }

  @Get('queue/jobs/active')
  @ApiOperation({ summary: 'Jobs actifs' })
  @Roles('admin')
  async getActiveJobs() {
    return await this.queueService.getActiveJobs()
  }

  @Get('queue/jobs/waiting')
  @ApiOperation({ summary: 'Jobs en attente' })
  @Roles('admin')
  async getWaitingJobs() {
    return await this.queueService.getWaitingJobs()
  }

  @Get('queue/jobs/failed')
  @ApiOperation({ summary: 'Jobs échoués' })
  @Roles('admin')
  async getFailedJobs() {
    return await this.queueService.getFailedJobs()
  }

  @Post('queue/jobs/:id/retry')
  @ApiOperation({ summary: 'Relancer un job échoué' })
  @Roles('admin')
  async retryJob(@Param('id') jobId: string) {
    try {
      await this.queueService.retryFailedJob(jobId)
      return { message: 'Job relancé avec succès' }
    } catch (error) {
      throw new HttpException((error as Error).message, HttpStatus.BAD_REQUEST)
    }
  }

  @Delete('queue/jobs/:id')
  @ApiOperation({ summary: 'Supprimer un job' })
  @Roles('admin')
  async removeJob(@Param('id') jobId: string) {
    try {
      await this.queueService.removeJob(jobId)
      return { message: 'Job supprimé avec succès' }
    } catch (error) {
      throw new HttpException((error as Error).message, HttpStatus.BAD_REQUEST)
    }
  }

  @Post('queue/pause')
  @ApiOperation({ summary: 'Mettre en pause la queue' })
  @Roles('admin')
  async pauseQueue(@CurrentUser() user?: any) {
    await this.queueService.pauseQueue()
    this.logger.log(`Queue mise en pause par ${user?.email}`)
    return { message: 'Queue mise en pause' }
  }

  @Post('queue/resume')
  @ApiOperation({ summary: 'Reprendre la queue' })
  @Roles('admin')
  async resumeQueue(@CurrentUser() user?: any) {
    await this.queueService.resumeQueue()
    this.logger.log(`Queue reprise par ${user?.email}`)
    return { message: 'Queue reprise' }
  }

  @Delete('queue/purge')
  @ApiOperation({ summary: 'Purger la queue' })
  @Roles('admin')
  async purgeQueue(@CurrentUser() user?: any) {
    await this.queueService.purgeQueue()
    this.logger.log(`Queue purgée par ${user?.email}`)
    return { message: 'Queue purgée' }
  }

  // === STATISTIQUES ET HISTORIQUE ===

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques d\'envoi' })
  @Roles('admin', 'marketing')
  async getEmailStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined
    const end = endDate ? new Date(endDate) : undefined
    
    return await this.emailService.getEmailStats(start, end)
  }

  @Get('history')
  @ApiOperation({ summary: 'Historique des emails' })
  @Roles('admin', 'marketing')
  async getEmailHistory(
    @Query('limit') limit = 100,
    @Query('offset') offset = 0
  ) {
    return await this.emailService.getEmailHistory(Number(limit), Number(offset))
  }

  // === PROVIDERS ET CONFIGURATION ===

  @Get('providers')
  @ApiOperation({ summary: 'Providers disponibles' })
  @Roles('admin')
  async getProviders() {
    return {
      available: this.emailService.getAvailableProviders(),
      configured: await this.emailService.getAvailableProviders() // À améliorer
    }
  }

  @Post('providers/:name/test')
  @ApiOperation({ summary: 'Tester un provider' })
  @Roles('admin')
  async testProvider(@Param('name') providerName: string) {
    try {
      const isValid = await this.emailService.validateProvider(providerName)
      return { 
        provider: providerName, 
        connected: isValid,
        message: isValid ? 'Connexion réussie' : 'Échec de la connexion'
      }
    } catch (error) {
      throw new HttpException((error as Error).message, HttpStatus.BAD_REQUEST)
    }
  }

  @Post('providers/configure')
  @ApiOperation({ summary: 'Configurer un provider' })
  @Roles('admin')
  async configureProvider(
    @Body() dto: ConfigureProviderDto,
    @CurrentUser() user?: any
  ) {
    try {
      await this.emailService.configureProvider(dto as any)
      
      this.logger.log(`Provider ${dto.provider} configuré par ${user?.email}`)
      
      return { message: 'Provider configuré avec succès' }
    } catch (error) {
      this.logger.error('Erreur lors de la configuration du provider:', error)
      throw new HttpException((error as Error).message, HttpStatus.BAD_REQUEST)
    }
  }

  @Post('providers/refresh-tokens')
  @ApiOperation({ summary: 'Rafraîchir tous les tokens OAuth2' })
  @Roles('admin')
  async refreshTokens(@CurrentUser() user?: any) {
    try {
      await this.emailService.refreshAllTokens()
      
      this.logger.log(`Tokens rafraîchis par ${user?.email}`)
      
      return { message: 'Tokens rafraîchis avec succès' }
    } catch (error) {
      this.logger.error('Erreur lors du rafraîchissement des tokens:', error)
      throw new HttpException((error as Error).message, HttpStatus.BAD_REQUEST)
    }
  }

  // === WEBHOOKS ET CALLBACKS ===

  @Post('webhooks/:provider')
  @ApiOperation({ summary: 'Webhook pour les providers externes' })
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() payload: any
  ) {
    // Gérer les webhooks des providers (bounces, complaints, etc.)
    this.logger.log(`Webhook reçu de ${provider}:`, payload)
    
    // Traitement du webhook selon le provider
    // À implémenter selon les besoins
    
    return { status: 'received' }
  }

  @Get('auth/:provider/url')
  @ApiOperation({ summary: 'URL d\'autorisation OAuth2' })
  @Roles('admin')
  async getAuthUrl(@Param('provider') provider: string) {
    // Retourner l'URL d'autorisation pour OAuth2
    // À implémenter selon le provider
    return { authUrl: `https://auth.${provider}.com/oauth2/authorize` }
  }

  @Post('auth/:provider/callback')
  @ApiOperation({ summary: 'Callback OAuth2' })
  @Roles('admin')
  async handleAuthCallback(
    @Param('provider') provider: string,
    @Body() { code }: { code: string }
  ) {
    // Gérer le callback OAuth2 et échanger le code contre des tokens
    // À implémenter selon le provider
    return { message: 'Autorisation réussie' }
  }
}