export enum SectionType {
  HERO = 'hero',
  BANNER = 'banner',
  PRODUCTS_GRID = 'products_grid',
  PRODUCTS_CAROUSEL = 'products_carousel',
  CATEGORIES = 'categories',
  TEXT_BLOCK = 'text_block',
  IMAGE_GALLERY = 'image_gallery',
  VIDEO = 'video',
  TESTIMONIALS = 'testimonials',
  FEATURES = 'features',
  CTA = 'cta',
  NEWSLETTER = 'newsletter',
  FAQ = 'faq',
  CONTACT_FORM = 'contact_form',
  MAP = 'map',
  CUSTOM_HTML = 'custom_html',
  SPACER = 'spacer',
  DIVIDER = 'divider',
  TABS = 'tabs',
  ACCORDION = 'accordion',
  COUNTDOWN = 'countdown',
  PRICING_TABLE = 'pricing_table',
  TEAM = 'team',
  BRANDS = 'brands',
  BLOG_POSTS = 'blog_posts',
  STATISTICS = 'statistics',
}

export interface SectionStyles {
  backgroundColor?: string
  backgroundImage?: string
  backgroundPosition?: string
  backgroundSize?: string
  padding?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
  margin?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
  border?: {
    width?: string
    style?: string
    color?: string
    radius?: string
  }
  customCSS?: string
  animation?: {
    type?: string
    duration?: string
    delay?: string
  }
}

export interface SectionSettings {
  container?: 'full-width' | 'boxed' | 'custom'
  customClass?: string
  id?: string
  conditions?: {
    showOn?: string[]
    hideOn?: string[]
    userRole?: string[]
    dateRange?: {
      start?: Date
      end?: Date
    }
  }
}

export interface ResponsiveConfig {
  mobile?: {
    isVisible?: boolean
    content?: any
    styles?: Partial<SectionStyles>
  }
  tablet?: {
    isVisible?: boolean
    content?: any
    styles?: Partial<SectionStyles>
  }
  desktop?: {
    isVisible?: boolean
    content?: any
    styles?: Partial<SectionStyles>
  }
}

export interface BaseSection {
  id: string
  type: SectionType
  name: string
  order: number
  isVisible: boolean
  content: any
  styles: SectionStyles
  responsive: ResponsiveConfig
  settings: SectionSettings
}

export interface SectionProps<T = any> {
  section: BaseSection & { content: T }
  isEditing?: boolean
  onUpdate?: (content: T) => void
  onStyleUpdate?: (styles: SectionStyles) => void
}
