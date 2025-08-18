import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { MenuItem } from './menu-item.entity'
import { UserMenuPreference } from './user-menu-preference.entity'

/**
 * Menu configuration entity
 */
@Entity('menu_configurations')
@Index(['code'], { unique: true })
@Index(['societeId'])
@Index(['roleType'])
@Index(['isActive'])
export class MenuConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 100, unique: true })
  code!: string

  @Column({ type: 'varchar', length: 255 })
  name!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({
    type: 'enum',
    enum: ['main', 'sidebar', 'toolbar', 'context', 'mobile'],
    default: 'main',
  })
  type!: 'main' | 'sidebar' | 'toolbar' | 'context' | 'mobile'

  @Column({
    type: 'enum',
    enum: ['top', 'bottom', 'left', 'right', 'center'],
    default: 'top',
  })
  position!: 'top' | 'bottom' | 'left' | 'right' | 'center'

  @Column({ type: 'boolean', default: true })
  isActive!: boolean

  @Column({ type: 'boolean', default: false })
  isDefault!: boolean

  @Column({ type: 'uuid', nullable: true })
  societeId?: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  roleType?: string

  @Column({ type: 'jsonb', default: {} })
  config!: Record<string, unknown>

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string

  // Relations
  @OneToMany(
    () => MenuItem,
    (menuItem) => menuItem.menu
  )
  items!: MenuItem[]

  @OneToMany(
    () => UserMenuPreference,
    (preference) => preference.menu
  )
  userPreferences!: UserMenuPreference[]

  // Utility methods

  /**
   * Check if menu is global (not société-specific)
   */
  isGlobal(): boolean {
    return !this.societeId
  }

  /**
   * Check if menu is role-specific
   */
  isRoleSpecific(): boolean {
    return !!this.roleType
  }

  /**
   * Get menu visibility scope
   */
  getScope(): 'global' | 'societe' | 'role' {
    if (this.roleType) return 'role'
    if (this.societeId) return 'societe'
    return 'global'
  }

  /**
   * Check if menu is applicable for user context
   */
  isApplicableFor(societeId?: string, roleType?: string): boolean {
    // Global menu is always applicable
    if (this.isGlobal() && !this.roleType) {
      return true
    }

    // Check société match
    if (this.societeId && this.societeId !== societeId) {
      return false
    }

    // Check role match
    if (this.roleType && this.roleType !== roleType) {
      return false
    }

    return true
  }

  /**
   * Get configuration value
   */
  getConfig<T>(key: string, defaultValue?: T): T | undefined {
    return this.config?.[key] ?? defaultValue
  }

  /**
   * Set configuration value
   */
  setConfig(key: string, value: any): void {
    if (!this.config) {
      this.config = {}
    }
    this.config[key] = value
  }

  /**
   * Merge configuration
   */
  mergeConfig(config: Record<string, any>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get metadata value
   */
  getMetadata<T>(key: string, defaultValue?: T): T | undefined {
    return this.metadata?.[key] ?? defaultValue
  }

  /**
   * Set metadata value
   */
  setMetadata(key: string, value: any): void {
    if (!this.metadata) {
      this.metadata = {}
    }
    this.metadata[key] = value
  }

  /**
   * Format for API response
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      description: this.description,
      type: this.type,
      position: this.position,
      isActive: this.isActive,
      isDefault: this.isDefault,
      scope: this.getScope(),
      societeId: this.societeId,
      roleType: this.roleType,
      config: this.config,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
