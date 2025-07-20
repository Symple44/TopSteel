import { Injectable, Logger } from '@nestjs/common'
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
export class SmtpEmailProvider implements EmailProvider {
  private readonly logger = new Logger(SmtpEmailProvider.name)
  private transporter: nodemailer.Transporter
  private config: EmailConfiguration

  constructor() {}

  async initialize(config: EmailConfiguration): Promise<void> {
    this.config = config
    
    if (!config.smtp) {
      throw new Error('Configuration SMTP manquante')
    }

    // Créer le transporter Nodemailer
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.auth.user,
        pass: config.smtp.auth.pass,
      },
      tls: config.smtp.tls || {
        rejectUnauthorized: true,
      },
      pool: true, // Utiliser un pool de connexions
      maxConnections: 5,
      maxMessages: 100,
    } as any)

    // Vérifier la connexion
    await this.validateConnection()
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
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
        headers: {
          ...options.headers,
          'X-Mailer': 'TopSteel ERP Email Service',
          'X-Priority': '3',
        },
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          path: att.path,
          contentType: att.contentType,
          encoding: att.encoding,
          cid: att.cid,
        })),
        // Ajouter des tags personnalisés si supporté
        list: options.tags ? {
          unsubscribe: options.metadata?.unsubscribeUrl,
        } : undefined,
      }

      const result = await this.transporter.sendMail(mailOptions)

      this.logger.log(`Email envoyé via SMTP: ${result.messageId}`)

      return {
        success: true,
        messageId: result.messageId,
        provider: this.getProviderName(),
        timestamp: new Date(),
        metadata: {
          response: result.response,
          accepted: result.accepted,
          rejected: result.rejected,
          pending: result.pending,
          messageSize: result.messageSize,
        },
      }
    } catch (error) {
      this.logger.error('Erreur lors de l\'envoi SMTP:', error)
      
      // Analyser l'erreur pour fournir plus de détails
      let errorMessage = (error as any).message || 'Erreur inconnue'
      
      if ((error as any).code === 'ECONNREFUSED') {
        errorMessage = 'Impossible de se connecter au serveur SMTP'
      } else if ((error as any).code === 'EAUTH') {
        errorMessage = 'Échec de l\'authentification SMTP'
      } else if ((error as any).responseCode === 550) {
        errorMessage = 'Adresse email rejetée par le serveur'
      }
      
      return {
        success: false,
        error: errorMessage,
        provider: this.getProviderName(),
        timestamp: new Date(),
        metadata: {
          code: (error as any).code,
          responseCode: (error as any).responseCode,
          command: (error as any).command,
        },
      }
    }
  }

  async sendBulkEmails(options: BulkEmailOptions): Promise<BulkEmailResult> {
    const startTime = Date.now()
    const results: EmailResult[] = []
    let totalSent = 0
    let totalFailed = 0

    const batchSize = options.batchSize || 20
    const delayBetweenBatches = options.delayBetweenBatches || 500

    // Respecter les limites de taux configurées
    const rateLimit = this.config.rateLimit?.maxPerMinute || 60
    const delayBetweenEmails = 60000 / rateLimit

    for (let i = 0; i < options.emails.length; i += batchSize) {
      const batch = options.emails.slice(i, i + batchSize)
      
      // Envoyer les emails du batch avec un délai entre chaque
      for (const email of batch) {
        const result = await this.sendEmail(email)
        results.push(result)
        
        if (result.success) {
          totalSent++
        } else {
          totalFailed++
        }

        // Attendre entre chaque email pour respecter le rate limit
        if (delayBetweenEmails > 0) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenEmails))
        }
      }

      // Attendre entre les batches
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
      this.logger.log('Connexion SMTP vérifiée avec succès')
      
      // Vérifier aussi en envoyant un NOOP
      await new Promise((resolve, reject) => {
        this.transporter.sendMail({
          from: this.config.defaultFrom,
          to: this.config.defaultFrom,
          subject: 'Test de connexion SMTP',
          text: 'Test',
          envelope: {
            from: this.config.defaultFrom,
            to: [],
          },
        }, (error) => {
          if (error && error.message !== 'No recipients defined') {
            reject(error)
          } else {
            resolve(true)
          }
        })
      })
      
      return true
    } catch (error) {
      this.logger.error('Erreur de connexion SMTP:', error)
      return false
    }
  }

  getProviderName(): string {
    return `SMTP (${this.config.smtp?.host || 'unknown'})`
  }

  /**
   * Obtenir les informations de configuration SMTP pour différents fournisseurs
   */
  static getProviderConfig(provider: string): Partial<EmailConfiguration['smtp']> {
    const configs = {
      gmail: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
      },
      outlook: {
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
      },
      office365: {
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
      },
      yahoo: {
        host: 'smtp.mail.yahoo.com',
        port: 587,
        secure: false,
      },
      sendgrid: {
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
      },
      mailgun: {
        host: 'smtp.mailgun.org',
        port: 587,
        secure: false,
      },
      sendinblue: {
        host: 'smtp-relay.sendinblue.com',
        port: 587,
        secure: false,
      },
      ovh: {
        host: 'ssl0.ovh.net',
        port: 465,
        secure: true,
      },
    }

    return configs[provider.toLowerCase()] || {}
  }

  /**
   * Fermer la connexion SMTP
   */
  async close(): Promise<void> {
    if (this.transporter) {
      this.transporter.close()
      this.logger.log('Connexion SMTP fermée')
    }
  }
}