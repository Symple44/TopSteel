import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import { UserMenuItemPreference } from '../entities/user-menu-item-preference.entity'
import { UserMenuPreferences } from '../entities/user-menu-preferences.entity'
import type { MenuConfigurationService, MenuTreeNode } from './menu-configuration.service'

export interface UpdateUserPreferencesDto {
  useCustomLayout?: boolean
  layoutType?: 'standard' | 'compact' | 'expanded' | 'minimal'
  showIcons?: boolean
  showBadges?: boolean
  allowCollapse?: boolean
  theme?: 'light' | 'dark' | 'auto'
  customColors?: {
    primary?: string
    secondary?: string
    accent?: string
  }
}

export interface MenuItemAction {
  action: 'favorite' | 'unfavorite' | 'hide' | 'show' | 'pin' | 'unpin' | 'reorder'
  menuItemId: string
  value?: number // Pour reorder, contient le nouvel ordre
}

export interface CustomMenuItemDto {
  menuItemId: string
  customTitle?: string
  customIcon?: string
  customColor?: string
  customBadge?: string
  customOrder?: number
}

export interface UserMenuWithPreferences extends MenuTreeNode {
  userPreferences?: {
    isVisible: boolean
    isFavorite: boolean
    isPinned: boolean
    customTitle?: string
    customIcon?: string
    customColor?: string
    customBadge?: string
    customOrder?: number
  }
}

@Injectable()
export class UserMenuPreferencesService {
  constructor(
    @InjectRepository(UserMenuPreferences, 'auth')
    private readonly _preferencesRepository: Repository<UserMenuPreferences>,
    @InjectRepository(UserMenuItemPreference, 'auth')
    private readonly _itemPreferencesRepository: Repository<UserMenuItemPreference>,
    private readonly menuConfigService: MenuConfigurationService
  ) {}

  // ===== GESTION DES PRÉFÉRENCES GÉNÉRALES =====

  async getUserPreferences(userId: string): Promise<UserMenuPreferences> {
    let preferences = await this._preferencesRepository.findOne({
      where: { userId },
      relations: ['itemPreferences'],
    })

    if (!preferences) {
      // Créer des préférences par défaut
      const activeConfig = await this.menuConfigService.findActiveConfiguration()
      preferences = UserMenuPreferences.createDefault(userId, activeConfig?.id)
      preferences = await this._preferencesRepository.save(preferences)
    }

    return preferences
  }

  async updateUserPreferences(
    userId: string,
    updateDto: UpdateUserPreferencesDto
  ): Promise<UserMenuPreferences> {
    const preferences = await this.getUserPreferences(userId)

    Object.assign(preferences, updateDto)
    preferences.updatedAt = new Date()

    return await this._preferencesRepository.save(preferences)
  }

  async resetUserPreferences(userId: string): Promise<UserMenuPreferences> {
    const preferences = await this.getUserPreferences(userId)
    const activeConfig = await this.menuConfigService.findActiveConfiguration()

    // Supprimer toutes les préférences d'items existantes
    await this._itemPreferencesRepository.delete({ userPreferencesId: preferences.id })

    // Réinitialiser les préférences générales
    const defaultPrefs = UserMenuPreferences.createDefault(userId, activeConfig?.id)
    Object.assign(preferences, defaultPrefs)
    // L'ID existant est préservé par Object.assign

    return await this._preferencesRepository.save(preferences)
  }

  // ===== GESTION DES ACTIONS SUR LES ITEMS =====

  async executeMenuItemAction(userId: string, action: MenuItemAction): Promise<void> {
    const preferences = await this.getUserPreferences(userId)

    let itemPreference = await this._itemPreferencesRepository.findOne({
      where: {
        userPreferencesId: preferences.id,
        menuItemId: action.menuItemId,
      },
    })

    if (!itemPreference) {
      itemPreference = UserMenuItemPreference.create(preferences.id, action.menuItemId)
    }

    switch (action.action) {
      case 'favorite':
        itemPreference.isFavorite = true
        preferences.addFavorite(action.menuItemId)
        break
      case 'unfavorite':
        itemPreference.isFavorite = false
        preferences.removeFavorite(action.menuItemId)
        break
      case 'hide':
        itemPreference.isVisible = false
        preferences.hideItem(action.menuItemId)
        break
      case 'show':
        itemPreference.isVisible = true
        preferences.showItem(action.menuItemId)
        break
      case 'pin':
        itemPreference.isPinned = true
        preferences.pinItem(action.menuItemId)
        break
      case 'unpin':
        itemPreference.isPinned = false
        preferences.unpinItem(action.menuItemId)
        break
      case 'reorder':
        itemPreference.customOrder = action.value
        if (!preferences.customOrder) preferences.customOrder = {}
        preferences.customOrder[action.menuItemId] = action.value || 0
        break
    }

    await Promise.all([
      this._itemPreferencesRepository.save(itemPreference),
      this._preferencesRepository.save(preferences),
    ])
  }

