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
  async findOrCreateByUserId(userId: string): Promise<UserMenuPreference[]> {
    let preferences = await this.userMenuPreferenceRepository.find({
      where: { userId },
    })

    if (!preferences.length) {
      // Créer les préférences par défaut pour l'admin
      const defaultMenus = [
        { menuId: 'main-dashboard', isVisible: true, order: 1, customLabel: 'Dashboard' },
        { menuId: 'users', isVisible: true, order: 2, customLabel: 'Utilisateurs' },
        { menuId: 'roles', isVisible: true, order: 3, customLabel: 'Rôles' },
        { menuId: 'system-settings', isVisible: true, order: 4, customLabel: 'Configuration' },
        { menuId: 'notifications', isVisible: true, order: 5, customLabel: 'Notifications' },
      ]

      preferences = await Promise.all(defaultMenus.map(async (menu) => {
        const preference = this.userMenuPreferenceRepository.create({
          userId,
          menuId: menu.menuId,
          isVisible: menu.isVisible,
          order: menu.order,
          customLabel: menu.customLabel,
        })
        return await this.userMenuPreferenceRepository.save(preference)
      }))
      
      this.logger.log(`Préférences créées pour l'utilisateur ${userId} avec ${preferences.length} menus`)
    }

    return preferences
  }


  /**
   * Met à jour la visibilité d'un menu
   */
  async updateMenuVisibility(userId: string, menuId: string, isVisible: boolean): Promise<UserMenuPreference> {
    const preferences = await this.findOrCreateByUserId(userId)
    let preference = preferences.find(p => p.menuId === menuId)
    
    if (!preference) {
      preference = this.userMenuPreferenceRepository.create({
        userId,
        menuId,
        isVisible,
        order: preferences.length + 1,
      })
    } else {
      preference.isVisible = isVisible
    }
    
    const updated = await this.userMenuPreferenceRepository.save(preference)
    this.logger.log(`Visibilité du menu ${menuId} mise à jour pour l'utilisateur ${userId}: ${isVisible}`)
    
    return updated
  }

  /**
   * Met à jour l'ordre d'un menu
   */
  async updateMenuOrder(userId: string, menuId: string, order: number): Promise<UserMenuPreference> {
    const preferences = await this.findOrCreateByUserId(userId)
    let preference = preferences.find(p => p.menuId === menuId)
    
    if (!preference) {
      preference = this.userMenuPreferenceRepository.create({
        userId,
        menuId,
        isVisible: true,
        order,
      })
    } else {
      preference.order = order
    }
    
    const updated = await this.userMenuPreferenceRepository.save(preference)
    this.logger.log(`Ordre du menu ${menuId} mis à jour pour l'utilisateur ${userId}: ${order}`)
    
    return updated
  }

  /**
   * Ajoute ou retire une page des sélections
   */
  async togglePage(userId: string, pageId: string): Promise<UserMenuPreference> {
    const preferences = await this.findOrCreateByUserId(userId)
    let preference = preferences.find(p => p.menuId === pageId)
    
    if (!preference) {
      preference = this.userMenuPreferenceRepository.create({
        userId,
        menuId: pageId,
        isVisible: true,
        order: preferences.length + 1,
      })
    } else {
      preference.isVisible = !preference.isVisible
    }
    
    const updated = await this.userMenuPreferenceRepository.save(preference)
    this.logger.log(`Page ${pageId} basculée pour l'utilisateur ${userId}: ${preference.isVisible}`)
    
    return updated
  }

  /**
   * Met à jour le label personnalisé d'une page
   */
  async updatePageCustomization(
    userId: string,
    pageId: string,
    customLabel: string,
  ): Promise<UserMenuPreference> {
    const preferences = await this.findOrCreateByUserId(userId)
    let preference = preferences.find(p => p.menuId === pageId)
    
    if (!preference) {
      preference = this.userMenuPreferenceRepository.create({
        userId,
        menuId: pageId,
        isVisible: true,
        order: preferences.length + 1,
        customLabel,
      })
    } else {
      preference.customLabel = customLabel
    }
    
    return await this.userMenuPreferenceRepository.save(preference)
  }

  /**
   * Réinitialise les préférences
   */
  async resetPreferences(userId: string): Promise<UserMenuPreference[]> {
    // Supprimer toutes les préférences existantes
    await this.userMenuPreferenceRepository.delete({ userId })
    
    // Recréer les préférences par défaut
    const preferences = await this.findOrCreateByUserId(userId)
    this.logger.log(`Préférences réinitialisées pour l'utilisateur ${userId}`)
    
    return preferences
  }
}