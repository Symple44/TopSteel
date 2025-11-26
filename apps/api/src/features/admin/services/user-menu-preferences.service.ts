import { Prisma, type UserMenuPreferences, type UserMenuItemPreference } from '@prisma/client'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import { Injectable } from '@nestjs/common'

import { MenuConfigurationService, MenuTreeNode } from './menu-configuration.service'

/**
 * Service for managing user menu preferences
 *
 * Schema fields available:
 * - UserMenuPreferences: userId, societeId, theme, layout, customColors, shortcuts
 * - UserMenuItemPreference: userMenuPreferencesId, menuItemId, isVisible, order, customLabel
 *
 * Additional data is stored in JSON fields (customColors, shortcuts) or as computed values
 */

// Type definitions for JSON fields
interface CustomColors {
  primary?: string
  secondary?: string
  accent?: string
}

interface Shortcut {
  key: string
  href: string
  title: string
}

interface ExtendedPreferences {
  // Core fields from schema
  theme: string | null
  layout: string | null
  customColors: CustomColors | null
  shortcuts: Shortcut[] | null

  // Virtual fields (stored in JSON or computed)
  useCustomLayout?: boolean
  layoutType?: string
  showIcons?: boolean
  showBadges?: boolean
  allowCollapse?: boolean
  favoriteItems?: string[]
  hiddenItems?: string[]
  pinnedItems?: string[]
  customOrder?: Record<string, number>
}

// Helper functions
function getDefaultPreferences(): ExtendedPreferences {
  return {
    theme: 'light',
    layout: 'standard',
    customColors: null,
    shortcuts: null,
    useCustomLayout: false,
    layoutType: 'standard',
    showIcons: true,
    showBadges: true,
    allowCollapse: true,
    favoriteItems: [],
    hiddenItems: [],
    pinnedItems: [],
    customOrder: undefined,
  }
}

function createUserMenuItemPreferenceData(
  userPreferencesId: string,
  menuItemId: string,
  data?: Partial<UserMenuItemPreference>
): Prisma.UserMenuItemPreferenceCreateInput {
  return {
    preferences: {
      connect: { id: userPreferencesId }
    },
    menuItemId,
    isVisible: data?.isVisible ?? true,
    order: data?.order ?? null,
    customLabel: data?.customLabel ?? null,
  }
}

// Interface for extended item preferences with virtual fields
interface ExtendedItemPreference {
  id: string
  userMenuPreferencesId: string
  menuItemId: string
  isVisible: boolean
  order: number | null
  customLabel: string | null
  // Virtual fields (computed or from parent preferences JSON)
  isFavorite?: boolean
  isPinned?: boolean
  customTitle?: string
  customIcon?: string
  customColor?: string
  customBadge?: string
  customOrder?: number
}

export interface UpdateUserPreferencesDto {
  useCustomLayout?: boolean
  layoutType?: 'standard' | 'compact' | 'expanded' | 'minimal'
  showIcons?: boolean
  showBadges?: boolean
  allowCollapse?: boolean
  theme?: 'light' | 'dark' | 'auto'
  customColors?: CustomColors
  favoriteItems?: string[]
  hiddenItems?: string[]
  pinnedItems?: string[]
  customOrder?: Record<string, number>
}

export interface MenuItemAction {
  action: 'favorite' | 'unfavorite' | 'hide' | 'show' | 'pin' | 'unpin' | 'reorder'
  menuItemId: string
  value?: number // For reorder, contains the new order
}

export interface CustomMenuItemDto {
  menuItemId: string
  customLabel?: string
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
    customLabel?: string
    customIcon?: string
    customColor?: string
    customBadge?: string
    customOrder?: number
  }
}

type UserMenuPreferencesWithItems = UserMenuPreferences & {
  items: UserMenuItemPreference[]
}

