import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { MarketplaceTheme } from '../entities/marketplace-theme.entity'

export interface CreateThemeDto {
  name: string
  description?: string
  colors?: Partial<MarketplaceTheme['colors']>
  typography?: Partial<MarketplaceTheme['typography']>
  layout?: Partial<MarketplaceTheme['layout']>
  components?: Partial<MarketplaceTheme['components']>
  customCSS?: string
  customJS?: string
  assets?: Partial<MarketplaceTheme['assets']>
  settings?: Partial<MarketplaceTheme['settings']>
  responsive?: Partial<MarketplaceTheme['responsive']>
  metadata?: Partial<MarketplaceTheme['metadata']>
}

export interface UpdateThemeDto {
  name?: string
  description?: string
  colors?: Partial<MarketplaceTheme['colors']>
  typography?: Partial<MarketplaceTheme['typography']>
  layout?: Partial<MarketplaceTheme['layout']>
  components?: Partial<MarketplaceTheme['components']>
  customCSS?: string
  customJS?: string
  assets?: Partial<MarketplaceTheme['assets']>
  settings?: Partial<MarketplaceTheme['settings']>
  responsive?: Partial<MarketplaceTheme['responsive']>
  metadata?: Partial<MarketplaceTheme['metadata']>
  isActive?: boolean
}

export interface ThemePreviewDto {
  colors?: Partial<MarketplaceTheme['colors']>
  typography?: Partial<MarketplaceTheme['typography']>
  layout?: Partial<MarketplaceTheme['layout']>
  components?: Partial<MarketplaceTheme['components']>
  customCSS?: string
}

@Injectable()
export class MarketplaceThemesService {
  constructor(
    @InjectRepository(MarketplaceTheme, 'marketplace')
    private themeRepo: Repository<MarketplaceTheme>
  ) {}

