import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserMenuPreference } from '../entities/user-menu-preference.entity'

@Injectable()
export class UserMenuPreferenceService {
  private readonly logger = new Logger(UserMenuPreferenceService.name)

  constructor(
    @InjectRepository(UserMenuPreference, 'auth')
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
      // Créer les préférences par défaut basées sur la structure hiérarchique
      const defaultMenus = [
        // Pages principales (toujours visibles)
        { menuId: 'home', isVisible: true, order: 0, customLabel: 'Accueil' },
        { menuId: 'dashboard', isVisible: true, order: 1, customLabel: 'Tableau de bord' },
        
        // Section administration (visible pour admin)
        { menuId: 'admin', isVisible: true, order: 2, customLabel: 'Administration' },
        { menuId: 'admin-users', isVisible: true, order: 21, customLabel: 'Gestion des utilisateurs' },
        { menuId: 'admin-roles', isVisible: true, order: 22, customLabel: 'Gestion des rôles' },
        { menuId: 'admin-menu-config', isVisible: false, order: 23, customLabel: 'Configuration des menus' },
        { menuId: 'admin-company', isVisible: false, order: 24, customLabel: 'Informations entreprise' },
        { menuId: 'admin-database', isVisible: false, order: 25, customLabel: 'Base de données' },
        { menuId: 'admin-notifications-rules', isVisible: false, order: 26, customLabel: 'Règles de notification' },
        { menuId: 'admin-sessions', isVisible: false, order: 27, customLabel: 'Sessions utilisateurs' },
        { menuId: 'admin-translations', isVisible: false, order: 28, customLabel: 'Gestion des traductions' },
        
        // Section paramètres
        { menuId: 'settings', isVisible: true, order: 3, customLabel: 'Paramètres' },
        { menuId: 'settings-menu', isVisible: true, order: 31, customLabel: 'Personnalisation du menu' },
        { menuId: 'settings-security', isVisible: false, order: 32, customLabel: 'Paramètres de sécurité' },
        
        // Profil utilisateur
        { menuId: 'profile', isVisible: true, order: 4, customLabel: 'Mon profil' },
        
        // Modules métier (pas encore disponibles)
        { menuId: 'clients', isVisible: false, order: 5, customLabel: 'Clients' },
        { menuId: 'projets', isVisible: false, order: 6, customLabel: 'Projets' },
        { menuId: 'stocks', isVisible: false, order: 7, customLabel: 'Stocks' },
        { menuId: 'production', isVisible: false, order: 8, customLabel: 'Production' },
        { menuId: 'planning', isVisible: false, order: 9, customLabel: 'Planification' },
        
        // Legacy (compatibilité)
        { menuId: 'users', isVisible: false, order: 100, customLabel: 'Utilisateurs (legacy)' },
        { menuId: 'roles', isVisible: false, order: 101, customLabel: 'Rôles (legacy)' },
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
   * Sauvegarde le menu personnalisé complet
   */
  async saveCustomMenu(userId: string, menuItems: any[]): Promise<any> {
    try {
      // Trouver ou créer une préférence spéciale pour stocker le menu complet
      let customMenuPreference = await this.userMenuPreferenceRepository.findOne({
        where: { userId, menuId: '__custom_menu__' }
      })

      if (!customMenuPreference) {
        customMenuPreference = this.userMenuPreferenceRepository.create({
          userId,
          menuId: '__custom_menu__',
          isVisible: true,
          order: 0,
          customLabel: 'Menu personnalisé complet'
        })
      }

      // Stocker les données du menu dans les métadonnées (ou un champ JSON si disponible)
      // Pour l'instant on utilise customLabel comme stockage JSON simple
      customMenuPreference.customLabel = JSON.stringify({
        type: 'custom_menu_data',
        menuItems: menuItems,
        savedAt: new Date().toISOString()
      })

      const result = await this.userMenuPreferenceRepository.save(customMenuPreference)
      this.logger.log(`Menu personnalisé sauvegardé pour l'utilisateur ${userId} avec ${menuItems.length} éléments`)
      
      return {
        success: true,
        itemCount: menuItems.length,
        savedAt: new Date().toISOString()
      }
    } catch (error) {
      this.logger.error(`Erreur lors de la sauvegarde du menu personnalisé pour ${userId}:`, error)
      throw error
    }
  }

  /**
   * Récupère le menu personnalisé complet
   */
  async getCustomMenu(userId: string): Promise<any[]> {
    try {
      const customMenuPreference = await this.userMenuPreferenceRepository.findOne({
        where: { userId, menuId: '__custom_menu__' }
      })

      if (!customMenuPreference || !customMenuPreference.customLabel) {
        this.logger.log(`Aucun menu personnalisé trouvé pour l'utilisateur ${userId}`)
        return []
      }

      try {
        const menuData = JSON.parse(customMenuPreference.customLabel)
        if (menuData.type === 'custom_menu_data' && Array.isArray(menuData.menuItems)) {
          this.logger.log(`Menu personnalisé récupéré pour l'utilisateur ${userId} avec ${menuData.menuItems.length} éléments`)
          return menuData.menuItems
        }
      } catch (parseError) {
        this.logger.error(`Erreur de parsing du menu personnalisé pour ${userId}:`, parseError)
        return []
      }

      return []
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération du menu personnalisé pour ${userId}:`, error)
      throw error
    }
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