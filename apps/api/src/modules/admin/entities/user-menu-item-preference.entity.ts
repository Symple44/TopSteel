import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { UserMenuPreferences } from './user-menu-preferences.entity'

@Entity('user_menu_item_preferences')
@Index(['userPreferencesId', 'menuItemId'], { unique: true })
export class UserMenuItemPreference {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  @Index()
  userPreferencesId!: string

  @Column({ type: 'uuid' })
  @Index()
  menuItemId!: string

  @Column({ type: 'boolean', default: true })
  isVisible!: boolean

  @Column({ type: 'boolean', default: false })
  isFavorite!: boolean

  @Column({ type: 'boolean', default: false })
  isPinned!: boolean

  @Column({ type: 'integer', nullable: true })
  customOrder?: number

  @Column({ type: 'varchar', length: 100, nullable: true })
  customTitle?: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  customIcon?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  customColor?: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  customBadge?: string

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  // Relations
  @ManyToOne(() => UserMenuPreferences, preferences => preferences.itemPreferences)
  @JoinColumn({ name: 'userPreferencesId' })
  userPreferences!: UserMenuPreferences

  // Méthodes utilitaires
  static create(
    userPreferencesId: string,
    menuItemId: string,
    options: Partial<UserMenuItemPreference> = {}
  ): UserMenuItemPreference {
    const preference = new UserMenuItemPreference()
    preference.userPreferencesId = userPreferencesId
    preference.menuItemId = menuItemId
    preference.isVisible = options.isVisible ?? true
    preference.isFavorite = options.isFavorite ?? false
    preference.isPinned = options.isPinned ?? false
    preference.customOrder = options.customOrder
    preference.customTitle = options.customTitle
    preference.customIcon = options.customIcon
    preference.customColor = options.customColor
    preference.customBadge = options.customBadge
    return preference
  }

  hasCustomization(): boolean {
    return !!(
      this.customTitle ||
      this.customIcon ||
      this.customColor ||
      this.customBadge ||
      this.customOrder !== undefined
    )
  }

  reset(): void {
    this.customTitle = undefined
    this.customIcon = undefined
    this.customColor = undefined
    this.customBadge = undefined
    this.customOrder = undefined
    this.isFavorite = false
    this.isPinned = false
    this.isVisible = true
  }
}