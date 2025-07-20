import { Injectable, Logger } from '@nestjs/common'
import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import * as nodemailer from 'nodemailer'
import { 
  EmailProvider, 
  EmailOptions, 
  EmailResult, 
  BulkEmailOptions, 
  BulkEmailResult,
  EmailConfiguration 
} from '../interfaces/email-provider.interface'

@Injectable()
export class GoogleEmailProvider implements EmailProvider {
  private readonly logger = new Logger(GoogleEmailProvider.name)
  private oauth2Client: OAuth2Client
  private transporter: nodemailer.Transporter
  private config: EmailConfiguration

  constructor() {}

  async initialize(config: EmailConfiguration): Promise<void> {
    this.config = config
    
    if (!config.oauth2) {
      throw new Error('Configuration OAuth2 manquante pour Google')
    }

    // Initialiser OAuth2 Client
    this.oauth2Client = new google.auth.OAuth2(
      config.oauth2.clientId,
      config.oauth2.clientSecret,
      config.oauth2.redirectUri || 'http://localhost:3000/api/auth/google/callback'
    )

    // Définir les credentials
    this.oauth2Client.setCredentials({
      refresh_token: config.oauth2.refreshToken,
      access_token: config.oauth2.accessToken,
    })

    // Créer le transporter Nodemailer avec OAuth2
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        type: 'OAuth2',
        user: config.defaultFrom,
        clientId: config.oauth2.clientId,
        clientSecret: config.oauth2.clientSecret,
        refreshToken: config.oauth2.refreshToken,
        accessToken: config.oauth2.accessToken,
      },
    })

    // Vérifier la connexion
    await this.validateConnection()
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Rafraîchir le token si nécessaire
      await this.refreshTokenIfNeeded()

      const mailOptions: nodemailer.SendMailOptions = {
        from: `${this.config.defaultFromName || 'TopSteel ERP'} <${this.config.defaultFrom}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        headers: options.headers,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          path: att.path,
          contentType: att.contentType,
          encoding: att.encoding,
          cid: att.cid,
        })),
      }

      const result = await this.transporter.sendMail(mailOptions)

      this.logger.log(`Email envoyé via Google: ${result.messageId}`)

      return {
        success: true,
        messageId: result.messageId,
        provider: this.getProviderName(),
        timestamp: new Date(),
        metadata: {
          response: result.response,
          accepted: result.accepted,
          rejected: result.rejected,
        },
      }
    } catch (error) {
      this.logger.error('Erreur lors de l\'envoi via Google:', error)
      
      return {
        success: false,
        error: (error as Error).message,
        provider: this.getProviderName(),
        timestamp: new Date(),
      }
    }
  }

  async sendBulkEmails(options: BulkEmailOptions): Promise<BulkEmailResult> {
    const startTime = Date.now()
    const results: EmailResult[] = []
    let totalSent = 0
    let totalFailed = 0

    const batchSize = options.batchSize || 10
    const delayBetweenBatches = options.delayBetweenBatches || 1000

    // Envoyer par batch pour respecter les limites de taux
    for (let i = 0; i < options.emails.length; i += batchSize) {
      const batch = options.emails.slice(i, i + batchSize)
      
      const batchResults = await Promise.all(
        batch.map(email => this.sendEmail(email))
      )

      results.push(...batchResults)
      
      batchResults.forEach(result => {
        if (result.success) {
          totalSent++
        } else {
          totalFailed++
        }
      })

      // Attendre entre les batches pour éviter le rate limiting
      if (i + batchSize < options.emails.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
      }
    }

    return {
      totalSent,
      totalFailed,
      results,
      duration: Date.now() - startTime,
    }
  }

  async validateConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      this.logger.log('Connexion Google Gmail vérifiée avec succès')
      return true
    } catch (error) {
      this.logger.error('Erreur de connexion Google Gmail:', error)
      return false
    }
  }

  getProviderName(): string {
    return 'Google Gmail'
  }

  async refreshToken(): Promise<void> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken()
      
      // Mettre à jour les credentials
      this.oauth2Client.setCredentials(credentials)
      
      // Mettre à jour le transporter
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          type: 'OAuth2',
          user: this.config.defaultFrom,
          clientId: this.config.oauth2?.clientId || '',
          clientSecret: this.config.oauth2?.clientSecret || '',
          refreshToken: credentials.refresh_token || this.config.oauth2?.refreshToken || '',
          accessToken: credentials.access_token,
        },
      } as any)

      // Sauvegarder le nouveau token (à implémenter selon votre système de stockage)
      if (this.config.oauth2) {
        this.config.oauth2.accessToken = credentials.access_token || undefined
        this.config.oauth2.tokenExpiry = credentials.expiry_date ? new Date(credentials.expiry_date) : undefined
      }

      this.logger.log('Token Google actualisé avec succès')
    } catch (error) {
      this.logger.error('Erreur lors du rafraîchissement du token Google:', error)
      throw error
    }
  }

  private async refreshTokenIfNeeded(): Promise<void> {
    if (this.config.oauth2?.tokenExpiry) {
      const now = new Date()
      const expiry = new Date(this.config.oauth2.tokenExpiry)
      
      // Rafraîchir le token 5 minutes avant l'expiration
      if (expiry.getTime() - now.getTime() < 5 * 60 * 1000) {
        await this.refreshToken()
      }
    }
  }

  /**
   * Générer l'URL d'autorisation OAuth2 pour Google
   */
  getAuthorizationUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
    ]

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force le consentement pour obtenir un refresh token
    })
  }

  /**
   * Échanger le code d'autorisation contre des tokens
   */
  async handleAuthorizationCode(code: string): Promise<any> {
    const { tokens } = await this.oauth2Client.getToken(code)
    this.oauth2Client.setCredentials(tokens)
    
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
    }
  }
}