import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import { Societe } from '../../../shared/entities/erp/societe.entity'
import { MarketplaceTheme } from '../../themes/entities/marketplace-theme.entity'

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
    private themeRepo: Repository<MarketplaceTheme>
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
    _societeId: string,
    _email: string
  ): Promise<{ success: boolean; message: string }> {
    // TODO: Implémenter l'inscription newsletter
    // Pour l'instant, simuler le succès
    return {
      success: true,
      message: 'Inscription à la newsletter réussie',
    }
  }

  async sendContactMessage(
    _societeId: string,
    _message: {
      name: string
      email: string
      subject: string
      message: string
      phone?: string
    }
  ): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'Message envoyé avec succès',
    }
  }
}
