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

      // Stocker les données du menu dans les métadonnées
      customMenuPreference.customLabel = JSON.stringify({
        type: 'custom_menu_data',
        menuItems: menuItems,
        savedAt: new Date().toISOString()
      })
      
      // Extraire et sauvegarder les traductions individuellement si le champ existe
      if (menuItems && Array.isArray(menuItems)) {
        const translationsMap: Record<string, string> = {}
        
        // Parcourir récursivement les éléments pour extraire les traductions
        const extractTranslations = (items: any[]) => {
          items.forEach(item => {
            if (item.id && item.titleTranslations && typeof item.titleTranslations === 'object') {
              Object.entries(item.titleTranslations).forEach(([lang, title]) => {
                translationsMap[`${item.id}_${lang}`] = title as string
              })
            }
            if (item.children && Array.isArray(item.children)) {
              extractTranslations(item.children)
            }
          })
        }
        
        extractTranslations(menuItems)
        
        this.logger.log(`💾 Traductions extraites:`, {
          itemsCount: menuItems.length,
          translationsCount: Object.keys(translationsMap).length,
          translationsKeys: Object.keys(translationsMap),
          sampleTranslations: Object.fromEntries(Object.entries(translationsMap).slice(0, 3))
        })
        
        // Stocker les traductions dans le champ titleTranslations s'il existe
        if (Object.keys(translationsMap).length > 0) {
          customMenuPreference.titleTranslations = translationsMap
        }
      }

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
      this.logger.log(`🔍 Début récupération menu personnalisé pour utilisateur ${userId}`)
      
      const customMenuPreference = await this.userMenuPreferenceRepository.findOne({
        where: { userId, menuId: '__custom_menu__' }
      })

      this.logger.log(`📥 Résultat requête DB:`, {
        found: !!customMenuPreference,
        hasCustomLabel: !!customMenuPreference?.customLabel,
        hasTitleTranslations: !!customMenuPreference?.titleTranslations,
        titleTranslationsKeys: customMenuPreference?.titleTranslations ? Object.keys(customMenuPreference.titleTranslations) : [],
        customLabelPreview: customMenuPreference?.customLabel?.substring(0, 100),
        customLabelLength: customMenuPreference?.customLabel?.length,
        customLabelType: typeof customMenuPreference?.customLabel
      })

      if (!customMenuPreference || !customMenuPreference.customLabel) {
        this.logger.log(`Aucun menu personnalisé trouvé pour l'utilisateur ${userId}`)
        return []
      }

      try {
        this.logger.log(`🔧 Tentative de parsing JSON pour ${userId}`)
        const menuData = JSON.parse(customMenuPreference.customLabel)
        this.logger.log(`✅ JSON parsé avec succès:`, {
          type: menuData.type,
          hasMenuItems: Array.isArray(menuData.menuItems),
          menuItemsLength: menuData.menuItems?.length || 0
        })
        
        if (menuData.type === 'custom_menu_data' && Array.isArray(menuData.menuItems)) {
          let menuItems = menuData.menuItems
          
          // Réappliquer les traductions si elles existent
          if (customMenuPreference.titleTranslations) {
            const applyTranslations = (items: any[]) => {
              return items.map(item => {
                if (item.id) {
                  // Reconstituer les traductions pour cet élément
                  const itemTranslations: Record<string, string> = {}
                  Object.entries(customMenuPreference.titleTranslations || {}).forEach(([key, value]) => {
                    if (key.startsWith(`${item.id}_`)) {
                      const lang = key.substring(`${item.id}_`.length)
                      itemTranslations[lang] = value
                    }
                  })
                  
                  if (Object.keys(itemTranslations).length > 0) {
                    item.titleTranslations = itemTranslations
                  }
                }
                
                // Traiter récursivement les enfants
                if (item.children && Array.isArray(item.children)) {
                  item.children = applyTranslations(item.children)
                }
                
                return item
              })
            }
            
            menuItems = applyTranslations(menuItems)
          }
          
          this.logger.log(`Menu personnalisé récupéré pour l'utilisateur ${userId} avec ${menuItems.length} éléments`)
          return menuItems
        }
      } catch (parseError) {
        this.logger.error(`❌ Erreur de parsing du menu personnalisé pour ${userId}:`, {
          error: parseError instanceof Error ? parseError.message : String(parseError),
          customLabelStart: customMenuPreference.customLabel?.substring(0, 200),
          customLabelEnd: customMenuPreference.customLabel?.substring(-200)
        })
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