import * as fs from 'node:fs'
import * as path from 'node:path'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as handlebars from 'handlebars'
import { createTransport, type Transporter } from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  template?: string
  context?: Record<string, unknown>
  html?: string
  text?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private transporter!: Transporter
  private templatesPath: string
  private compiledTemplates = new Map<string, HandlebarsTemplateDelegate>()

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter()
    this.templatesPath = path.join(process.cwd(), 'apps', 'api', 'templates')
    this.precompileTemplates()
  }

  private initializeTransporter(): void {
    const smtpConfig: SMTPTransport.Options = {
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
      // Security settings
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2',
      },
    }

    // Validate required SMTP configuration
    const host = this.configService.get<string>('SMTP_HOST')
    const user = this.configService.get<string>('SMTP_USER')
    const pass = this.configService.get<string>('SMTP_PASSWORD')

    if (!host || !user || !pass) {
      this.logger.warn('SMTP configuration incomplete - email sending disabled')
      return
    }

    try {
      this.transporter = createTransport(smtpConfig)

      // Verify connection
      this.transporter.verify((error, _success) => {
        if (error) {
          this.logger.error('SMTP connection failed:', error)
        } else {
          this.logger.log('SMTP server connection verified')
        }
      })
    } catch (error) {
      this.logger.error('Failed to initialize email transporter:', error)
    }
  }

  private precompileTemplates(): void {
    try {
      const templatesDir = path.join(this.templatesPath, 'marketplace')

      if (!fs.existsSync(templatesDir)) {
        this.logger.warn(`Templates directory not found: ${templatesDir}`)
        return
      }

      const templateFiles = fs.readdirSync(templatesDir).filter((file) => file.endsWith('.hbs'))

      for (const file of templateFiles) {
        const templatePath = path.join(templatesDir, file)
        const templateContent = fs.readFileSync(templatePath, 'utf-8')
        const templateName = path.basename(file, '.hbs')

        this.compiledTemplates.set(templateName, handlebars.compile(templateContent))
        this.logger.log(`Compiled email template: ${templateName}`)
      }
    } catch (error) {
      this.logger.error('Failed to precompile email templates:', error)
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    if (!this.transporter) {
      return {
        success: false,
        error: 'Email transporter not configured',
      }
    }

    try {
      let htmlContent = options.html
      const textContent = options.text

      // Process template if specified
      if (options.template) {
        const compiledTemplate = this.compiledTemplates.get(options.template)

        if (!compiledTemplate) {
          return {
            success: false,
            error: `Template not found: ${options.template}`,
          }
        }

        htmlContent = compiledTemplate(options.context || {})
      }

      const emailOptions = {
        from: this.configService.get<string>('EMAIL_FROM', 'TopSteel ERP <noreply@topsteel.com>'),
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: htmlContent,
        text: textContent,
        attachments: options.attachments,
      }

      const result = await this.transporter.sendMail(emailOptions)

      this.logger.log(`Email sent successfully: ${result.messageId}`)

      return {
        success: true,
        messageId: result.messageId,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : undefined
      this.logger.error(`Failed to send email: ${errorMessage}`, errorStack)

      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  async sendWelcomeEmail(
    email: string,
    name: string,
    verificationToken: string
  ): Promise<EmailResult> {
    const verificationUrl = `${this.configService.get<string>('APP_URL')}/verify-email?token=${verificationToken}`

    return this.sendEmail({
      to: email,
      subject: 'Bienvenue sur TopSteel Marketplace',
      template: 'welcome',
      context: {
        customerName: name,
        verificationUrl,
        year: new Date().getFullYear(),
      },
    })
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string
  ): Promise<EmailResult> {
    const resetUrl = `${this.configService.get<string>('APP_URL')}/reset-password?token=${resetToken}`

    return this.sendEmail({
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      template: 'password-reset',
      context: {
        customerName: name,
        resetUrl,
        year: new Date().getFullYear(),
      },
    })
  }

  async sendOrderConfirmationEmail(
    email: string,
    customerName: string,
    orderNumber: string,
    orderDetails: Record<string, unknown>
  ): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: `Commande confirmée #${orderNumber}`,
      template: 'order-confirmed',
      context: {
        customerName,
        orderNumber,
        orderDetails,
        year: new Date().getFullYear(),
      },
    })
  }

  async sendPaymentConfirmationEmail(
    email: string,
    customerName: string,
    orderNumber: string,
    amount: number,
    currency: string
  ): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: `Paiement confirmé pour la commande #${orderNumber}`,
      template: 'payment-confirmed',
      context: {
        customerName,
        orderNumber,
        amount: (amount / 100).toFixed(2), // Convert cents to euros
        currency: currency.toUpperCase(),
        year: new Date().getFullYear(),
      },
    })
  }

  async sendShippingNotificationEmail(
    email: string,
    customerName: string,
    orderNumber: string,
    trackingNumber: string,
    carrierName: string
  ): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      subject: `Votre commande #${orderNumber} a été expédiée`,
      template: 'order-shipped',
      context: {
        customerName,
        orderNumber,
        trackingNumber,
        carrierName,
        year: new Date().getFullYear(),
      },
    })
  }

  /**
   * Health check for email service
   */
  async isHealthy(): Promise<boolean> {
    if (!this.transporter) {
      return false
    }

    try {
      await this.transporter.verify()
      return true
    } catch (error) {
      this.logger.error('Email service health check failed:', error)
      return false
    }
  }
}
