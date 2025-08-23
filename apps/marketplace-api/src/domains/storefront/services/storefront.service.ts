import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import { Societe } from '../../../shared/entities/erp/societe.entity'
import { EmailService } from '../../email/email.service'
import { MarketplaceTheme } from '../../themes/entities/marketplace-theme.entity'
import { NewsletterSubscription, SubscriptionStatus } from '../entities/newsletter-subscription.entity'

export interface StorefrontConfig {
  storeName: string
  description?: string
  logo?: string
  favicon?: string
  contactInfo: {
    email?: string
    phone?: string
    address?: string
  }
  features: {
    allowGuestCheckout: boolean
    requiresAuth: boolean
    showPrices: boolean
    showStock: boolean
    enableWishlist: boolean
    enableCompare: boolean
    enableReviews: boolean
  }
  social?: {
    facebook?: string
    twitter?: string
    linkedin?: string
    instagram?: string
  }
  seo: {
    title: string
    description: string
    keywords: string[]
  }
}

export interface NavigationMenu {
  items: Array<{
    id: string
    label: string
    url: string
    type: 'category' | 'page' | 'external'
    children?: NavigationMenu['items']
    isActive: boolean
    order: number
  }>
}

export interface StaticPage {
  id: string
  slug: string
  title: string
  content: string
  metaTitle?: string
  metaDescription?: string
  isPublished: boolean
  publishedAt?: Date
}

@Injectable()
export class StorefrontService {
  constructor(
    @InjectRepository(Societe, 'erpAuth')
    private societeRepo: Repository<Societe>,

    @InjectRepository(MarketplaceTheme, 'marketplace')
    private themeRepo: Repository<MarketplaceTheme>,

    @InjectRepository(NewsletterSubscription, 'marketplace')
    private newsletterRepo: Repository<NewsletterSubscription>,

    private emailService: EmailService
  ) {}

  async getStorefrontConfig(societeId: string): Promise<StorefrontConfig> {
    const societe = await this.societeRepo.findOne({
      where: { id: societeId },
    })

    if (!societe) {
      throw new Error('Société non trouvée')
    }

    const marketplaceConfig = societe.configuration?.marketplace || {}

    return {
      storeName: societe.nom,
      description: `Boutique en ligne ${societe.nom}`,
      logo: marketplaceConfig.logo,
      favicon: marketplaceConfig.favicon,
      contactInfo: {
        email: societe.email,
        phone: marketplaceConfig.phone,
        address: `${societe.adresse}, ${societe.codePostal} ${societe.ville}`,
      },
      features: {
        allowGuestCheckout: marketplaceConfig.allowGuestCheckout ?? true,
        requiresAuth: marketplaceConfig.requiresAuth ?? false,
        showPrices: marketplaceConfig.showPrices ?? true,
        showStock: marketplaceConfig.showStock ?? true,
        enableWishlist: marketplaceConfig.enableWishlist ?? false,
        enableCompare: marketplaceConfig.enableCompare ?? false,
        enableReviews: marketplaceConfig.enableReviews ?? false,
      },
      social: marketplaceConfig.social || {},
      seo: {
        title: `${societe.nom} - Boutique en ligne`,
        description: `Découvrez nos produits sur la boutique en ligne de ${societe.nom}`,
        keywords: [societe.nom, 'boutique', 'produits', 'métallurgie'],
      },
    }
  }

  async getCurrentTheme(societeId: string): Promise<MarketplaceTheme | null> {
    const theme = await this.themeRepo.findOne({
      where: { societeId, isActive: true },
    })

    if (!theme) {
      return this.getDefaultTheme(societeId)
    }

    return theme
  }

