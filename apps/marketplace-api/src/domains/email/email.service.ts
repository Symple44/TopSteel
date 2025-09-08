import * as crypto from 'node:crypto'
import { Injectable } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { createTransport, type Transporter } from 'nodemailer'
import type { Repository } from 'typeorm'
import { EmailLog } from './entities/email-log.entity'

export interface EmailOptions {
  to: string
  subject: string
  html?: string
  text?: string
  template?: string
  templateData?: Record<string, unknown>
  attachments?: Array<{
    filename: string
    content?: Buffer | string
    path?: string
  }>
}

export interface TokenEmailData {
  email: string
  token: string
  expiresAt: Date
  type: 'password-reset' | 'email-verification' | 'account-activation'
  userId?: string
  metadata?: Record<string, unknown>
}

@Injectable()
export class EmailService {
  private transporter: Transporter
  private readonly baseUrl: string
  private readonly fromEmail: string
  private readonly fromName: string

  constructor(
    private configService: ConfigService,
    @InjectRepository(EmailLog, 'marketplace')
    private emailLogRepo: Repository<EmailLog>
  ) {
    // Configuration SMTP
    this.transporter = createTransport({
      host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: this.configService.get('SMTP_SECURE', false),
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    })

    this.baseUrl = this.configService.get('MARKETPLACE_URL', 'https://marketplace.topsteel.fr')
    this.fromEmail = this.configService.get('SMTP_FROM_EMAIL', 'noreply@topsteel.fr')
    this.fromName = this.configService.get('SMTP_FROM_NAME', 'TopSteel Marketplace')
  }

  /**
   * Génère un token sécurisé
   */
  generateSecureToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  /**
   * Hash un token pour le stockage sécurisé
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(data: TokenEmailData): Promise<void> {
    const resetUrl = `${this.baseUrl}/reset-password?token=${data.token}`

    const html = this.getPasswordResetTemplate({
      resetUrl,
      expiresIn: this.getExpirationTime(data.expiresAt),
      userEmail: data.email,
    })

    await this.sendEmail({
      to: data.email,
      subject: 'Réinitialisation de votre mot de passe - TopSteel',
      html,
    })

    // Logger l'envoi
    await this.logEmail({
      recipient: data.email,
      type: 'password-reset',
      tokenHash: this.hashToken(data.token),
      expiresAt: data.expiresAt,
      metadata: data.metadata,
    })
  }

  /**
   * Envoie un email de vérification
   */
  async sendVerificationEmail(data: TokenEmailData): Promise<void> {
    const verifyUrl = `${this.baseUrl}/verify-email?token=${data.token}`

    const html = this.getVerificationTemplate({
      verifyUrl,
      expiresIn: this.getExpirationTime(data.expiresAt),
      userEmail: data.email,
    })

    await this.sendEmail({
      to: data.email,
      subject: 'Vérifiez votre adresse email - TopSteel',
      html,
    })

    // Logger l'envoi
    await this.logEmail({
      recipient: data.email,
      type: 'email-verification',
      tokenHash: this.hashToken(data.token),
      expiresAt: data.expiresAt,
      metadata: data.metadata,
    })
  }

  /**
   * Envoie un email d'activation de compte
   */
  async sendAccountActivationEmail(data: TokenEmailData): Promise<void> {
    const activationUrl = `${this.baseUrl}/activate-account?token=${data.token}`

    const html = this.getActivationTemplate({
      activationUrl,
      expiresIn: this.getExpirationTime(data.expiresAt),
      userEmail: data.email,
    })

    await this.sendEmail({
      to: data.email,
      subject: 'Activez votre compte - TopSteel',
      html,
    })

    // Logger l'envoi
    await this.logEmail({
      recipient: data.email,
      type: 'account-activation',
      tokenHash: this.hashToken(data.token),
      expiresAt: data.expiresAt,
      metadata: data.metadata,
    })
  }

  /**
   * Envoie un email de confirmation de commande
   */
  async sendOrderConfirmationEmail(
    email: string,
    orderData: {
      orderId: string
      orderNumber: string
      totalAmount: number
      currency: string
      items: Array<{ name: string; quantity: number; price: number }>
      shippingAddress?: any
      billingAddress?: any
    }
  ): Promise<void> {
    const html = this.getOrderConfirmationTemplate(orderData)

    await this.sendEmail({
      to: email,
      subject: `Confirmation de commande #${orderData.orderNumber} - TopSteel`,
      html,
    })

    // Logger l'envoi
    await this.logEmail({
      recipient: email,
      type: 'order-confirmation',
      metadata: { orderId: orderData.orderId },
    })
  }

