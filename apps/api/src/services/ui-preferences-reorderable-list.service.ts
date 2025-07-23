import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { 
  UiPreferencesReorderableList, 
  ReorderableListPreferences, 
  ReorderableListLayout, 
  ReorderableListTheme 
} from '../entities/ui-preferences-reorderable-list.entity'

export interface CreateReorderableListPreferencesDto {
  user_id: string
  component_id: string
  theme?: ReorderableListTheme
  preferences?: Partial<ReorderableListPreferences>
  layout?: Partial<ReorderableListLayout>
}

export interface UpdateReorderableListPreferencesDto {
  theme?: ReorderableListTheme
  preferences?: Partial<ReorderableListPreferences>
  layout?: Partial<ReorderableListLayout>
}

@Injectable()
export class UiPreferencesReorderableListService {
  constructor(
    @InjectRepository(UiPreferencesReorderableList)
    private preferencesRepository: Repository<UiPreferencesReorderableList>
  ) {}

  async createPreferences(dto: CreateReorderableListPreferencesDto): Promise<UiPreferencesReorderableList> {
    try {
      const preferences = this.preferencesRepository.create({
        user_id: dto.user_id,
        component_id: dto.component_id,
        theme: dto.theme || 'default',
        preferences: { ...this.getDefaultPreferences(), ...dto.preferences },
        layout: { ...this.getDefaultLayout(), ...dto.layout }
      })

      return await this.preferencesRepository.save(preferences)
    } catch (error: any) {
      if (error.code === '23505') { // Violation contrainte unique
        throw new BadRequestException('Des préférences existent déjà pour cet utilisateur et ce composant')
      }
      throw error
    }
  }

  async getPreferences(user_id: string, component_id: string): Promise<UiPreferencesReorderableList | null> {
    return await this.preferencesRepository.findOne({
      where: { user_id, component_id }
    })
  }

  async getOrCreatePreferences(user_id: string, component_id: string): Promise<UiPreferencesReorderableList> {
    let preferences = await this.getPreferences(user_id, component_id)
    
    if (!preferences) {
      preferences = await this.createPreferences({ user_id, component_id })
    }
    
    return preferences
  }

  async updatePreferences(
    user_id: string, 
    component_id: string, 
    dto: UpdateReorderableListPreferencesDto
  ): Promise<UiPreferencesReorderableList> {
    const preferences = await this.getPreferences(user_id, component_id)
    
    if (!preferences) {
      throw new NotFoundException('Préférences introuvables')
    }

    if (dto.theme !== undefined) {
      preferences.theme = dto.theme
    }
    if (dto.preferences) {
      preferences.preferences = { ...preferences.preferences, ...dto.preferences }
    }
    if (dto.layout) {
      preferences.layout = { ...preferences.layout, ...dto.layout }
    }

    return await this.preferencesRepository.save(preferences)
  }

  async deletePreferences(user_id: string, component_id: string): Promise<void> {
    const result = await this.preferencesRepository.delete({ user_id, component_id })
    
    if (result.affected === 0) {
      throw new NotFoundException('Préférences introuvables')
    }
  }

  async getPreferencesByUser(user_id: string): Promise<UiPreferencesReorderableList[]> {
    return await this.preferencesRepository.find({
      where: { user_id },
      order: { component_id: 'ASC', updated_at: 'DESC' }
    })
  }

  async getPreferencesByComponent(component_id: string): Promise<UiPreferencesReorderableList[]> {
    return await this.preferencesRepository.find({
      where: { component_id },
      order: { user_id: 'ASC', updated_at: 'DESC' }
    })
  }

  async bulkCreatePreferences(preferencesData: CreateReorderableListPreferencesDto[]): Promise<UiPreferencesReorderableList[]> {
    const preferences = preferencesData.map(dto => this.preferencesRepository.create({
      user_id: dto.user_id,
      component_id: dto.component_id,
      theme: dto.theme || 'default',
      preferences: { ...this.getDefaultPreferences(), ...dto.preferences },
      layout: { ...this.getDefaultLayout(), ...dto.layout }
    }))

    return await this.preferencesRepository.save(preferences)
  }

  async resetToDefaults(user_id: string, component_id: string): Promise<UiPreferencesReorderableList> {
    const preferences = await this.getPreferences(user_id, component_id)
    
    if (!preferences) {
      throw new NotFoundException('Préférences introuvables')
    }

    preferences.theme = 'default'
    preferences.preferences = this.getDefaultPreferences()
    preferences.layout = this.getDefaultLayout()

    return await this.preferencesRepository.save(preferences)
  }

  async validateTheme(theme: string): Promise<boolean> {
    const validThemes: ReorderableListTheme[] = ['default', 'compact', 'modern', 'minimal', 'colorful']
    return validThemes.includes(theme as ReorderableListTheme)
  }

  async validateLayout(layout: Partial<ReorderableListLayout>): Promise<boolean> {
    if (layout.maxDepth !== undefined && (layout.maxDepth < 1 || layout.maxDepth > 20)) {
      return false
    }
    if (layout.dragHandlePosition !== undefined && !['left', 'right'].includes(layout.dragHandlePosition)) {
      return false
    }
    if (layout.expandButtonPosition !== undefined && !['left', 'right'].includes(layout.expandButtonPosition)) {
      return false
    }
    return true
  }

  // Helpers pour valeurs par défaut
  private getDefaultPreferences(): ReorderableListPreferences {
    return {
      defaultExpanded: true,
      showLevelIndicators: true,
      showConnectionLines: true,
      enableAnimations: true,
      compactMode: false,
      customColors: {}
    }
  }

  private getDefaultLayout(): ReorderableListLayout {
    return {
      maxDepth: 10,
      allowNesting: true,
      dragHandlePosition: 'left',
      expandButtonPosition: 'left'
    }
  }

  // Méthodes utilitaires pour les thèmes
  getAvailableThemes(): ReorderableListTheme[] {
    return ['default', 'compact', 'modern', 'minimal', 'colorful']
  }

  getThemeConfig(theme: ReorderableListTheme): any {
    switch (theme) {
      case 'compact':
        return {
          compactMode: true,
          showLevelIndicators: false,
          showConnectionLines: false,
          indentSize: 16,
          maxDepth: 5
        }
      case 'modern':
        return {
          enableAnimations: true,
          showLevelIndicators: true,
          showConnectionLines: false,
          compactMode: false,
          customColors: {
            primary: '#3b82f6',
            secondary: '#10b981',
            accent: '#f59e0b'
          }
        }
      case 'minimal':
        return {
          showLevelIndicators: false,
          showConnectionLines: false,
          enableAnimations: false,
          compactMode: true,
          customColors: {}
        }
      case 'colorful':
        return {
          showLevelIndicators: true,
          showConnectionLines: true,
          enableAnimations: true,
          customColors: {
            level0: '#3b82f6',
            level1: '#10b981',
            level2: '#f59e0b',
            level3: '#ef4444',
            level4: '#8b5cf6'
          }
        }
      default:
        return this.getDefaultPreferences()
    }
  }
}