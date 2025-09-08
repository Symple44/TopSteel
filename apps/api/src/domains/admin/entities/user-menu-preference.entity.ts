import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm'

// import { MenuConfiguration } from './menu-configuration.entity';

// Type definition to avoid circular dependency
type MenuConfiguration = {
  id: string
  code: string
  // Other MenuConfiguration properties would be here
}

/**
 * User menu preferences entity
 */
@Entity('user_menu_preferences')
@Unique(['userId', 'menuId'])
@Index(['userId', 'menuId'])
export class UserMenuPreference {
  [key: string]: unknown

  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  userId!: string

  @Column({ type: 'uuid' })
  menuId!: string

  @Column({ type: 'jsonb', default: [] })
  hiddenItems!: string[]

  @Column({ type: 'jsonb', default: [] })
  pinnedItems!: string[]

  @Column({ type: 'jsonb', nullable: true })
  customOrder?: Record<string, number>

  @Column({ type: 'jsonb', default: [] })
  collapsedGroups!: string[]

  @Column({ type: 'jsonb', default: [] })
  favorites!: Array<{
    itemId: string
    label: string
    route: string
    icon?: string
    addedAt: Date
  }>

  @Column({ type: 'jsonb', default: [] })
  recentItems!: Array<{
    itemId: string
    label: string
    route: string
    icon?: string
    accessedAt: Date
    accessCount: number
  }>