  /**
   * Envoie un email générique
   */
  public async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      })
    } catch (_error) {
      throw new Error('Failed to send email')
    }
  }

  /**
   * Enregistre l'envoi d'un email dans les logs
   */
  private async logEmail(data: {
    recipient: string
    type: string
    tokenHash?: string
    expiresAt?: Date
    metadata?: Record<string, unknown>
  }): Promise<void> {
    try {
      const log = this.emailLogRepo.create({
        recipient: data.recipient,
        type: data.type,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        metadata: data.metadata || {},
        sentAt: new Date(),
      })

      await this.emailLogRepo.save(log)
    } catch (_error) {}
  }

  /**
   * Calcule le temps restant avant expiration
   */
  private getExpirationTime(expiresAt: Date): string {
    const now = new Date()
    const diff = expiresAt.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours} heure${hours > 1 ? 's' : ''}`
    }
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  }

  /**
   * Template pour l'email de réinitialisation de mot de passe
   */
  private getPasswordResetTemplate(data: {
    resetUrl: string
    expiresIn: string
    userEmail: string
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Réinitialisation de mot de passe</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; margin: 10px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Réinitialisation de mot de passe</h1>
          </div>
          <div class="content">
            <p>Bonjour,</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte TopSteel Marketplace.</p>
            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.resetUrl}" class="button">Réinitialiser mon mot de passe</a>
            </p>
            <div class="warning">
              <strong>⚠️ Important :</strong> Ce lien expirera dans ${data.expiresIn}.
            </div>
            <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.</p>
            <p>Pour des raisons de sécurité, ce lien ne peut être utilisé qu'une seule fois.</p>
            <hr style="margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
              <a href="${data.resetUrl}" style="color: #2563eb;">${data.resetUrl}</a>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} TopSteel. Tous droits réservés.</p>
            <p>Cet email a été envoyé à ${data.userEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Template pour l'email de vérification
   */
  private getVerificationTemplate(data: {
    verifyUrl: string
    expiresIn: string
    userEmail: string
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Vérification d'email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 4px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Vérifiez votre adresse email</h1>
          </div>
          <div class="content">
            <p>Bienvenue sur TopSteel Marketplace !</p>
            <p>Pour finaliser votre inscription, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.verifyUrl}" class="button">Vérifier mon email</a>
            </p>
            <p>Ce lien de vérification expirera dans ${data.expiresIn}.</p>
            <hr style="margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
              <a href="${data.verifyUrl}" style="color: #10b981;">${data.verifyUrl}</a>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} TopSteel. Tous droits réservés.</p>
            <p>Cet email a été envoyé à ${data.userEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Template pour l'email d'activation de compte
   */
  private getActivationTemplate(data: {
    activationUrl: string
    expiresIn: string
    userEmail: string
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Activation de compte</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #f59e0b; color: white; text-decoration: none; border-radius: 4px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Activez votre compte</h1>
          </div>
          <div class="content">
            <p>Bonjour,</p>
            <p>Votre compte TopSteel Marketplace a été créé avec succès !</p>
            <p>Pour activer votre compte et définir votre mot de passe, cliquez sur le bouton ci-dessous :</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.activationUrl}" class="button">Activer mon compte</a>
            </p>
            <p>Ce lien d'activation expirera dans ${data.expiresIn}.</p>
            <hr style="margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
              <a href="${data.activationUrl}" style="color: #f59e0b;">${data.activationUrl}</a>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} TopSteel. Tous droits réservés.</p>
            <p>Cet email a été envoyé à ${data.userEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Template pour la confirmation de commande
   */
  private getOrderConfirmationTemplate(orderData: any): string {
    const itemsHtml = orderData.items
      .map(
        (item: any) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${item.price.toFixed(2)} ${orderData.currency}</td>
        </tr>
      `
      )
      .join('')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Confirmation de commande</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .order-details { background: white; padding: 20px; border-radius: 4px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Commande confirmée !</h1>
          </div>
          <div class="content">
            <p>Merci pour votre commande !</p>
            <p>Nous avons bien reçu votre commande <strong>#${orderData.orderNumber}</strong>.</p>
            
            <div class="order-details">
              <h3>Détails de la commande</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr>
                    <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: left;">Article</th>
                    <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: center;">Quantité</th>
                    <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: right;">Prix</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 8px; text-align: right;"><strong>Total :</strong></td>
                    <td style="padding: 8px; text-align: right;"><strong>${orderData.totalAmount.toFixed(2)} ${orderData.currency}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <p>Vous recevrez un email de confirmation lorsque votre commande sera expédiée.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} TopSteel. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}
