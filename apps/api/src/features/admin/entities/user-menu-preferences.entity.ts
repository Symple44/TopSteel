import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
// Removed import to avoid circular dependencies
// import { UserMenuItemPreference } from './user-menu-item-preference.entity'

@Entity('user_menu_preferences_admin')
export class UserMenuPreferences {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid', unique: true })
  @Index('user_menu_preferences_admin_userId_unique', { unique: true })
  userId!: string

  @Column({ type: 'uuid', nullable: true })
  baseConfigId?: string // Configuration de base (définie par admin)

  @Column({ type: 'boolean', default: false })
  useCustomLayout!: boolean // Utiliser un layout personnalisé

  @Column({ type: 'varchar', length: 20, default: 'standard' })
  layoutType!: 'standard' | 'compact' | 'expanded' | 'minimal'

  @Column({ type: 'boolean', default: true })
  showIcons!: boolean

  @Column({ type: 'boolean', default: false })
  showBadges!: boolean

  @Column({ type: 'boolean', default: true })
  allowCollapse!: boolean

  @Column({ type: 'varchar', length: 20, default: 'auto' })
  theme!: 'light' | 'dark' | 'auto'

  @Column({ type: 'json', nullable: true })
  customColors?: {
    primary?: string
    secondary?: string
    accent?: string
  }

  @Column({ type: 'json', nullable: true })
  favoriteItems?: string[] // IDs des items favoris

  @Column({ type: 'json', nullable: true })
  hiddenItems?: string[] // IDs des items masqués

  @Column({ type: 'json', nullable: true })
  pinnedItems?: string[] // IDs des items épinglés en haut

  @Column({ type: 'json', nullable: true })
  customOrder?: Record<string, number> // Ordre personnalisé des items

  @Column({ type: 'json', nullable: true })
  shortcuts?: Array<{
    key: string
    href: string
    title: string
  }>

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown>

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  // Relations
  @OneToMany('UserMenuItemPreference', 'userPreferences')
  itemPreferences!: unknown[]

  // Méthodes utilitaires
  static createDefault(userId: string, baseConfigId?: string): UserMenuPreferences {
    const preferences = new UserMenuPreferences()
    preferences.userId = userId
    preferences.baseConfigId = baseConfigId
    preferences.useCustomLayout = false
    preferences.layoutType = 'standard'
    preferences.showIcons = true
    preferences.showBadges = false
    preferences.allowCollapse = true
    preferences.theme = 'auto'
    preferences.favoriteItems = []
    preferences.hiddenItems = []
    preferences.pinnedItems = []
    preferences.customOrder = {}
    preferences.shortcuts = []
    return preferences
  }

  isItemHidden(itemId: string): boolean {
    return this.hiddenItems?.includes(itemId) || false
  }

  isItemFavorite(itemId: string): boolean {
    return this.favoriteItems?.includes(itemId) || false
  }

  isItemPinned(itemId: string): boolean {
    return this.pinnedItems?.includes(itemId) || false
  }

  getItemOrder(itemId: string): number {
    return this.customOrder?.[itemId] ?? 999
  }

  addFavorite(itemId: string): void {
    if (!this.favoriteItems) this.favoriteItems = []
    if (!this.favoriteItems.includes(itemId)) {
      this.favoriteItems.push(itemId)
    }
  }

  removeFavorite(itemId: string): void {
    if (this.favoriteItems) {
      this.favoriteItems = this.favoriteItems.filter((id) => id !== itemId)
    }
  }

  hideItem(itemId: string): void {
    if (!this.hiddenItems) this.hiddenItems = []
    if (!this.hiddenItems.includes(itemId)) {
      this.hiddenItems.push(itemId)
    }
  }

  showItem(itemId: string): void {
    if (this.hiddenItems) {
      this.hiddenItems = this.hiddenItems.filter((id) => id !== itemId)
    }
  }

  pinItem(itemId: string): void {
    if (!this.pinnedItems) this.pinnedItems = []
    if (!this.pinnedItems.includes(itemId)) {
      this.pinnedItems.push(itemId)
    }
  }

  unpinItem(itemId: string): void {
    if (this.pinnedItems) {
      this.pinnedItems = this.pinnedItems.filter((id) => id !== itemId)
    }
  }
}
