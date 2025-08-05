import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'

export interface ColorPalette {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: {
    primary: string
    secondary: string
    disabled: string
  }
  success: string
  warning: string
  error: string
  info: string
}

export interface Typography {
  fontFamily: {
    primary: string
    secondary?: string
  }
  fontSize: {
    xs: string
    sm: string
    base: string
    lg: string
    xl: string
    '2xl': string
    '3xl': string
    '4xl': string
  }
  fontWeight: {
    light: number
    normal: number
    medium: number
    semibold: number
    bold: number
  }
  lineHeight: {
    tight: number
    normal: number
    relaxed: number
  }
}

export interface LayoutConfig {
  containerMaxWidth: string
  headerHeight: string
  footerHeight: string
  sidebarWidth: string
  borderRadius: {
    sm: string
    md: string
    lg: string
    xl: string
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
    '2xl': string
  }
}

export interface ComponentStyles {
  buttons: {
    primary: Record<string, any>
    secondary: Record<string, any>
    outline: Record<string, any>
  }
  cards: {
    default: Record<string, any>
    product: Record<string, any>
  }
  forms: {
    input: Record<string, any>
    select: Record<string, any>
    checkbox: Record<string, any>
  }
  navigation: {
    header: Record<string, any>
    menu: Record<string, any>
    breadcrumb: Record<string, any>
  }
}

@Entity('marketplace_themes')
@Index(['societeId'], { unique: true })
export class MarketplaceTheme {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  societeId!: string

  @Column({ type: 'varchar', length: 255 })
  name!: string

  @Column({ type: 'varchar', length: 50, default: '1.0.0' })
  version!: string

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive!: boolean

  @Column({ type: 'boolean', default: false })
  isDefault!: boolean

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'jsonb', default: {} })
  colors!: ColorPalette

  @Column({ type: 'jsonb', default: {} })
  typography!: Typography

  @Column({ type: 'jsonb', default: {} })
  layout!: LayoutConfig

  @Column({ type: 'jsonb', default: {} })
  components!: ComponentStyles

  @Column({ type: 'text', nullable: true })
  customCSS?: string

  @Column({ type: 'text', nullable: true })
  customJS?: string

  @Column({ type: 'jsonb', default: {} })
  assets!: {
    logo?: string
    favicon?: string
    backgroundImages?: string[]
    fonts?: string[]
  }

  @Column({ type: 'jsonb', default: {} })
  settings!: {
    showBreadcrumbs?: boolean
    showSearchBar?: boolean
    showCart?: boolean
    showWishlist?: boolean
    showCompare?: boolean
    enableDarkMode?: boolean
    enableRTL?: boolean
    showProductReviews?: boolean
    showStockStatus?: boolean
    showProductCode?: boolean
  }

  @Column({ type: 'jsonb', nullable: true })
  responsive!: {
    breakpoints?: {
      sm: string
      md: string
      lg: string
      xl: string
    }
    mobileLayout?: Record<string, any>
    tabletLayout?: Record<string, any>
  }

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    author?: string
    authorUrl?: string
    preview?: string
    tags?: string[]
    changelog?: Array<{
      version: string
      date: string
      changes: string[]
    }>
  }

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt?: Date

  // Méthodes utilitaires
  getCompiledCSS(): string {
    const cssVariables = this.generateCSSVariables()
    const customCSS = this.customCSS || ''

    return `
      :root {
        ${cssVariables}
      }
      
      ${customCSS}
    `
  }

  private generateCSSVariables(): string {
    const variables: string[] = []

    // Couleurs
    if (this.colors) {
      variables.push(`--color-primary: ${this.colors.primary}`)
      variables.push(`--color-secondary: ${this.colors.secondary}`)
      variables.push(`--color-accent: ${this.colors.accent}`)
      variables.push(`--color-background: ${this.colors.background}`)
      variables.push(`--color-surface: ${this.colors.surface}`)
      variables.push(`--color-text-primary: ${this.colors.text?.primary}`)
      variables.push(`--color-text-secondary: ${this.colors.text?.secondary}`)
      variables.push(`--color-success: ${this.colors.success}`)
      variables.push(`--color-warning: ${this.colors.warning}`)
      variables.push(`--color-error: ${this.colors.error}`)
    }

    // Typographie
    if (this.typography) {
      variables.push(`--font-family-primary: ${this.typography.fontFamily?.primary}`)
      if (this.typography.fontFamily?.secondary) {
        variables.push(`--font-family-secondary: ${this.typography.fontFamily.secondary}`)
      }

      Object.entries(this.typography.fontSize || {}).forEach(([key, value]) => {
        variables.push(`--font-size-${key}: ${value}`)
      })

      Object.entries(this.typography.fontWeight || {}).forEach(([key, value]) => {
        variables.push(`--font-weight-${key}: ${value}`)
      })
    }

    // Layout
    if (this.layout) {
      variables.push(`--container-max-width: ${this.layout.containerMaxWidth}`)
      variables.push(`--header-height: ${this.layout.headerHeight}`)
      variables.push(`--footer-height: ${this.layout.footerHeight}`)

      Object.entries(this.layout.borderRadius || {}).forEach(([key, value]) => {
        variables.push(`--border-radius-${key}: ${value}`)
      })

      Object.entries(this.layout.spacing || {}).forEach(([key, value]) => {
        variables.push(`--spacing-${key}: ${value}`)
      })
    }

    return variables.join(';\n  ')
  }

  generatePreviewUrl(): string {
    return `/themes/preview/${this.id}`
  }

  clone(newName: string): Partial<MarketplaceTheme> {
    return {
      societeId: this.societeId,
      name: newName,
      description: `Copy of ${this.name}`,
      colors: { ...this.colors },
      typography: { ...this.typography },
      layout: { ...this.layout },
      components: { ...this.components },
      customCSS: this.customCSS,
      customJS: this.customJS,
      assets: { ...this.assets },
      settings: { ...this.settings },
      responsive: { ...this.responsive },
      isActive: false,
      isDefault: false,
    }
  }

  updateVersion(): void {
    const [major, minor, patch] = this.version.split('.').map(Number)
    this.version = `${major}.${minor}.${patch + 1}`
  }
}