  @Column({ type: 'jsonb', default: {} })
  preferences!: Record<string, unknown>

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  // Relations
  @ManyToOne('MenuConfiguration', 'userPreferences', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_id' })
  menu!: MenuConfiguration

  // Utility methods

  /**
   * Check if an item is hidden
   */
  isItemHidden(itemId: string): boolean {
    return this.hiddenItems.includes(itemId)
  }

  /**
   * Check if an item is pinned
   */
  isItemPinned(itemId: string): boolean {
    return this.pinnedItems.includes(itemId)
  }

  /**
   * Check if a group is collapsed
   */
  isGroupCollapsed(groupId: string): boolean {
    return this.collapsedGroups.includes(groupId)
  }

  /**
   * Toggle item visibility
   */
  toggleItemVisibility(itemId: string): void {
    const index = this.hiddenItems.indexOf(itemId)
    if (index > -1) {
      this.hiddenItems.splice(index, 1)
    } else {
      this.hiddenItems.push(itemId)
    }
  }

  /**
   * Toggle item pin status
   */
  toggleItemPin(itemId: string): void {
    const index = this.pinnedItems.indexOf(itemId)
    if (index > -1) {
      this.pinnedItems.splice(index, 1)
    } else {
      this.pinnedItems.push(itemId)
    }
  }

  /**
   * Toggle group collapse state
   */
  toggleGroupCollapse(groupId: string): void {
    const index = this.collapsedGroups.indexOf(groupId)
    if (index > -1) {
      this.collapsedGroups.splice(index, 1)
    } else {
      this.collapsedGroups.push(groupId)
    }
  }

  /**
   * Add to favorites
   */
  addToFavorites(item: { itemId: string; label: string; route: string; icon?: string }): void {
    // Check if already in favorites
    if (!this.favorites.some((fav) => fav.itemId === item.itemId)) {
      this.favorites.push({
        ...item,
        addedAt: new Date(),
      })
    }
  }

  /**
   * Remove from favorites
   */
  removeFromFavorites(itemId: string): void {
    this.favorites = this.favorites.filter((fav) => fav.itemId !== itemId)
  }

  /**
   * Add to recent items
   */
  addToRecentItems(item: { itemId: string; label: string; route: string; icon?: string }): void {
    const existingIndex = this.recentItems.findIndex((recent) => recent.itemId === item.itemId)

    if (existingIndex > -1) {
      // Update existing item
      this.recentItems[existingIndex].accessedAt = new Date()
      this.recentItems[existingIndex].accessCount++

      // Move to front
      const [recentItem] = this.recentItems.splice(existingIndex, 1)
      this.recentItems.unshift(recentItem)
    } else {
      // Add new item
      this.recentItems.unshift({
        ...item,
        accessedAt: new Date(),
        accessCount: 1,
      })

      // Keep only last 10 items
      if (this.recentItems.length > 10) {
        this.recentItems = this.recentItems.slice(0, 10)
      }
    }
  }

  /**
   * Clear recent items
   */
  clearRecentItems(): void {
    this.recentItems = []
  }

  /**
   * Get custom order for an item
   */
  getCustomOrder(itemId: string): number | null {
    return this.customOrder?.[itemId] ?? null
  }

  /**
   * Set custom order for items
   */
  setCustomOrder(order: Record<string, number>): void {
    this.customOrder = order
  }

  /**
   * Get preference value
   */
  getPreference<T = unknown>(key: string, defaultValue?: T): T | undefined {
    const value = this.preferences?.[key]
    return value !== undefined ? (value as T) : defaultValue
  }

  /**
   * Set preference value
   */
  setPreference(key: string, value: unknown): void {
    if (!this.preferences) {
      this.preferences = {}
    }
    this.preferences[key] = value
  }

  /**
   * Reset all preferences to defaults
   */
  resetToDefaults(): void {
    this.hiddenItems = []
    this.pinnedItems = []
    this.customOrder = undefined
    this.collapsedGroups = []
    this.favorites = []
    this.recentItems = []
    this.preferences = {}
  }

  /**
   * Export preferences for backup
   */
  exportPreferences(): Record<string, unknown> {
    return {
      hiddenItems: this.hiddenItems,
      pinnedItems: this.pinnedItems,
      customOrder: this.customOrder,
      collapsedGroups: this.collapsedGroups,
      favorites: this.favorites,
      recentItems: this.recentItems,
      preferences: this.preferences,
      exportedAt: new Date().toISOString(),
    }
  }

  /**
   * Import preferences from backup
   */
  importPreferences(data: Record<string, unknown>): void {
    if (data.hiddenItems && Array.isArray(data.hiddenItems)) {
      this.hiddenItems = data.hiddenItems.filter((item): item is string => typeof item === 'string')
    }
    if (data.pinnedItems && Array.isArray(data.pinnedItems)) {
      this.pinnedItems = data.pinnedItems.filter((item): item is string => typeof item === 'string')
    }
    if (data.customOrder && typeof data.customOrder === 'object' && data.customOrder !== null) {
      this.customOrder = data.customOrder as Record<string, number>
    }
    if (data.collapsedGroups && Array.isArray(data.collapsedGroups)) {
      this.collapsedGroups = data.collapsedGroups.filter(
        (item): item is string => typeof item === 'string'
      )
    }
    if (data.favorites && Array.isArray(data.favorites)) {
      this.favorites = data.favorites.filter(
        (
          item
        ): item is {
          itemId: string
          label: string
          route: string
          icon?: string
          addedAt: Date
        } => {
          return (
            typeof item === 'object' &&
            item !== null &&
            'itemId' in item &&
            typeof item.itemId === 'string' &&
            'label' in item &&
            typeof item.label === 'string' &&
            'route' in item &&
            typeof item.route === 'string' &&
            'addedAt' in item &&
            item.addedAt instanceof Date
          )
        }
      )
    }
    if (data.recentItems && Array.isArray(data.recentItems)) {
      this.recentItems = data.recentItems.filter(
        (
          item
        ): item is {
          itemId: string
          label: string
          route: string
          icon?: string
          accessedAt: Date
          accessCount: number
        } => {
          return (
            typeof item === 'object' &&
            item !== null &&
            'itemId' in item &&
            typeof item.itemId === 'string' &&
            'label' in item &&
            typeof item.label === 'string' &&
            'route' in item &&
            typeof item.route === 'string' &&
            'accessedAt' in item &&
            item.accessedAt instanceof Date &&
            'accessCount' in item &&
            typeof item.accessCount === 'number'
          )
        }
      )
    }
    if (data.preferences && typeof data.preferences === 'object' && data.preferences !== null) {
      this.preferences = data.preferences as Record<string, unknown>
    }
  }

  /**
   * Format for API response
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      userId: this.userId,
      menuId: this.menuId,
      hiddenItems: this.hiddenItems,
      pinnedItems: this.pinnedItems,
      customOrder: this.customOrder,
      collapsedGroups: this.collapsedGroups,
      favorites: this.favorites,
      recentItems: this.recentItems,
      preferences: this.preferences,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