  async updateCustomMenuItem(userId: string, customItemDto: CustomMenuItemDto): Promise<void> {
    const preferences = await this.getUserPreferences(userId)

    let itemPreference = await this._itemPreferencesRepository.findOne({
      where: {
        userPreferencesId: preferences.id,
        menuItemId: customItemDto.menuItemId,
      },
    })

    if (!itemPreference) {
      itemPreference = UserMenuItemPreference.create(preferences.id, customItemDto.menuItemId)
    }

    Object.assign(itemPreference, {
      customTitle: customItemDto.customTitle,
      customIcon: customItemDto.customIcon,
      customColor: customItemDto.customColor,
      customBadge: customItemDto.customBadge,
      customOrder: customItemDto.customOrder,
    })

    await this._itemPreferencesRepository.save(itemPreference)
  }

  // ===== GESTION DES RACCOURCIS =====

  async addShortcut(
    userId: string,
    shortcut: { key: string; href: string; title: string }
  ): Promise<void> {
    const preferences = await this.getUserPreferences(userId)

    if (!preferences.shortcuts) preferences.shortcuts = []

    // Vérifier que le raccourci n'existe pas déjà
    const existingShortcut = preferences.shortcuts.find((s) => s.key === shortcut.key)
    if (existingShortcut) {
      Object.assign(existingShortcut, shortcut)
    } else {
      preferences.shortcuts.push(shortcut)
    }

    await this._preferencesRepository.save(preferences)
  }

  async removeShortcut(userId: string, key: string): Promise<void> {
    const preferences = await this.getUserPreferences(userId)

    if (preferences.shortcuts) {
      preferences.shortcuts = preferences.shortcuts.filter((s) => s.key !== key)
      await this._preferencesRepository.save(preferences)
    }
  }

  // ===== MENU PERSONNALISÉ =====

  async getUserCustomizedMenu(
    userId: string,
    userRoles: string[],
    userPermissions: string[]
  ): Promise<UserMenuWithPreferences[]> {
    const preferences = await this.getUserPreferences(userId)

    // Obtenir le menu de base filtré par permissions
    const baseMenu = await this.menuConfigService.getFilteredMenuForUser(
      userId,
      userRoles,
      userPermissions
    )

    // Appliquer les préférences utilisateur
    return this.applyUserPreferencesToMenu(baseMenu, preferences)
  }

  private async applyUserPreferencesToMenu(
    menuItems: MenuTreeNode[],
    preferences: UserMenuPreferences
  ): Promise<UserMenuWithPreferences[]> {
    const itemPreferencesMap = new Map<string, UserMenuItemPreference>()

    // Charger toutes les préférences d'items pour cet utilisateur
    if (preferences.itemPreferences) {
      preferences.itemPreferences.forEach((pref) => {
        itemPreferencesMap.set(pref.menuItemId, pref)
      })
    }

    const processItems = (items: MenuTreeNode[]): UserMenuWithPreferences[] => {
      return items
        .map((item) => {
          if (!item.id) {
            throw new Error('MenuItem doit avoir un ID')
          }
          const itemPref = itemPreferencesMap.get(item.id)

          // Appliquer les préférences de l'item
          const customizedItem: UserMenuWithPreferences = {
            ...item,
            title: itemPref?.customTitle || item.title,
            icon: itemPref?.customIcon || item.icon,
            badge: itemPref?.customBadge || item.badge,
            children: processItems(item.children),
            userPreferences: itemPref
              ? {
                  isVisible: itemPref.isVisible,
                  isFavorite: itemPref.isFavorite,
                  isPinned: itemPref.isPinned,
                  customTitle: itemPref.customTitle,
                  customIcon: itemPref.customIcon,
                  customColor: itemPref.customColor,
                  customBadge: itemPref.customBadge,
                  customOrder: itemPref.customOrder,
                }
              : {
                  isVisible: item.id ? !preferences.isItemHidden(item.id) : true,
                  isFavorite: item.id ? preferences.isItemFavorite(item.id) : false,
                  isPinned: item.id ? preferences.isItemPinned(item.id) : false,
                },
          }

          return customizedItem
        })
        .filter((item) => {
          // Filtrer les items cachés si l'utilisateur utilise un layout personnalisé
          if (preferences.useCustomLayout) {
            return item.userPreferences?.isVisible !== false
          }
          return true
        })
        .sort((a, b) => {
          // Trier selon les préférences utilisateur
          const aOrder =
            a.userPreferences?.customOrder ??
            (a.id ? preferences.getItemOrder(a.id) : null) ??
            a.orderIndex
          const bOrder =
            b.userPreferences?.customOrder ??
            (b.id ? preferences.getItemOrder(b.id) : null) ??
            b.orderIndex

          // Les items épinglés en premier
          if (a.userPreferences?.isPinned && !b.userPreferences?.isPinned) return -1
          if (!a.userPreferences?.isPinned && b.userPreferences?.isPinned) return 1

          return aOrder - bOrder
        })
    }

    return processItems(menuItems)
  }

