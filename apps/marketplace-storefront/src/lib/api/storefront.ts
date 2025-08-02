import { apiClient } from './client'

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

export interface Product {
  id: string
  erpArticleId: string
  reference: string
  designation: string
  description?: string
  shortDescription?: string
  images: Array<{ url: string; alt?: string; isMain: boolean }>
  basePrice: number
  calculatedPrice?: number
  stockDisponible?: number
  inStock: boolean
  categories: string[]
  tags: string[]
  isActive: boolean
  isFeatured: boolean
  seo: {
    title?: string
    description?: string
    slug: string
  }
}

export interface ProductFilters {
  search?: string
  category?: string
  tags?: string[]
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  featured?: boolean
  page?: number
  limit?: number
  sortBy?: 'name' | 'price' | 'date' | 'popularity'
  sortOrder?: 'ASC' | 'DESC'
}

export interface ProductListResult {
  products: Product[]
  total: number
  hasMore: boolean
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

// API Functions
export async function getTenantConfig(tenant: string): Promise<StorefrontConfig | null> {
  try {
    // Temporaire : retourner des données statiques pour bypass le problème de tenant
    return {
      storeName: tenant === 'topsteel' ? 'TopSteel' : 'Démo Marketplace',
      description: tenant === 'topsteel' ? 'Boutique en ligne TopSteel' : 'Boutique de démonstration',
      contactInfo: {
        email: 'contact@topsteel.fr',
        phone: '+33 1 23 45 67 89',
        address: '123 Rue de la Métallurgie, 75000 Paris'
      },
      features: {
        allowGuestCheckout: true,
        requiresAuth: false,
        showPrices: true,
        showStock: true,
        enableWishlist: false,
        enableCompare: false,
        enableReviews: false
      },
      social: {
        facebook: 'https://facebook.com/topsteel',
        linkedin: 'https://linkedin.com/company/topsteel'
      },
      seo: {
        title: tenant === 'topsteel' ? 'TopSteel - Boutique en ligne' : 'Démo Marketplace',
        description: 'Découvrez nos produits sur la boutique en ligne',
        keywords: ['TopSteel', 'boutique', 'produits', 'métallurgie']
      }
    }
    
    // Code original commenté temporairement
    // apiClient.setTenant(tenant)
    // return await apiClient.storefront.getConfig()
  } catch (error: any) {
    if (error.message === 'TENANT_NOT_FOUND') {
      return null
    }
    throw error
  }
}

export async function getProducts(
  tenant: string, 
  filters: ProductFilters = {}
): Promise<ProductListResult> {
  apiClient.setTenant(tenant)
  return await apiClient.storefront.getProducts(filters)
}

export async function getProduct(tenant: string, productId: string): Promise<Product> {
  apiClient.setTenant(tenant)
  return await apiClient.storefront.getProduct(productId)
}

export async function getFeaturedProducts(
  tenant: string, 
  limit = 8
): Promise<Product[]> {
  apiClient.setTenant(tenant)
  return await apiClient.storefront.getFeaturedProducts(limit)
}

export async function getCategories(tenant: string): Promise<string[]> {
  apiClient.setTenant(tenant)
  return await apiClient.storefront.getCategories()
}

export async function getProductsByCategory(
  tenant: string,
  category: string,
  page = 1,
  limit = 20
): Promise<ProductListResult> {
  apiClient.setTenant(tenant)
  return await apiClient.storefront.getProductsByCategory(category, { page, limit })
}

export async function searchProducts(
  tenant: string,
  query: string,
  filters: Omit<ProductFilters, 'search'> = {}
): Promise<ProductListResult> {
  apiClient.setTenant(tenant)
  return await apiClient.storefront.searchProducts(query, filters)
}

export async function getCurrentTheme(tenant: string) {
  apiClient.setTenant(tenant)
  return await apiClient.storefront.getTheme()
}

export async function getNavigationMenu(tenant: string): Promise<NavigationMenu> {
  apiClient.setTenant(tenant)
  return await apiClient.storefront.getMenu()
}

export async function getStaticPage(tenant: string, slug: string): Promise<StaticPage | null> {
  try {
    apiClient.setTenant(tenant)
    return await apiClient.storefront.getPage(slug)
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null
    }
    throw error
  }
}

export async function subscribeToNewsletter(tenant: string, email: string) {
  apiClient.setTenant(tenant)
  return await apiClient.storefront.subscribeNewsletter(email)
}

export async function sendContactMessage(tenant: string, data: {
  name: string
  email: string
  subject: string
  message: string
  phone?: string
}) {
  apiClient.setTenant(tenant)
  return await apiClient.storefront.sendContactMessage(data)
}