@Injectable()
export class UserMenuPreferencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly menuConfigService: MenuConfigurationService
  ) {}

  // ===== PREFERENCE MANAGEMENT =====

  /**
   * Get user preferences, creating defaults if not found
   */
  async getUserPreferences(userId: string): Promise<UserMenuPreferencesWithItems> {
    let preferences = await this.prisma.userMenuPreferences.findUnique({
      where: { userId },
      include: { items: true },
    })

    if (!preferences) {
      // Create default preferences
      const defaults = getDefaultPreferences()
      preferences = await this.prisma.userMenuPreferences.create({
        data: {
          userId,
          theme: defaults.theme,
          layout: defaults.layout,
          customColors: ((defaults.customColors ?? Prisma.JsonNull) as unknown) as Prisma.InputJsonValue,
          shortcuts: ((defaults.shortcuts ?? Prisma.JsonNull) as unknown) as Prisma.InputJsonValue,
        },
        include: { items: true },
      })
    }

    return preferences
  }

  /**
   * Get extended preferences with virtual fields
   */
  private getExtendedPreferences(prefs: UserMenuPreferences): ExtendedPreferences {
    const extended: ExtendedPreferences = {
      theme: prefs.theme,
      layout: prefs.layout,
      customColors: prefs.customColors as CustomColors | null,
      shortcuts: prefs.shortcuts as Shortcut[] | null,
    }

    // Try to extract virtual fields from customColors JSON if they exist
    const colors = prefs.customColors as any
    if (colors && typeof colors === 'object') {
      extended.useCustomLayout = colors.useCustomLayout ?? false
      extended.layoutType = colors.layoutType ?? prefs.layout ?? 'standard'
      extended.showIcons = colors.showIcons ?? true
      extended.showBadges = colors.showBadges ?? true
      extended.allowCollapse = colors.allowCollapse ?? true
      extended.favoriteItems = colors.favoriteItems ?? []
      extended.hiddenItems = colors.hiddenItems ?? []
      extended.pinnedItems = colors.pinnedItems ?? []
      extended.customOrder = colors.customOrder ?? null
    }

    return extended
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    updateDto: UpdateUserPreferencesDto
  ): Promise<UserMenuPreferences> {
    const preferences = await this.getUserPreferences(userId)
    const extended = this.getExtendedPreferences(preferences)

    // Merge updates
    const updatedExtended: ExtendedPreferences = {
      ...extended,
      ...updateDto,
      theme: updateDto.theme ?? extended.theme,
      layout: updateDto.layoutType ?? extended.layout,
    }

    // Store virtual fields in customColors JSON
    const customColors = {
      ...(extended.customColors || {}),
      primary: updateDto.customColors?.primary ?? extended.customColors?.primary,
      secondary: updateDto.customColors?.secondary ?? extended.customColors?.secondary,
      accent: updateDto.customColors?.accent ?? extended.customColors?.accent,
      useCustomLayout: updatedExtended.useCustomLayout,
      layoutType: updatedExtended.layoutType,
      showIcons: updatedExtended.showIcons,
      showBadges: updatedExtended.showBadges,
      allowCollapse: updatedExtended.allowCollapse,
      favoriteItems: updatedExtended.favoriteItems,
      hiddenItems: updatedExtended.hiddenItems,
      pinnedItems: updatedExtended.pinnedItems,
      customOrder: updatedExtended.customOrder,
    }

    return await this.prisma.userMenuPreferences.update({
      where: { id: preferences.id },
      data: {
        theme: updatedExtended.theme,
        layout: updatedExtended.layout,
        customColors: customColors as Prisma.InputJsonValue,
      },
    })
  }

  /**
   * Reset user preferences to defaults
   */
  async resetUserPreferences(userId: string): Promise<UserMenuPreferences> {
    const preferences = await this.getUserPreferences(userId)

    // Delete all item preferences
    await this.prisma.userMenuItemPreference.deleteMany({
      where: { userMenuPreferencesId: preferences.id }
    })

    // Reset to defaults
    const defaults = getDefaultPreferences()
    return await this.prisma.userMenuPreferences.update({
      where: { id: preferences.id },
      data: {
        theme: defaults.theme,
        layout: defaults.layout,
        customColors: ((defaults.customColors ?? Prisma.JsonNull) as unknown) as Prisma.InputJsonValue,
        shortcuts: ((defaults.shortcuts ?? Prisma.JsonNull) as unknown) as Prisma.InputJsonValue,
      },
    })
  }

  // ===== MENU ITEM ACTIONS =====

  /**
   * Execute an action on a menu item
   */
  async executeMenuItemAction(userId: string, action: MenuItemAction): Promise<void> {
    const preferences = await this.getUserPreferences(userId)
    const extended = this.getExtendedPreferences(preferences)

    // Get or create item preference
    let itemPreference = await this.prisma.userMenuItemPreference.findFirst({
      where: {
        userMenuPreferencesId: preferences.id,
        menuItemId: action.menuItemId,
      },
    })

    // Update arrays in extended preferences
    const favoriteItems = new Set(extended.favoriteItems || [])
    const hiddenItems = new Set(extended.hiddenItems || [])
    const pinnedItems = new Set(extended.pinnedItems || [])
    const customOrder = { ...(extended.customOrder || {}) }

    let isVisible = itemPreference?.isVisible ?? true
    let order = itemPreference?.order ?? null

    switch (action.action) {
      case 'favorite':
        favoriteItems.add(action.menuItemId)
        break
      case 'unfavorite':
        favoriteItems.delete(action.menuItemId)
        break
      case 'hide':
        isVisible = false
        hiddenItems.add(action.menuItemId)
        break
      case 'show':
        isVisible = true
        hiddenItems.delete(action.menuItemId)
        break
      case 'pin':
        pinnedItems.add(action.menuItemId)
        break
      case 'unpin':
        pinnedItems.delete(action.menuItemId)
        break
      case 'reorder':
        order = action.value ?? null
        if (action.value !== undefined) {
          customOrder[action.menuItemId] = action.value
        }
        break
    }

    // Update or create item preference
    if (itemPreference) {
      await this.prisma.userMenuItemPreference.update({
        where: { id: itemPreference.id },
        data: { isVisible, order },
      })
    } else {
      await this.prisma.userMenuItemPreference.create({
        data: {
          preferences: { connect: { id: preferences.id } },
          menuItemId: action.menuItemId,
          isVisible,
          order,
        },
      })
    }

    // Update parent preferences with arrays
    const customColors = {
      ...(extended.customColors || {}),
      favoriteItems: Array.from(favoriteItems),
      hiddenItems: Array.from(hiddenItems),
      pinnedItems: Array.from(pinnedItems),
      customOrder,
    }

    await this.prisma.userMenuPreferences.update({
      where: { id: preferences.id },
      data: {
        customColors: customColors as Prisma.InputJsonValue,
      },
    })
  }

  /**
   * Update custom menu item properties
   */
  async updateCustomMenuItem(userId: string, customItemDto: CustomMenuItemDto): Promise<void> {
    const preferences = await this.getUserPreferences(userId)

    // Find existing item preference
    const itemPreference = await this.prisma.userMenuItemPreference.findFirst({
      where: {
        userMenuPreferencesId: preferences.id,
        menuItemId: customItemDto.menuItemId,
      },
    })

    const data: Prisma.UserMenuItemPreferenceUpdateInput = {
      customLabel: customItemDto.customLabel ?? undefined,
      order: customItemDto.customOrder ?? undefined,
    }

    if (itemPreference) {
      await this.prisma.userMenuItemPreference.update({
        where: { id: itemPreference.id },
        data,
      })
    } else {
      await this.prisma.userMenuItemPreference.create({
        data: {
          preferences: { connect: { id: preferences.id } },
          menuItemId: customItemDto.menuItemId,
          customLabel: customItemDto.customLabel ?? null,
          order: customItemDto.customOrder ?? null,
        },
      })
    }
  }

  // ===== SHORTCUTS MANAGEMENT =====

  /**
   * Add or update a shortcut
   */
  async addShortcut(
    userId: string,
    shortcut: { key: string; href: string; title: string }
  ): Promise<void> {
    const preferences = await this.getUserPreferences(userId)
    const shortcuts = ((preferences.shortcuts as unknown) as Shortcut[]) || []

    // Update existing or add new
    const existingIndex = shortcuts.findIndex((s) => s.key === shortcut.key)
    if (existingIndex >= 0) {
      shortcuts[existingIndex] = shortcut
    } else {
      shortcuts.push(shortcut)
    }

    await this.prisma.userMenuPreferences.update({
      where: { id: preferences.id },
      data: {
        shortcuts: (shortcuts as unknown) as Prisma.InputJsonValue,
      },
    })
  }

  /**
   * Remove a shortcut
   */
  async removeShortcut(userId: string, key: string): Promise<void> {
    const preferences = await this.getUserPreferences(userId)
    const shortcuts = ((preferences.shortcuts as unknown) as Shortcut[]) || []

    const filtered = shortcuts.filter((s) => s.key !== key)

    await this.prisma.userMenuPreferences.update({
      where: { id: preferences.id },
      data: {
        shortcuts: (filtered as unknown) as Prisma.InputJsonValue,
      },
    })
  }

  // ===== CUSTOMIZED MENU =====

  /**
   * Get user's customized menu with preferences applied
   */
  async getUserCustomizedMenu(
    userId: string,
    userRoles: string[],
    userPermissions: string[]
  ): Promise<UserMenuWithPreferences[]> {
    const preferences = await this.getUserPreferences(userId)

    // Get base menu filtered by permissions
    const baseMenu = await this.menuConfigService.getFilteredMenuForUser(
      userId,
      userRoles,
      userPermissions
    )

    // Apply user preferences to menu
    return this.applyUserPreferencesToMenu(baseMenu, preferences)
  }

  /**
   * Apply user preferences to menu items
   */
  private async applyUserPreferencesToMenu(
    menuItems: MenuTreeNode[],
    preferences: UserMenuPreferencesWithItems
  ): Promise<UserMenuWithPreferences[]> {
    const extended = this.getExtendedPreferences(preferences)

    // Create map of item preferences
    const itemPreferencesMap = new Map<string, UserMenuItemPreference>()
    preferences.items.forEach((pref) => {
      itemPreferencesMap.set(pref.menuItemId, pref)
    })

    const favoriteItems = new Set(extended.favoriteItems || [])
    const hiddenItems = new Set(extended.hiddenItems || [])
    const pinnedItems = new Set(extended.pinnedItems || [])
    const customOrder = extended.customOrder || {}

    const processItems = (items: MenuTreeNode[]): UserMenuWithPreferences[] => {
      return items
        .map((item) => {
          if (!item.id) {
            return {
              ...item,
              children: processItems(item.children || []),
            } as UserMenuWithPreferences
          }

          const itemPref = itemPreferencesMap.get(item.id)
          const isFavorite = favoriteItems.has(item.id)
          const isHidden = hiddenItems.has(item.id)
          const isPinned = pinnedItems.has(item.id)
          const itemCustomOrder = customOrder[item.id]

          // Build customized item
          const customizedItem: UserMenuWithPreferences = {
            ...item,
            title: itemPref?.customLabel || item.title,
            children: processItems(item.children || []),
            userPreferences: {
              isVisible: itemPref?.isVisible ?? !isHidden,
              isFavorite,
              isPinned,
              customLabel: itemPref?.customLabel ?? undefined,
              customOrder: itemPref?.order ?? itemCustomOrder ?? undefined,
            },
          }

          return customizedItem
        })
        .filter((item) => {
          // Filter hidden items if using custom layout
          if (extended.useCustomLayout) {
            return item.userPreferences?.isVisible !== false
          }
          return true
        })
        .sort((a, b) => {
          // Sort pinned items first
          const aPinned = a.userPreferences?.isPinned ?? false
          const bPinned = b.userPreferences?.isPinned ?? false

          if (aPinned && !bPinned) return -1
          if (!aPinned && bPinned) return 1

          // Then by custom order
          const aOrder = a.userPreferences?.customOrder ?? a.orderIndex ?? 0
          const bOrder = b.userPreferences?.customOrder ?? b.orderIndex ?? 0

          return aOrder - bOrder
        })
    }

    return processItems(menuItems)
  }

  // ===== TEMPLATES AND UTILITIES =====

  /**
   * Create template-based preferences
   */
  async createTemplatePreferences(
    userId: string,
    templateType: 'minimal' | 'business' | 'admin' | 'developer'
  ): Promise<UserMenuPreferences> {
    const defaults = getDefaultPreferences()
    let theme = 'light'
    let layout = 'standard'
    let customSettings: Partial<ExtendedPreferences> = {}

    switch (templateType) {
      case 'minimal':
        layout = 'compact'
        customSettings = {
          showIcons: false,
          showBadges: false,
          useCustomLayout: true,
        }
        break
      case 'business':
        layout = 'standard'
        customSettings = {
          showIcons: true,
          showBadges: true,
          useCustomLayout: false,
        }
        break
      case 'admin':
        layout = 'expanded'
        customSettings = {
          showIcons: true,
          showBadges: true,
          useCustomLayout: true,
        }
        break
      case 'developer':
        theme = 'dark'
        layout = 'compact'
        customSettings = {
          showIcons: true,
          showBadges: false,
          useCustomLayout: true,
        }
        break
    }

    const customColors = {
      ...defaults.customColors,
      ...customSettings,
    }

    return await this.prisma.userMenuPreferences.upsert({
      where: { userId },
      create: {
        userId,
        theme,
        layout,
        customColors: customColors as Prisma.InputJsonValue,
        shortcuts: Prisma.JsonNull,
      },
      update: {
        theme,
        layout,
        customColors: customColors as Prisma.InputJsonValue,
      },
    })
  }

  /**
   * Export user preferences
   */
  async exportUserPreferences(userId: string): Promise<Record<string, unknown>> {
    const preferences = await this.getUserPreferences(userId)
    const extended = this.getExtendedPreferences(preferences)

    return {
      userId,
      preferences: {
        theme: preferences.theme,
        layout: preferences.layout,
        customColors: extended.customColors,
        shortcuts: extended.shortcuts,
        useCustomLayout: extended.useCustomLayout,
        layoutType: extended.layoutType,
        showIcons: extended.showIcons,
        showBadges: extended.showBadges,
        allowCollapse: extended.allowCollapse,
        favoriteItems: extended.favoriteItems,
        hiddenItems: extended.hiddenItems,
        pinnedItems: extended.pinnedItems,
        customOrder: extended.customOrder,
      },
      itemPreferences: preferences.items.map((pref) => ({
        menuItemId: pref.menuItemId,
        isVisible: pref.isVisible,
        order: pref.order,
        customLabel: pref.customLabel,
      })),
      exportedAt: new Date().toISOString(),
    }
  }

  /**
   * Import user preferences
   */
  async importUserPreferences(
    userId: string,
    importData: Record<string, unknown>
  ): Promise<UserMenuPreferences> {
    // Reset existing preferences
    await this.resetUserPreferences(userId)

    const prefs = importData.preferences as any
    if (!prefs) {
      throw new Error('Invalid import data: missing preferences')
    }

    // Create custom colors with virtual fields
    const customColors = {
      primary: prefs.customColors?.primary,
      secondary: prefs.customColors?.secondary,
      accent: prefs.customColors?.accent,
      useCustomLayout: prefs.useCustomLayout,
      layoutType: prefs.layoutType,
      showIcons: prefs.showIcons,
      showBadges: prefs.showBadges,
      allowCollapse: prefs.allowCollapse,
      favoriteItems: prefs.favoriteItems,
      hiddenItems: prefs.hiddenItems,
      pinnedItems: prefs.pinnedItems,
      customOrder: prefs.customOrder,
    }

    // Update preferences
    const preferences = await this.prisma.userMenuPreferences.update({
      where: { userId },
      data: {
        theme: prefs.theme,
        layout: prefs.layout,
        customColors: customColors as Prisma.InputJsonValue,
        shortcuts: prefs.shortcuts as Prisma.InputJsonValue,
      },
      include: { items: true },
    })

    // Import item preferences
    if (importData.itemPreferences && Array.isArray(importData.itemPreferences)) {
      const itemPrefs = importData.itemPreferences as any[]

      for (const itemPref of itemPrefs) {
        await this.prisma.userMenuItemPreference.create({
          data: {
            preferences: { connect: { id: preferences.id } },
            menuItemId: itemPref.menuItemId,
            isVisible: itemPref.isVisible ?? true,
            order: itemPref.order ?? null,
            customLabel: itemPref.customLabel ?? null,
          },
        })
      }
    }

    return await this.getUserPreferences(userId)
  }
}