  // ===== TEMPLATES ET UTILITAIRES =====

  async createTemplatePreferences(
    userId: string,
    templateType: 'minimal' | 'business' | 'admin' | 'developer'
  ): Promise<UserMenuPreferences> {
    const activeConfig = await this.menuConfigService.findActiveConfiguration()
    const preferences = UserMenuPreferences.createDefault(userId, activeConfig?.id)

    switch (templateType) {
      case 'minimal':
        preferences.layoutType = 'compact'
        preferences.showIcons = false
        preferences.showBadges = false
        preferences.useCustomLayout = true
        break
      case 'business':
        preferences.layoutType = 'standard'
        preferences.showIcons = true
        preferences.showBadges = true
        preferences.useCustomLayout = false
        break
      case 'admin':
        preferences.layoutType = 'expanded'
        preferences.showIcons = true
        preferences.showBadges = true
        preferences.useCustomLayout = true
        break
      case 'developer':
        preferences.layoutType = 'compact'
        preferences.showIcons = true
        preferences.showBadges = false
        preferences.theme = 'dark'
        preferences.useCustomLayout = true
        break
    }

    return await this._preferencesRepository.save(preferences)
  }

  async exportUserPreferences(userId: string): Promise<Record<string, unknown>> {
    const preferences = await this.getUserPreferences(userId)

    return {
      userId,
      preferences: {
        useCustomLayout: preferences.useCustomLayout,
        layoutType: preferences.layoutType,
        showIcons: preferences.showIcons,
        showBadges: preferences.showBadges,
        allowCollapse: preferences.allowCollapse,
        theme: preferences.theme,
        customColors: preferences.customColors,
        favoriteItems: preferences.favoriteItems,
        hiddenItems: preferences.hiddenItems,
        pinnedItems: preferences.pinnedItems,
        customOrder: preferences.customOrder,
        shortcuts: preferences.shortcuts,
      },
      itemPreferences: preferences.itemPreferences?.map((pref) => ({
        menuItemId: pref.menuItemId,
        isVisible: pref.isVisible,
        isFavorite: pref.isFavorite,
        isPinned: pref.isPinned,
        customOrder: pref.customOrder,
        customTitle: pref.customTitle,
        customIcon: pref.customIcon,
        customColor: pref.customColor,
        customBadge: pref.customBadge,
      })),
      exportedAt: new Date().toISOString(),
    }
  }

  async importUserPreferences(
    userId: string,
    importData: Record<string, unknown>
  ): Promise<UserMenuPreferences> {
    // Supprimer les préférences existantes
    await this.resetUserPreferences(userId)

    // Créer les nouvelles préférences
    const preferences = await this.getUserPreferences(userId)
    Object.assign(preferences, importData.preferences)

    await this._preferencesRepository.save(preferences)

    // Créer les préférences d'items
    if (importData.itemPreferences) {
      const itemPreferences = (importData.itemPreferences as Record<string, unknown>[]).map(
        (pref: Record<string, unknown>) =>
          UserMenuItemPreference.create(preferences.id, pref.menuItemId as string, pref)
      )
      await this._itemPreferencesRepository.save(itemPreferences)
    }

    return await this.getUserPreferences(userId)
  }
}