  private async getDefaultTheme(societeId: string): Promise<MarketplaceTheme> {
    // Retourner un thème par défaut
    const defaultTheme = this.themeRepo.create({
      societeId,
      name: 'Thème par défaut',
      version: '1.0.0',
      isActive: true,
      isDefault: true,
      colors: {
        primary: '#007bff',
        secondary: '#6c757d',
        accent: '#28a745',
        background: '#ffffff',
        surface: '#f8f9fa',
        text: {
          primary: '#212529',
          secondary: '#6c757d',
          disabled: '#adb5bd',
        },
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545',
        info: '#17a2b8',
      },
      typography: {
        fontFamily: {
          primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem',
        },
        fontWeight: {
          light: 300,
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700,
        },
        lineHeight: {
          tight: 1.25,
          normal: 1.5,
          relaxed: 1.75,
        },
      },
      layout: {
        containerMaxWidth: '1200px',
        headerHeight: '80px',
        footerHeight: 'auto',
        sidebarWidth: '280px',
        borderRadius: {
          sm: '0.25rem',
          md: '0.375rem',
          lg: '0.5rem',
          xl: '0.75rem',
        },
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          '2xl': '3rem',
        },
      },
      components: {
        buttons: {
          primary: {
            backgroundColor: '#007bff',
            color: '#ffffff',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
          },
          secondary: {
            backgroundColor: '#6c757d',
            color: '#ffffff',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
          },
          outline: {
            backgroundColor: 'transparent',
            color: '#007bff',
            border: '1px solid #007bff',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
          },
        },
        cards: {
          default: {
            backgroundColor: '#ffffff',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            padding: '1rem',
          },
          product: {
            backgroundColor: '#ffffff',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            padding: '1rem',
            transition: 'box-shadow 0.2s',
          },
        },
        forms: {
          input: {
            backgroundColor: '#ffffff',
            border: '1px solid #ced4da',
            borderRadius: '0.375rem',
            padding: '0.5rem 0.75rem',
          },
          select: {
            backgroundColor: '#ffffff',
            border: '1px solid #ced4da',
            borderRadius: '0.375rem',
            padding: '0.5rem 0.75rem',
          },
          checkbox: {
            accentColor: '#007bff',
          },
        },
        navigation: {
          header: {
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e9ecef',
            padding: '1rem 0',
          },
          menu: {
            backgroundColor: '#f8f9fa',
            padding: '0.5rem 0',
          },
          breadcrumb: {
            fontSize: '0.875rem',
            color: '#6c757d',
          },
        },
      },
      settings: {
        showBreadcrumbs: true,
        showSearchBar: true,
        showCart: true,
        showWishlist: false,
        showCompare: false,
        enableDarkMode: false,
        enableRTL: false,
        showProductReviews: false,
        showStockStatus: true,
        showProductCode: true,
      },
    })

