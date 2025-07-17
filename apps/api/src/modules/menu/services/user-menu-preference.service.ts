import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserMenuPreference } from '../entities/user-menu-preference.entity'

@Injectable()
export class UserMenuPreferenceService {
  private readonly logger = new Logger(UserMenuPreferenceService.name)

  constructor(
    @InjectRepository(UserMenuPreference)
    private readonly userMenuPreferenceRepository: Repository<UserMenuPreference>,
  ) {}

  /**
   * Récupère les préférences d'un utilisateur, les crée si elles n'existent pas
   */
  async findOrCreateByUserId(userId: string): Promise<UserMenuPreference> {
    let preference = await this.userMenuPreferenceRepository.findOne({
      where: { userId },
    })

    if (!preference) {
      preference = this.userMenuPreferenceRepository.create({
        userId,
        selectedPages: [],
        menuMode: 'standard',
        pageCustomizations: {},
      })
      await this.userMenuPreferenceRepository.save(preference)
      this.logger.log(`Préférences créées pour l'utilisateur ${userId}`)
    }

    return preference
  }

  /**
   * Met à jour les pages sélectionnées
   */
  async updateSelectedPages(userId: string, selectedPages: string[]): Promise<UserMenuPreference> {
    const preference = await this.findOrCreateByUserId(userId)
    preference.selectedPages = selectedPages
    
    const updated = await this.userMenuPreferenceRepository.save(preference)
    this.logger.log(`Pages sélectionnées mises à jour pour l'utilisateur ${userId}: ${selectedPages.length} pages`)
    
    return updated
  }

  /**
   * Met à jour le mode du menu
   */
  async updateMenuMode(userId: string, menuMode: 'standard' | 'custom'): Promise<UserMenuPreference> {
    const preference = await this.findOrCreateByUserId(userId)
    preference.menuMode = menuMode
    
    const updated = await this.userMenuPreferenceRepository.save(preference)
    this.logger.log(`Mode du menu mis à jour pour l'utilisateur ${userId}: ${menuMode}`)
    
    return updated
  }

  /**
   * Ajoute ou retire une page des sélections
   */
  async togglePage(userId: string, pageId: string): Promise<UserMenuPreference> {
    const preference = await this.findOrCreateByUserId(userId)
    
    const index = preference.selectedPages.indexOf(pageId)
    if (index > -1) {
      preference.selectedPages.splice(index, 1)
      this.logger.log(`Page ${pageId} retirée pour l'utilisateur ${userId}`)
    } else {
      preference.selectedPages.push(pageId)
      this.logger.log(`Page ${pageId} ajoutée pour l'utilisateur ${userId}`)
    }
    
    return await this.userMenuPreferenceRepository.save(preference)
  }

  /**
   * Met à jour les personnalisations d'une page
   */
  async updatePageCustomization(
    userId: string,
    pageId: string,
    customization: {
      customTitle?: string
      customIcon?: string
      customColor?: string
      customOrder?: number
    },
  ): Promise<UserMenuPreference> {
    const preference = await this.findOrCreateByUserId(userId)
    
    if (!preference.pageCustomizations) {
      preference.pageCustomizations = {}
    }
    
    preference.pageCustomizations[pageId] = customization
    
    return await this.userMenuPreferenceRepository.save(preference)
  }

  /**
   * Réinitialise les préférences
   */
  async resetPreferences(userId: string): Promise<UserMenuPreference> {
    const preference = await this.findOrCreateByUserId(userId)
    
    preference.selectedPages = []
    preference.menuMode = 'standard'
    preference.pageCustomizations = {}
    
    const updated = await this.userMenuPreferenceRepository.save(preference)
    this.logger.log(`Préférences réinitialisées pour l'utilisateur ${userId}`)
    
    return updated
  }
}