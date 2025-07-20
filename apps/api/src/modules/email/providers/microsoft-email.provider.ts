import { Injectable, Logger } from '@nestjs/common'
import { Client } from '@microsoft/microsoft-graph-client'
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials'
import { ClientSecretCredential } from '@azure/identity'
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
export class MicrosoftEmailProvider implements EmailProvider {
  private readonly logger = new Logger(MicrosoftEmailProvider.name)
  private graphClient: Client
  private transporter: nodemailer.Transporter
  private config: EmailConfiguration
  private credential: ClientSecretCredential

  constructor() {}

  async initialize(config: EmailConfiguration): Promise<void> {
    this.config = config
    
    if (!config.oauth2) {
      throw new Error('Configuration OAuth2 manquante pour Microsoft')
    }

    // Configuration pour Azure AD / Microsoft 365
    const tenantId = process.env.AZURE_TENANT_ID || 'common'
    
    // Créer les credentials Azure
    this.credential = new ClientSecretCredential(
      tenantId,
      config.oauth2.clientId,
      config.oauth2.clientSecret
    )

    // Créer le provider d'authentification
    const authProvider = new TokenCredentialAuthenticationProvider(this.credential, {
      scopes: ['https://graph.microsoft.com/.default'],
    })

    // Initialiser le client Microsoft Graph
    this.graphClient = Client.initWithMiddleware({
      authProvider,
    })

    // Alternative: Utiliser SMTP avec OAuth2 pour Outlook/Office365
    this.transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
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
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false,
      },
    })

    await this.validateConnection()
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Méthode 1: Utiliser Microsoft Graph API
      if (this.config.oauth2?.accessToken) {
        return await this.sendViaGraphAPI(options)
      }
      
      // Méthode 2: Utiliser SMTP avec OAuth2
      return await this.sendViaSMTP(options)
    } catch (error) {
      this.logger.error('Erreur lors de l\'envoi via Microsoft:', error)
      
      return {
        success: false,
        error: (error as Error).message,
        provider: this.getProviderName(),
        timestamp: new Date(),
      }
    }
  }

  private async sendViaGraphAPI(options: EmailOptions): Promise<EmailResult> {
    try {
      const message = {
        subject: options.subject,
        body: {
          contentType: options.html ? 'HTML' : 'Text',
          content: options.html || options.text || '',
        },
        toRecipients: this.formatRecipients(options.to),
        ccRecipients: options.cc ? this.formatRecipients(options.cc) : undefined,
        bccRecipients: options.bcc ? this.formatRecipients(options.bcc) : undefined,
        replyTo: options.replyTo ? [{ emailAddress: { address: options.replyTo } }] : undefined,
        attachments: await this.formatAttachments(options.attachments),
      }

      // Envoyer l'email via Microsoft Graph
      const response = await this.graphClient
        .api('/me/sendMail')
        .post({
          message,
          saveToSentItems: true,
        })

      this.logger.log('Email envoyé via Microsoft Graph API')

      return {
        success: true,
        messageId: response.id || 'graph-' + Date.now(),
        provider: this.getProviderName(),
        timestamp: new Date(),
        metadata: response,
      }
    } catch (error) {
      throw error
    }
  }

  private async sendViaSMTP(options: EmailOptions): Promise<EmailResult> {
    try {
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

      this.logger.log(`Email envoyé via Microsoft SMTP: ${result.messageId}`)

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
      throw error
    }
  }

  async sendBulkEmails(options: BulkEmailOptions): Promise<BulkEmailResult> {
    const startTime = Date.now()
    const results: EmailResult[] = []
    let totalSent = 0
    let totalFailed = 0

    const batchSize = options.batchSize || 10
    const delayBetweenBatches = options.delayBetweenBatches || 2000 // Microsoft a des limites plus strictes

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
      // Tester la connexion Graph API
      if (this.graphClient) {
        await this.graphClient.api('/me').get()
        this.logger.log('Connexion Microsoft Graph API vérifiée avec succès')
        return true
      }

      // Tester la connexion SMTP
      if (this.transporter) {
        await this.transporter.verify()
        this.logger.log('Connexion Microsoft SMTP vérifiée avec succès')
        return true
      }

      return false
    } catch (error) {
      this.logger.error('Erreur de connexion Microsoft:', error)
      return false
    }
  }

  getProviderName(): string {
    return 'Microsoft Outlook/Office365'
  }

  async refreshToken(): Promise<void> {
    try {
      // Avec Azure Identity, le refresh est géré automatiquement
      const tokenResponse = await this.credential.getToken('https://graph.microsoft.com/.default')
      
      if (tokenResponse?.token && this.config.oauth2) {
        this.config.oauth2.accessToken = tokenResponse.token
        this.config.oauth2.tokenExpiry = tokenResponse.expiresOnTimestamp 
          ? new Date(tokenResponse.expiresOnTimestamp) 
          : undefined

        this.logger.log('Token Microsoft actualisé avec succès')
      }
    } catch (error) {
      this.logger.error('Erreur lors du rafraîchissement du token Microsoft:', error)
      throw error
    }
  }

  private formatRecipients(recipients: string | string[]) {
    const addresses = Array.isArray(recipients) ? recipients : [recipients]
    return addresses.map(address => ({
      emailAddress: { address },
    }))
  }

  private async formatAttachments(attachments?: EmailOptions['attachments']) {
    if (!attachments || attachments.length === 0) {
      return []
    }

    return await Promise.all(
      attachments.map(async (att) => {
        let contentBytes: string = ''

        if (att.content) {
          if (Buffer.isBuffer(att.content)) {
            contentBytes = att.content.toString('base64')
          } else {
            contentBytes = Buffer.from(att.content).toString('base64')
          }
        } else if (att.path) {
          // Lire le fichier et le convertir en base64
          const fs = require('fs').promises
          const content = await fs.readFile(att.path)
          contentBytes = content.toString('base64')
        }

        return {
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: att.filename,
          contentType: att.contentType || 'application/octet-stream',
          contentBytes,
          contentId: att.cid,
        }
      })
    )
  }

  /**
   * Générer l'URL d'autorisation OAuth2 pour Microsoft
   */
  getAuthorizationUrl(): string {
    const tenantId = process.env.AZURE_TENANT_ID || 'common'
    const redirectUri = this.config.oauth2?.redirectUri || 'http://localhost:3000/api/auth/microsoft/callback'
    
    const params = new URLSearchParams({
      client_id: this.config.oauth2?.clientId || '',
      response_type: 'code',
      redirect_uri: redirectUri,
      response_mode: 'query',
      scope: 'openid profile email offline_access Mail.Send Mail.ReadWrite',
      state: Buffer.from(JSON.stringify({ provider: 'microsoft' })).toString('base64'),
    })

    return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`
  }

  /**
   * Échanger le code d'autorisation contre des tokens
   */
  async handleAuthorizationCode(code: string): Promise<any> {
    const tenantId = process.env.AZURE_TENANT_ID || 'common'
    const redirectUri = this.config.oauth2?.redirectUri || 'http://localhost:3000/api/auth/microsoft/callback'
    
    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
    
    const params = new URLSearchParams({
      client_id: this.config.oauth2?.clientId || '',
      client_secret: this.config.oauth2?.clientSecret || '',
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    })

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const tokens = await response.json() as any

    if (!response.ok) {
      throw new Error(tokens.error_description || 'Erreur lors de l\'échange du code')
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: Date.now() + (tokens.expires_in * 1000),
      idToken: tokens.id_token,
    }
  }
}