    return await this.themeRepo.save(defaultTheme)
  }

  async getNavigationMenu(_societeId: string): Promise<NavigationMenu> {
    // Pour l'instant, retourner un menu par défaut
    // Plus tard, ceci sera configurable via l'interface admin
    return {
      items: [
        {
          id: '1',
          label: 'Accueil',
          url: '/',
          type: 'page',
          isActive: true,
          order: 1,
        },
        {
          id: '2',
          label: 'Produits',
          url: '/products',
          type: 'category',
          isActive: true,
          order: 2,
          children: [
            {
              id: '2.1',
              label: 'Tous les produits',
              url: '/products',
              type: 'category',
              isActive: true,
              order: 1,
            },
          ],
        },
        {
          id: '3',
          label: 'À propos',
          url: '/about',
          type: 'page',
          isActive: true,
          order: 3,
        },
        {
          id: '4',
          label: 'Contact',
          url: '/contact',
          type: 'page',
          isActive: true,
          order: 4,
        },
      ],
    }
  }

  async getPage(_societeId: string, slug: string): Promise<StaticPage | null> {
    // Pour l'instant, retourner des pages statiques par défaut
    const defaultPages: Record<string, StaticPage> = {
      about: {
        id: 'about',
        slug: 'about',
        title: 'À propos de nous',
        content: '<h1>À propos de nous</h1><p>Bienvenue sur notre boutique en ligne.</p>',
        metaTitle: 'À propos - Notre boutique',
        metaDescription: 'Découvrez notre histoire et nos valeurs.',
        isPublished: true,
        publishedAt: new Date(),
      },
      contact: {
        id: 'contact',
        slug: 'contact',
        title: 'Nous contacter',
        content:
          "<h1>Nous contacter</h1><p>N'hésitez pas à nous contacter pour toute question.</p>",
        metaTitle: 'Contact - Notre boutique',
        metaDescription: 'Contactez-nous pour toute question ou demande.',
        isPublished: true,
        publishedAt: new Date(),
      },
      legal: {
        id: 'legal',
        slug: 'legal',
        title: 'Mentions légales',
        content: '<h1>Mentions légales</h1><p>Informations légales de notre entreprise.</p>',
        metaTitle: 'Mentions légales',
        metaDescription: 'Mentions légales et informations sur notre entreprise.',
        isPublished: true,
        publishedAt: new Date(),
      },
      privacy: {
        id: 'privacy',
        slug: 'privacy',
        title: 'Politique de confidentialité',
        content: '<h1>Politique de confidentialité</h1><p>Comment nous protégeons vos données.</p>',
        metaTitle: 'Politique de confidentialité',
        metaDescription: 'Notre politique de protection des données personnelles.',
        isPublished: true,
        publishedAt: new Date(),
      },
    }

    return defaultPages[slug] || null
  }

  async subscribeNewsletter(
    societeId: string,
    email: string,
    data?: {
      firstName?: string
      lastName?: string
      preferences?: {
        categories?: string[]
        frequency?: 'daily' | 'weekly' | 'monthly'
        language?: string
      }
      source?: string
      ipAddress?: string
      userAgent?: string
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if subscription already exists
      let subscription = await this.newsletterRepo.findOne({
        where: { societeId, email: email.toLowerCase() },
      })

      if (subscription) {
        if (subscription.status === SubscriptionStatus.ACTIVE) {
          return {
            success: false,
            message: 'Cette adresse email est déjà inscrite à notre newsletter',
          }
        }
        
        // Reactivate if previously unsubscribed
        subscription.status = SubscriptionStatus.PENDING
        subscription.unsubscribedAt = null
        subscription.unsubscribeReason = null
        subscription.firstName = data?.firstName || subscription.firstName
        subscription.lastName = data?.lastName || subscription.lastName
        subscription.preferences = {
          ...subscription.preferences,
          ...data?.preferences,
        }
      } else {
        // Create new subscription
        subscription = this.newsletterRepo.create({
          societeId,
          email: email.toLowerCase(),
          firstName: data?.firstName,
          lastName: data?.lastName,
          status: SubscriptionStatus.PENDING,
          preferences: {
            categories: data?.preferences?.categories || [],
            frequency: data?.preferences?.frequency || 'weekly',
            language: data?.preferences?.language || 'fr',
            format: 'html',
          },
          ipAddress: data?.ipAddress,
          userAgent: data?.userAgent,
          source: data?.source || 'storefront',
          metadata: {
            emailsSentCount: 0,
            openCount: 0,
            clickCount: 0,
          },
        })
      }

      // Generate confirmation token
      const confirmationToken = subscription.generateConfirmationToken()
      await this.newsletterRepo.save(subscription)

      // Send confirmation email
      await this.sendNewsletterConfirmationEmail(subscription, confirmationToken)

      return {
        success: true,
        message: 'Un email de confirmation a été envoyé à votre adresse',
      }
    } catch (error) {
      console.error('Error subscribing to newsletter:', error)
      return {
        success: false,
        message: 'Une erreur est survenue lors de l\'inscription',
      }
    }
  }

  async sendContactMessage(
    societeId: string,
    messageData: {
      name: string
      email: string
      subject: string
      message: string
      phone?: string
      company?: string
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get company info for recipient email
      const societe = await this.societeRepo.findOne({
        where: { id: societeId },
      })

      if (!societe) {
        return {
          success: false,
          message: 'Entreprise non trouvée',
        }
      }

      // Send email to company
      const companyEmail = societe.email || (societe.configuration?.marketplace as any)?.contactEmail
      if (companyEmail) {
        await this.sendContactEmailToCompany({
          companyEmail,
          companyName: societe.nom,
          sender: messageData,
        })
      }

      // Send confirmation email to sender
      await this.sendContactConfirmationEmail({
        senderEmail: messageData.email,
        senderName: messageData.name,
        companyName: societe.nom,
        subject: messageData.subject,
      })

      return {
        success: true,
        message: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
      }
    } catch (error) {
      console.error('Error sending contact message:', error)
      return {
        success: false,
        message: 'Une erreur est survenue lors de l\'envoi du message',
      }
    }
  }

  // Newsletter confirmation methods
  private async sendNewsletterConfirmationEmail(
    subscription: NewsletterSubscription,
    token: string
  ): Promise<void> {
    const confirmationUrl = `${process.env.MARKETPLACE_URL || 'https://marketplace.topsteel.fr'}/newsletter/confirm?token=${token}`

    const html = this.getNewsletterConfirmationTemplate({
      email: subscription.email,
      firstName: subscription.firstName || subscription.email.split('@')[0],
      confirmationUrl,
    })

    await this.emailService.sendEmail({
      to: subscription.email,
      subject: 'Confirmez votre abonnement à la newsletter - TopSteel',
      html,
    })
  }

  private getNewsletterConfirmationTemplate(data: {
    email: string
    firstName: string
    confirmationUrl: string
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Confirmation d'abonnement newsletter</title>
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
            <h1>🎉 Confirmez votre abonnement</h1>
          </div>
          <div class="content">
            <p>Bonjour ${data.firstName},</p>
            <p>Merci de vous être inscrit(e) à notre newsletter ! Pour finaliser votre abonnement, veuillez cliquer sur le bouton ci-dessous :</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${data.confirmationUrl}" class="button">Confirmer mon abonnement</a>
            </p>
            <p>Une fois confirmé, vous recevrez nos dernières actualités, offres spéciales et nouveautés directement dans votre boîte email.</p>
            <hr style="margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br>
              <a href="${data.confirmationUrl}" style="color: #10b981;">${data.confirmationUrl}</a>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} TopSteel. Tous droits réservés.</p>
            <p>Cet email a été envoyé à ${data.email}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  // Contact message methods
  private async sendContactEmailToCompany(data: {
    companyEmail: string
    companyName: string
    sender: {
      name: string
      email: string
      subject: string
      message: string
      phone?: string
      company?: string
    }
  }): Promise<void> {
    const html = this.getContactEmailTemplate(data)

    await this.emailService.sendEmail({
      to: data.companyEmail,
      subject: `Nouveau message de contact: ${data.sender.subject}`,
      html,
    })
  }

  private async sendContactConfirmationEmail(data: {
    senderEmail: string
    senderName: string
    companyName: string
    subject: string
  }): Promise<void> {
    const html = this.getContactConfirmationTemplate(data)

    await this.emailService.sendEmail({
      to: data.senderEmail,
      subject: `Confirmation: Votre message a été envoyé à ${data.companyName}`,
      html,
    })
  }

  private getContactEmailTemplate(data: {
    companyName: string
    sender: {
      name: string
      email: string
      subject: string
      message: string
      phone?: string
      company?: string
    }
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Nouveau message de contact</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .info-box { background: white; padding: 15px; border-radius: 4px; margin: 15px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 Nouveau message de contact</h1>
          </div>
          <div class="content">
            <p>Bonjour ${data.companyName},</p>
            <p>Vous avez reçu un nouveau message via votre boutique en ligne :</p>
            
            <div class="info-box">
              <h3>Informations de l'expéditeur :</h3>
              <p><strong>Nom :</strong> ${data.sender.name}</p>
              <p><strong>Email :</strong> ${data.sender.email}</p>
              ${data.sender.phone ? `<p><strong>Téléphone :</strong> ${data.sender.phone}</p>` : ''}
              ${data.sender.company ? `<p><strong>Entreprise :</strong> ${data.sender.company}</p>` : ''}
            </div>
            
            <div class="info-box">
              <h3>Sujet :</h3>
              <p>${data.sender.subject}</p>
            </div>
            
            <div class="info-box">
              <h3>Message :</h3>
              <p>${data.sender.message.replace(/\n/g, '<br>')}</p>
            </div>
            
            <p>Vous pouvez répondre directement à cet email ou contacter le client à l'adresse : <a href="mailto:${data.sender.email}">${data.sender.email}</a></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} TopSteel. Tous droits réservés.</p>
            <p>Message reçu le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private getContactConfirmationTemplate(data: {
    senderName: string
    companyName: string
    subject: string
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Confirmation de votre message</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Message envoyé avec succès</h1>
          </div>
          <div class="content">
            <p>Bonjour ${data.senderName},</p>
            <p>Nous avons bien reçu votre message concernant : <strong>"${data.subject}"</strong></p>
            <p>Notre équipe de ${data.companyName} vous répondra dans les plus brefs délais, généralement sous 24 heures ouvrées.</p>
            <p>Merci de nous avoir contactés !</p>
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