  /**
   * Get all themes for a company
   */
  async findAll(societeId: string): Promise<MarketplaceTheme[]> {
    return await this.themeRepo.find({
      where: { societeId },
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * Get active theme for a company
   */
  async findActive(societeId: string): Promise<MarketplaceTheme | null> {
    return await this.themeRepo.findOne({
      where: { societeId, isActive: true },
    })
  }

  /**
   * Get theme by ID
   */
  async findById(id: string, societeId: string): Promise<MarketplaceTheme> {
    const theme = await this.themeRepo.findOne({
      where: { id, societeId },
    })

    if (!theme) {
      throw new NotFoundException('Thème non trouvé')
    }

    return theme
  }

  /**
   * Create a new theme
   */
  async create(
    societeId: string,
    createDto: CreateThemeDto
  ): Promise<MarketplaceTheme> {
    // Check if theme name already exists for this company
    const existingTheme = await this.themeRepo.findOne({
      where: { societeId, name: createDto.name },
    })

    if (existingTheme) {
      throw new BadRequestException('Un thème avec ce nom existe déjà')
    }

    // Get default theme configuration
    const defaultTheme = this.getDefaultThemeConfig()

    // Create new theme with merged configuration
    const theme = this.themeRepo.create({
      societeId,
      name: createDto.name,
      description: createDto.description,
      version: '1.0.0',
      isActive: false,
      isDefault: false,
      colors: { ...defaultTheme.colors, ...createDto.colors },
      typography: { ...defaultTheme.typography, ...createDto.typography },
      layout: { ...defaultTheme.layout, ...createDto.layout },
      components: { ...defaultTheme.components, ...createDto.components },
      customCSS: createDto.customCSS,
      customJS: createDto.customJS,
      assets: { ...defaultTheme.assets, ...createDto.assets },
      settings: { ...defaultTheme.settings, ...createDto.settings },
      responsive: { ...defaultTheme.responsive, ...createDto.responsive },
      metadata: {
        author: 'User',
        tags: ['custom'],
        ...createDto.metadata,
      },
    })

    return await this.themeRepo.save(theme)
  }

  /**
   * Update an existing theme
   */
  async update(
    id: string,
    societeId: string,
    updateDto: UpdateThemeDto
  ): Promise<MarketplaceTheme> {
    const theme = await this.findById(id, societeId)

    // If activating this theme, deactivate others
    if (updateDto.isActive === true) {
      await this.themeRepo.update(
        { societeId, isActive: true },
        { isActive: false }
      )
    }

    // Update theme properties
    Object.assign(theme, {
      ...updateDto,
      colors: updateDto.colors ? { ...theme.colors, ...updateDto.colors } : theme.colors,
      typography: updateDto.typography ? { ...theme.typography, ...updateDto.typography } : theme.typography,
      layout: updateDto.layout ? { ...theme.layout, ...updateDto.layout } : theme.layout,
      components: updateDto.components ? { ...theme.components, ...updateDto.components } : theme.components,
      assets: updateDto.assets ? { ...theme.assets, ...updateDto.assets } : theme.assets,
      settings: updateDto.settings ? { ...theme.settings, ...updateDto.settings } : theme.settings,
      responsive: updateDto.responsive ? { ...theme.responsive, ...updateDto.responsive } : theme.responsive,
      metadata: updateDto.metadata ? { ...theme.metadata, ...updateDto.metadata } : theme.metadata,
    })

    // Update version if design changes were made
    if (this.hasDesignChanges(updateDto)) {
      theme.updateVersion()
    }

    return await this.themeRepo.save(theme)
  }

  /**
   * Delete a theme
   */
  async delete(id: string, societeId: string): Promise<void> {
    const theme = await this.findById(id, societeId)

    if (theme.isActive) {
      throw new BadRequestException('Impossible de supprimer le thème actif')
    }

    if (theme.isDefault) {
      throw new BadRequestException('Impossible de supprimer le thème par défaut')
    }

    await this.themeRepo.remove(theme)
  }

  /**
   * Activate a theme
   */
  async activate(id: string, societeId: string): Promise<MarketplaceTheme> {
    const theme = await this.findById(id, societeId)

    // Deactivate all other themes
    await this.themeRepo.update(
      { societeId, isActive: true },
      { isActive: false }
    )

    // Activate this theme
    theme.isActive = true
    theme.lastUsedAt = new Date()

    return await this.themeRepo.save(theme)
  }

  /**
   * Clone an existing theme
   */
  async clone(
    id: string,
    societeId: string,
    newName: string
  ): Promise<MarketplaceTheme> {
    const originalTheme = await this.findById(id, societeId)

    // Check if new name already exists
    const existingTheme = await this.themeRepo.findOne({
      where: { societeId, name: newName },
    })

    if (existingTheme) {
      throw new BadRequestException('Un thème avec ce nom existe déjà')
    }

    // Create cloned theme
    const clonedData = originalTheme.clone(newName)
    const clonedTheme = this.themeRepo.create(clonedData)

    return await this.themeRepo.save(clonedTheme)
  }

  /**
   * Generate CSS for a theme
   */
  async generateCSS(id: string, societeId: string): Promise<string> {
    const theme = await this.findById(id, societeId)
    return theme.getCompiledCSS()
  }

  /**
   * Preview theme changes without saving
   */
  async previewTheme(
    id: string,
    societeId: string,
    previewDto: ThemePreviewDto
  ): Promise<{ css: string; preview_url: string }> {
    const theme = await this.findById(id, societeId)

    // Create temporary theme with preview changes
    const previewTheme = this.themeRepo.create({
      ...theme,
      colors: previewDto.colors ? { ...theme.colors, ...previewDto.colors } : theme.colors,
      typography: previewDto.typography ? { ...theme.typography, ...previewDto.typography } : theme.typography,
      layout: previewDto.layout ? { ...theme.layout, ...previewDto.layout } : theme.layout,
      components: previewDto.components ? { ...theme.components, ...previewDto.components } : theme.components,
      customCSS: previewDto.customCSS ?? theme.customCSS,
    })

    const css = previewTheme.getCompiledCSS()
    const preview_url = previewTheme.generatePreviewUrl()

    return { css, preview_url }
  }

  /**
   * Reset theme to default configuration
   */
  async resetToDefault(id: string, societeId: string): Promise<MarketplaceTheme> {
    const theme = await this.findById(id, societeId)
    const defaultConfig = this.getDefaultThemeConfig()

    // Reset to default but keep name, description, and metadata
    Object.assign(theme, {
      colors: defaultConfig.colors,
      typography: defaultConfig.typography,
      layout: defaultConfig.layout,
      components: defaultConfig.components,
      settings: defaultConfig.settings,
      customCSS: null,
      customJS: null,
      assets: defaultConfig.assets,
      responsive: defaultConfig.responsive,
    })

    theme.updateVersion()
    return await this.themeRepo.save(theme)
  }

  /**
   * Get theme usage statistics
   */
  async getThemeStats(societeId: string): Promise<{
    total: number
    active: number
    custom: number
    lastUsed?: Date
  }> {
    const themes = await this.themeRepo.find({
      where: { societeId },
    })

    const activeTheme = themes.find(t => t.isActive)
    const customThemes = themes.filter(t => !t.isDefault)

    return {
      total: themes.length,
      active: activeTheme ? 1 : 0,
      custom: customThemes.length,
      lastUsed: activeTheme?.lastUsedAt,
    }
  }

  /**
   * Get default theme configuration
   */
  private getDefaultThemeConfig(): Partial<MarketplaceTheme> {
    return {
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
      assets: {
        fonts: [],
        backgroundImages: [],
      },
      responsive: {
        breakpoints: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
        },
      },
    }
  }

  /**
   * Check if update contains design changes that require version bump
   */
  private hasDesignChanges(updateDto: UpdateThemeDto): boolean {
    const designFields = [
      'colors', 'typography', 'layout', 'components', 
      'customCSS', 'customJS', 'assets', 'responsive'
    ]
    
    return designFields.some(field => updateDto[field] !== undefined)
  }
}