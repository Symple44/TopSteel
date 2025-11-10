import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Transporter } from 'nodemailer'
import * as nodemailer from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'

export interface NotificationConfig {
  email?: {
    enabled: boolean
    smtp: {
      host: string
      port: number
      secure: boolean
      auth: {
        user: string
        pass: string
      }
    }
    from: string
    recipients: string[]
  }
  slack?: {
    enabled: boolean
    webhookUrl: string
    channel?: string
    username?: string
  }
  webhook?: {
    enabled: boolean
    url: string
    headers?: Record<string, string>
    method?: 'POST' | 'PUT'
  }
}

export interface NotificationPayload {
  type: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name)
  private emailTransporter: Transporter<SMTPTransport.SentMessageInfo> | null = null
  private config: NotificationConfig

  constructor(private readonly configService: ConfigService) {
    this.config = this.loadConfiguration()
    this.initializeEmailTransporter()
  }

  private loadConfiguration(): NotificationConfig {
    return {
      email: {
        enabled: this.configService.get('NOTIFICATION_EMAIL_ENABLED', 'false') === 'true',
        smtp: {
          host: this.configService.get('SMTP_HOST', 'localhost'),
          port: parseInt(this.configService.get('SMTP_PORT', '587'), 10),
          secure: this.configService.get('SMTP_SECURE', 'false') === 'true',
          auth: {
            user: this.configService.get('SMTP_USER', ''),
            pass: this.configService.get('SMTP_PASS', ''),
          },
        },
        from: this.configService.get('SMTP_FROM', 'noreply@topsteel.com'),
        recipients: this.configService
          .get('NOTIFICATION_RECIPIENTS', '')
          .split(',')
          .filter(Boolean),
      },
      slack: {
        enabled: this.configService.get('NOTIFICATION_SLACK_ENABLED', 'false') === 'true',
        webhookUrl: this.configService.get('SLACK_WEBHOOK_URL', ''),
        channel: this.configService.get('SLACK_CHANNEL'),
        username: this.configService.get('SLACK_USERNAME', 'TopSteel Bot'),
      },
      webhook: {
        enabled: this.configService.get('NOTIFICATION_WEBHOOK_ENABLED', 'false') === 'true',
        url: this.configService.get('WEBHOOK_URL', ''),
        headers: this.configService.get('WEBHOOK_HEADERS')
          ? JSON.parse(this.configService.get('WEBHOOK_HEADERS', '{}'))
          : {},
        method: this.configService.get('WEBHOOK_METHOD', 'POST') as 'POST' | 'PUT',
      },
    }
  }

  private initializeEmailTransporter(): void {
    if (this.config.email?.enabled && this.config.email.smtp.host) {
      try {
        this.emailTransporter = nodemailer.createTransport({
          host: this.config.email.smtp.host,
          port: this.config.email.smtp.port,
          secure: this.config.email.smtp.secure,
          auth: this.config.email.smtp.auth,
        })

        // Verify transporter configuration
        this.emailTransporter.verify((error) => {
          if (error) {
            this.logger.warn(`Email transporter verification failed: ${error.message}`)
            this.emailTransporter = null
          } else {
            this.logger.log('Email notification system ready')
          }
        })
      } catch (error) {
        this.logger.error('Failed to initialize email transporter:', error)
        this.emailTransporter = null
      }
    }
  }

  /**
   * Send notification through all configured channels
   */
  async sendNotification(payload: NotificationPayload): Promise<void> {
    const promises: Promise<void>[] = []

    if (this.config.email?.enabled) {
      promises.push(this.sendEmailNotification(payload))
    }

    if (this.config.slack?.enabled) {
      promises.push(this.sendSlackNotification(payload))
    }

    if (this.config.webhook?.enabled) {
      promises.push(this.sendWebhookNotification(payload))
    }

    if (promises.length === 0) {
      this.logger.debug('No notification channels configured')
      return
    }

    await Promise.allSettled(promises)
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(payload: NotificationPayload): Promise<void> {
    if (!this.emailTransporter || !this.config.email?.recipients?.length) {
      this.logger.debug('Email notification skipped: not configured')
      return
    }

    try {
      const html = this.formatEmailContent(payload)

      await this.emailTransporter.sendMail({
        from: this.config.email.from,
        to: this.config.email.recipients.join(','),
        subject: `[${payload.severity.toUpperCase()}] ${payload.title}`,
        html,
        text: payload.message,
      })

      this.logger.debug('Email notification sent successfully')
    } catch (error) {
      this.logger.error('Failed to send email notification:', error)
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(payload: NotificationPayload): Promise<void> {
    if (!this.config.slack?.webhookUrl) {
      this.logger.debug('Slack notification skipped: webhook URL not configured')
      return
    }

    try {
      const color = this.getSeverityColor(payload.severity)
      const slackPayload = {
        channel: this.config.slack.channel,
        username: this.config.slack.username,
        attachments: [
          {
            color,
            title: payload.title,
            text: payload.message,
            fields: payload.metadata
              ? Object.entries(payload.metadata).map(([key, value]) => ({
                  title: key,
                  value: String(value),
                  short: true,
                }))
              : [],
            footer: 'TopSteel Notification System',
            ts: Math.floor(payload.timestamp.getTime() / 1000),
          },
        ],
      }

      const response = await fetch(this.config.slack.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slackPayload),
      })

      if (!response.ok) {
        throw new Error(`Slack API returned ${response.status}: ${await response.text()}`)
      }

      this.logger.debug('Slack notification sent successfully')
    } catch (error) {
      this.logger.error('Failed to send Slack notification:', error)
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(payload: NotificationPayload): Promise<void> {
    if (!this.config.webhook?.url) {
      this.logger.debug('Webhook notification skipped: URL not configured')
      return
    }

    try {
      const response = await fetch(this.config.webhook.url, {
        method: this.config.webhook.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.webhook.headers,
        },
        body: JSON.stringify({
          ...payload,
          timestamp: payload.timestamp.toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}: ${await response.text()}`)
      }

      this.logger.debug('Webhook notification sent successfully')
    } catch (error) {
      this.logger.error('Failed to send webhook notification:', error)
    }
  }

  /**
   * Format email content as HTML
   */
  private formatEmailContent(payload: NotificationPayload): string {
    const severityBadge = this.getSeverityBadge(payload.severity)
    const metadataHtml = payload.metadata
      ? Object.entries(payload.metadata)
          .map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`)
          .join('')
      : ''

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          h1 { color: #333; margin-top: 0; }
          .severity { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; margin-bottom: 10px; }
          .severity-info { background-color: #e3f2fd; color: #1976d2; }
          .severity-warning { background-color: #fff3e0; color: #f57c00; }
          .severity-error { background-color: #ffebee; color: #d32f2f; }
          .severity-critical { background-color: #b71c1c; color: white; }
          .message { background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .metadata { margin-top: 20px; }
          .metadata ul { list-style-type: none; padding: 0; }
          .metadata li { padding: 5px 0; border-bottom: 1px solid #eee; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${payload.title}</h1>
          ${severityBadge}
          <div class="message">
            <p>${payload.message.replace(/\n/g, '<br>')}</p>
          </div>
          ${
            metadataHtml
              ? `
            <div class="metadata">
              <h3>Additional Information:</h3>
              <ul>${metadataHtml}</ul>
            </div>
          `
              : ''
          }
          <div class="footer">
            <p>Sent by TopSteel Notification System</p>
            <p>${payload.timestamp.toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Get severity HTML badge
   */
  private getSeverityBadge(severity: NotificationPayload['severity']): string {
    return `<span class="severity severity-${severity}">${severity.toUpperCase()}</span>`
  }

  /**
   * Get severity color for Slack
   */
  private getSeverityColor(severity: NotificationPayload['severity']): string {
    switch (severity) {
      case 'info':
        return '#2196F3'
      case 'warning':
        return '#FF9800'
      case 'error':
        return '#F44336'
      case 'critical':
        return '#B71C1C'
      default:
        return '#9E9E9E'
    }
  }

  /**
   * Test notification system
   */
  async testNotification(): Promise<void> {
    await this.sendNotification({
      type: 'test',
      severity: 'info',
      title: 'Notification System Test',
      message:
        'This is a test notification from TopSteel. If you received this, the notification system is working correctly.',
      timestamp: new Date(),
      metadata: {
        environment: process.env.NODE_ENV || 'unknown',
        service: 'NotificationService',
        version: '1.0.0',
      },
    })
  }
}
