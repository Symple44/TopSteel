import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Tree,
  TreeChildren,
  TreeParent,
  UpdateDateColumn,
} from 'typeorm'

// Removed imports to avoid circular dependencies
// import { MenuConfiguration } from './menu-configuration.entity';
// import { MenuItemAction } from './menu-item-action.entity';

// Type definitions to avoid circular dependencies
type MenuConfiguration = {
  id: string
  code: string
  // Other MenuConfiguration properties would be here
}

type MenuItemAction = {
  id: string
  menuItemId: string
  // Other MenuItemAction properties would be here
}

/**
 * Menu item entity with hierarchical structure
 */
@Entity('menu_items')
@Tree('closure-table')
@Index(['menuId', 'code'])
@Index(['menuId', 'orderIndex'])
@Index(['parentId'])
@Index(['isActive'])
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  menuId!: string

  @Column({ type: 'uuid', nullable: true })
  parentId?: string

  @Column({ type: 'varchar', length: 100 })
  code!: string

  @Column({ type: 'varchar', length: 255 })
  label!: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  labelKey?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon?: string

  @Column({
    type: 'enum',
    enum: ['material', 'fontawesome', 'custom', 'svg'],
    default: 'material',
  })
  iconType!: 'material' | 'fontawesome' | 'custom' | 'svg'

  @Column({ type: 'varchar', length: 500, nullable: true })
  route?: string

  @Column({ type: 'jsonb', nullable: true })
  routeParams?: Record<string, unknown>

  @Column({ type: 'varchar', length: 1000, nullable: true })
  externalUrl?: string

  @Column({
    type: 'enum',
    enum: ['_self', '_blank', '_parent', '_top'],
    default: '_self',
  })
  target!: '_self' | '_blank' | '_parent' | '_top'

  @Column({
    type: 'enum',
    enum: ['link', 'divider', 'header', 'group', 'collapsible'],
    default: 'link',
  })
  type!: 'link' | 'divider' | 'header' | 'group' | 'collapsible'

  @Column({ type: 'varchar', length: 50, nullable: true })
  badge?: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  badgeColor?: string

  @Column({
    type: 'enum',
    enum: ['static', 'dynamic'],
    nullable: true,
  })
  badgeType?: 'static' | 'dynamic'

  @Column({ type: 'varchar', length: 255, nullable: true })
  badgeSource?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  permission?: string

  @Column({ type: 'jsonb', nullable: true })
  requiredRoles?: { roles: string[] }

  @Column({ type: 'jsonb', nullable: true })
  excludedRoles?: { roles: string[] }

  @Column({ type: 'integer', default: 0 })
  orderIndex!: number

  @Column({ type: 'boolean', default: true })
  isActive!: boolean

  @Column({ type: 'boolean', default: true })
  isVisible!: boolean

  @Column({ type: 'boolean', default: false })
  isDisabled!: boolean

  @Column({ type: 'varchar', length: 500, nullable: true })
  tooltip?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  cssClasses?: string

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  // Relations
  @ManyToOne('MenuConfiguration', 'items', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_id' })
  menu!: MenuConfiguration

  @TreeParent()
  @JoinColumn({ name: 'parent_id' })
  parent?: MenuItem

  @TreeChildren()
  children!: MenuItem[]

  @OneToMany('MenuItemAction', 'menuItem')
  actions!: MenuItemAction[]

  // Utility methods

  /**
   * Check if item has children
   */
  hasChildren(): boolean {
    return this.children && this.children.length > 0
  }

  /**
   * Check if item is a parent/group
   */
  isParent(): boolean {
    return this.type === 'group' || this.type === 'collapsible'
  }

  /**
   * Check if item is navigable
   */
  isNavigable(): boolean {
    return this.type === 'link' && (!!this.route || !!this.externalUrl)
  }

  /**
   * Get the navigation URL
   */
  getUrl(): string | null {
    if (this.externalUrl) {
      return this.externalUrl
    }

    if (this.route) {
      if (this.routeParams && Object.keys(this.routeParams).length > 0) {
        const params = new URLSearchParams()
        for (const [key, value] of Object.entries(this.routeParams)) {
          if (value != null) {
            params.append(key, String(value))
          }
        }
        const paramString = params.toString()
        return paramString ? `${this.route}?${paramString}` : this.route
      }
      return this.route
    }

    return null
  }

  /**
   * Check if user has permission to view this item
   */
  canView(userPermissions: string[], userRoles: string[]): boolean {
    // Check if disabled
    if (this.isDisabled || !this.isActive || !this.isVisible) {
      return false
    }

    // Check permission
    if (this.permission && !userPermissions.includes(this.permission)) {
      return false
    }

    // Check required roles
    if (this.requiredRoles?.roles?.length) {
      const hasRequiredRole = this.requiredRoles.roles.some((role) => userRoles.includes(role))
      if (!hasRequiredRole) {
        return false
      }
    }

    // Check excluded roles
    if (this.excludedRoles?.roles?.length) {
      const hasExcludedRole = this.excludedRoles.roles.some((role) => userRoles.includes(role))
      if (hasExcludedRole) {
        return false
      }
    }

    return true
  }

  /**
   * Get badge value (for dynamic badges)
   */
  async getBadgeValue(): Promise<string | null> {
    if (this.badgeType === 'static') {
      return this.badge || null
    }

    if (this.badgeType === 'dynamic' && this.badgeSource) {
      // This would be implemented to fetch from the badge source
      // For now, return the static badge
      return this.badge || null
    }

    return null
  }

  /**
   * Get metadata value
   */
  getMetadata<T = unknown>(key: string, defaultValue?: T): T | undefined {
    const value = this.metadata?.[key]
    return value !== undefined ? (value as T) : defaultValue
  }

  /**
   * Set metadata value
   */
  setMetadata(key: string, value: unknown): void {
    if (!this.metadata) {
      this.metadata = {}
    }
    this.metadata[key] = value
  }

  /**
   * Format for API response
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      code: this.code,
      label: this.label,
      labelKey: this.labelKey,
      icon: this.icon,
      iconType: this.iconType,
      route: this.route,
      routeParams: this.routeParams,
      externalUrl: this.externalUrl,
      target: this.target,
      type: this.type,
      badge: this.badge,
      badgeColor: this.badgeColor,
      badgeType: this.badgeType,
      permission: this.permission,
      requiredRoles: this.requiredRoles?.roles,
      excludedRoles: this.excludedRoles?.roles,
      orderIndex: this.orderIndex,
      isActive: this.isActive,
      isVisible: this.isVisible,
      isDisabled: this.isDisabled,
      tooltip: this.tooltip,
      cssClasses: this.cssClasses,
      hasChildren: this.hasChildren(),
      isNavigable: this.isNavigable(),
      url: this.getUrl(),
      metadata: this.metadata,
      children: this.children?.map((child) => child.toJSON()),
    }
  }
}
