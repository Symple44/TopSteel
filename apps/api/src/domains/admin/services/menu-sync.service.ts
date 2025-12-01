/**
 * Service migré de TypeORM vers Prisma
 * Migration automatique + ajustements manuels
 */

import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { MenuItem, MenuConfiguration, UserMenuPreference } from '@prisma/client'
import { TenantPrismaService } from '../../../core/multi-tenant/tenant-prisma.service'
import { OptimizedCacheService } from '../../../infrastructure/cache/redis-optimized.service'
import { DiscoveredPage, PageDiscoveryService } from './page-discovery.service'

/**
 * Sync options for menu synchronization
 */
export interface MenuSyncOptions {
  autoCreate?: boolean // Automatically create menu items for new pages
  autoRemove?: boolean // Automatically remove menu items for deleted pages
  updateExisting?: boolean // Update existing menu items
  preserveCustom?: boolean // Preserve custom menu items
  dryRun?: boolean // Perform dry run without making changes
  menuId?: string // Specific menu to sync (null = all menus)
  modules?: string[] // Specific modules to sync
  skipPatterns?: RegExp[] // Patterns to skip
}

/**
 * Sync result
 */
export interface MenuSyncResult {
  created: number
  updated: number
  removed: number
  skipped: number
  errors: string[]
  items: {
    created: MenuItem[]
    updated: MenuItem[]
    removed: MenuItem[]
  }
}

/**
 * Menu item mapping configuration
 */
export interface MenuItemMapping {
  pathPattern: RegExp
  label: string
  labelKey?: string
  icon?: string
  iconType?: 'material' | 'fontawesome' | 'custom' | 'svg'
  parent?: string // Parent menu item code
  order?: number
  type?: 'link' | 'divider' | 'header' | 'group' | 'collapsible'
  badge?: string
  badgeColor?: string
  hidden?: boolean
}

/**
 * Service for synchronizing discovered pages with menu system
 */
@Injectable()
export class MenuSyncService {
  private readonly logger = new Logger(MenuSyncService.name)

  // Default menu item mappings
  private readonly defaultMappings: MenuItemMapping[] = [
    // Dashboard
    {
      pathPattern: /^\/dashboard$/,
      label: 'Tableau de bord',
      labelKey: 'menu.dashboard',
      icon: 'dashboard',
      order: 1,
    },
    // Inventory
    {
      pathPattern: /^\/inventory$/,
      label: 'Inventaire',
      labelKey: 'menu.inventory',
      icon: 'inventory',
      type: 'group',
      order: 100,
    },
    {
      pathPattern: /^\/inventory\/articles/,
      label: 'Articles',
      labelKey: 'menu.inventory.articles',
      icon: 'category',
      parent: 'inventory',
      order: 101,
    },
    {
      pathPattern: /^\/inventory\/materials/,
      label: 'Matériaux',
      labelKey: 'menu.inventory.materials',
      icon: 'build',
      parent: 'inventory',
      order: 102,
    },
    {
      pathPattern: /^\/inventory\/movements/,
      label: 'Mouvements',
      labelKey: 'menu.inventory.movements',
      icon: 'swap_horiz',
      parent: 'inventory',
      order: 103,
    },
    // Partners
    {
      pathPattern: /^\/partners$/,
      label: 'Partenaires',
      labelKey: 'menu.partners',
      icon: 'people',
      type: 'group',
      order: 200,
    },
    {
      pathPattern: /^\/partners\/customers/,
      label: 'Clients',
      labelKey: 'menu.partners.customers',
      icon: 'person',
      parent: 'partners',
      order: 201,
    },
    {
      pathPattern: /^\/partners\/suppliers/,
      label: 'Fournisseurs',
      labelKey: 'menu.partners.suppliers',
      icon: 'local_shipping',
      parent: 'partners',
      order: 202,
    },
    // Orders
    {
      pathPattern: /^\/orders/,
      label: 'Commandes',
      labelKey: 'menu.orders',
      icon: 'shopping_cart',
      order: 300,
    },
    // Production
    {
      pathPattern: /^\/production/,
      label: 'Production',
      labelKey: 'menu.production',
      icon: 'factory',
      order: 400,
    },
    // Reports
    {
      pathPattern: /^\/reports/,
      label: 'Rapports',
      labelKey: 'menu.reports',
      icon: 'assessment',
      order: 500,
    },
    // Admin
    {
      pathPattern: /^\/admin$/,
      label: 'Administration',
      labelKey: 'menu.admin',
      icon: 'settings',
      type: 'group',
      order: 900,
    },
    {
      pathPattern: /^\/admin\/users/,
      label: 'Utilisateurs',
      labelKey: 'menu.admin.users',
      icon: 'person',
      parent: 'admin',
      order: 901,
    },
    {
      pathPattern: /^\/admin\/roles/,
      label: 'Rôles',
      labelKey: 'menu.admin.roles',
      icon: 'security',
      parent: 'admin',
      order: 902,
    },
    {
      pathPattern: /^\/admin\/settings/,
      label: 'Paramètres',
      labelKey: 'menu.admin.settings',
      icon: 'tune',
      parent: 'admin',
      order: 903,
    },
    {
      pathPattern: /^\/admin\/audit/,
      label: 'Audit',
      labelKey: 'menu.admin.audit',
      icon: 'history',
      parent: 'admin',
      order: 904,
    },
  ]

  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly pageDiscoveryService: PageDiscoveryService,
    private readonly cacheService: OptimizedCacheService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /** Client Prisma avec filtrage automatique par tenant */
  private get prisma() {
    return this.tenantPrisma.client
  }

  /**
   * Synchronize discovered pages with menu system
   */
  async syncMenus(options: MenuSyncOptions = {}): Promise<MenuSyncResult> {
    const {
      autoCreate = true,
      autoRemove = false,
      updateExisting = true,
      preserveCustom = true,
      dryRun = false,
      menuId,
      modules,
      skipPatterns = [],
    } = options

    this.logger.log(`Starting menu synchronization (dryRun: ${dryRun})`)

    const result: MenuSyncResult = {
      created: 0,
      updated: 0,
      removed: 0,
      skipped: 0,
      errors: [],
      items: {
        created: [],
        updated: [],
        removed: [],
      },
    }

    try {
      // Discover all pages
      const discoveredPages = await this.pageDiscoveryService.discoverAllPages()

      // Filter pages by modules if specified
      const pagesToProcess = modules
        ? discoveredPages.filter((p) => modules.includes(p.module))
        : discoveredPages

      // Get menus to sync
      const menus = menuId
        ? await this.prisma.menuConfiguration.findMany({ where: { id: menuId } })
        : await this.prisma.menuConfiguration.findMany({ where: { isActive: true } })

      for (const menu of menus) {
        this.logger.debug(`Processing menu: ${menu.name} (${menu.id})`)

        // Get existing menu items
        const existingItems = await this.prisma.menuItem.findMany({
          where: { menuConfigurationId: menu.id },
          include: { roles: true, permissions: true },
        })

        const existingItemsMap = new Map(
          existingItems.map((item) => [item.path || item.id, item])
        )

        // Process discovered pages
        for (const page of pagesToProcess) {
          // Skip if matches skip patterns
          if (skipPatterns.some((pattern) => pattern.test(page.fullPath))) {
            result.skipped++
            continue
          }

          // Skip if page doesn't require menu entry
          if (this.shouldSkipPage(page)) {
            result.skipped++
            continue
          }

          // Find mapping for this page
          const mapping = this.findMapping(page)
          if (!mapping) {
            result.skipped++
            continue
          }

          // Check if item exists
          const existingItem = existingItemsMap.get(page.fullPath)

          if (existingItem) {
            if (updateExisting) {
              // Update existing item
              const updated = await this.updateMenuItem(existingItem, page, mapping, dryRun)
              if (updated) {
                result.updated++
                result.items.updated.push(updated)
              }
            }
          } else if (autoCreate) {
            // Create new item
            const created = await this.createMenuItem(menu, page, mapping, dryRun)
            if (created) {
              result.created++
              result.items.created.push(created)
            }
          }
        }

        // Remove orphaned items
        if (autoRemove && !preserveCustom) {
          const pagePathsSet = new Set(pagesToProcess.map((p) => p.fullPath))

          for (const item of existingItems) {
            const metadata = item.metadata as any
            if (item.path && !pagePathsSet.has(item.path) && !metadata?.custom) {
              if (!dryRun) {
                await this.prisma.menuItem.delete({ where: { id: item.id } })
              }
              result.removed++
              result.items.removed.push(item)
            }
          }
        }
      }

      // Clear cache after sync
      if (!dryRun) {
        await this.cacheService.invalidateGroup('menus')

        // Emit sync completed event
        this.eventEmitter.emit('menu.sync.completed', {
          result,
          timestamp: new Date(),
        })
      }

      this.logger.log(
        `Menu sync completed: ${result.created} created, ${result.updated} updated, ${result.removed} removed, ${result.skipped} skipped`
      )
    } catch (error) {
      this.logger.error('Menu sync failed:', error)
      result.errors.push(error instanceof Error ? error.message : String(error))
    }

    return result
  }

  /**
   * Check if a page should be skipped
   */
  private shouldSkipPage(page: DiscoveredPage): boolean {
    // Skip API endpoints that don't need menu entries
    if (page.fullPath.includes('/api/')) {
      return true
    }

    // Skip auth endpoints
    if (page.fullPath.match(/\/(login|logout|register|forgot-password|reset-password)/)) {
      return true
    }

    // Skip health checks and system endpoints
    if (page.fullPath.match(/\/(health|metrics|info|version)/)) {
      return true
    }

    // Skip if method is not GET (menus typically link to GET endpoints)
    if (page.method !== 'GET') {
      return true
    }

    // Skip if path has parameters (detail pages)
    if (page.fullPath.includes(':')) {
      return true
    }

    return false
  }

  /**
   * Find mapping for a page
   */
  private findMapping(page: DiscoveredPage): MenuItemMapping | null {
    for (const mapping of this.defaultMappings) {
      if (mapping.pathPattern.test(page.fullPath)) {
        return mapping
      }
    }

    // Generate default mapping if none found
    return this.generateDefaultMapping(page)
  }

  /**
   * Generate default mapping for a page
   */
  private generateDefaultMapping(page: DiscoveredPage): MenuItemMapping | null {
    const pathSegments = page.fullPath.split('/').filter(Boolean)

    if (pathSegments.length === 0) {
      return null
    }

    const label = this.humanizeString(pathSegments[pathSegments.length - 1])
    const _code = pathSegments.join('_')

    return {
      pathPattern: new RegExp(`^${page.fullPath}$`),
      label,
      labelKey: `menu.${pathSegments.join('.')}`,
      icon: 'folder',
      order: 999,
    }
  }

  /**
   * Create a new menu item
   */
  private async createMenuItem(
    menu: MenuConfiguration,
    page: DiscoveredPage,
    mapping: MenuItemMapping,
    dryRun: boolean
  ): Promise<MenuItem | null> {
    if (dryRun) {
      return {
        id: 'dry-run-' + this.generateCode(page.fullPath),
        menuConfigurationId: menu.id,
        parentId: null,
        label: mapping.label,
        icon: mapping.icon || null,
        path: page.fullPath,
        order: mapping.order || 999,
        isActive: true,
        isVisible: !mapping.hidden,
        metadata: {
          labelKey: mapping.labelKey,
          iconType: mapping.iconType || 'material',
          type: mapping.type || 'link',
          permission: page.metadata.permissions?.[0],
          requiredRoles: page.metadata.roles,
          badge: mapping.badge,
          badgeColor: mapping.badgeColor,
          auto: true,
          discoveredAt: new Date().toISOString(),
          module: page.module,
          controller: page.controller,
          handler: page.handler,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as MenuItem
    }

    const parentItem = mapping.parent
      ? await this.prisma.menuItem.findFirst({
          where: {
            menuConfigurationId: menu.id,
            label: mapping.parent
          },
        })
      : null

    return await this.prisma.menuItem.create({
      data: {
        menuConfigurationId: menu.id,
        parentId: parentItem?.id,
        label: mapping.label,
        icon: mapping.icon,
        path: page.fullPath,
        order: mapping.order || 999,
        isActive: true,
        isVisible: !mapping.hidden,
        metadata: {
          labelKey: mapping.labelKey,
          iconType: mapping.iconType || 'material',
          type: mapping.type || 'link',
          permission: page.metadata.permissions?.[0],
          requiredRoles: page.metadata.roles,
          badge: mapping.badge,
          badgeColor: mapping.badgeColor,
          auto: true,
          discoveredAt: new Date(),
          module: page.module,
          controller: page.controller,
          handler: page.handler,
        },
      },
    })
  }

  /**
   * Update an existing menu item
   */
  private async updateMenuItem(
    item: MenuItem,
    page: DiscoveredPage,
    mapping: MenuItemMapping,
    dryRun: boolean
  ): Promise<MenuItem | null> {
    const metadata = item.metadata as any

    // Check if update is needed
    const needsUpdate =
      metadata?.permission !== page.metadata.permissions?.[0] ||
      metadata?.requiredRoles?.join(',') !== page.metadata.roles?.join(',') ||
      item.label !== mapping.label ||
      item.icon !== mapping.icon

    if (!needsUpdate) {
      return null
    }

    if (dryRun) {
      return {
        ...item,
        metadata: {
          ...metadata,
          permission: page.metadata.permissions?.[0],
          requiredRoles: page.metadata.roles,
        },
      } as MenuItem
    }

    // Update metadata
    const updatedMetadata = {
      ...metadata,
      permission: page.metadata.permissions?.[0],
      requiredRoles: page.metadata.roles,
      lastSyncedAt: new Date(),
      module: page.module,
      controller: page.controller,
      handler: page.handler,
    }

    return await this.prisma.menuItem.update({
      where: { id: item.id },
      data: {
        label: mapping.label,
        icon: mapping.icon,
        metadata: updatedMetadata,
      },
    })
  }

  /**
   * Generate code from path
   */
  private generateCode(path: string): string {
    return path
      .split('/')
      .filter(Boolean)
      .join('_')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
  }

  /**
   * Humanize a string
   */
  private humanizeString(str: string): string {
    return str
      .replace(/[-_]/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<{
    lastSync?: Date
    totalPages: number
    totalMenuItems: number
    orphanedItems: number
    unmappedPages: number
  }> {
    const pages = await this.pageDiscoveryService.discoverAllPages()
    const menuItems = await this.prisma.menuItem.findMany()

    const pagePathsSet = new Set(
      pages.filter((p) => !this.shouldSkipPage(p)).map((p) => p.fullPath)
    )

    const orphanedItems = menuItems.filter((item) => {
      const metadata = item.metadata as any
      return item.path && !pagePathsSet.has(item.path) && !metadata?.custom
    }).length

    const mappedPaths = new Set(menuItems.map((item) => item.path).filter(Boolean))
    const unmappedPages = pages.filter(
      (page) => !this.shouldSkipPage(page) && !mappedPaths.has(page.fullPath)
    ).length

    const lastSync = menuItems
      .map((item) => {
        const metadata = item.metadata as any
        return metadata?.lastSyncedAt ? new Date(metadata.lastSyncedAt) : null
      })
      .filter((date): date is Date => date instanceof Date)
      .sort((a, b) => a.getTime() - b.getTime())
      .pop()

    return {
      lastSync,
      totalPages: pages.length,
      totalMenuItems: menuItems.length,
      orphanedItems,
      unmappedPages,
    }
  }

  /**
   * Preview sync changes
   */
  async previewSync(options: MenuSyncOptions = {}): Promise<{
    toCreate: Array<{ path: string; label: string; module: string }>
    toUpdate: Array<{ path: string; changes: string[] }>
    toRemove: Array<{ path: string; label: string }>
  }> {
    const result = await this.syncMenus({ ...options, dryRun: true })

    return {
      toCreate: result.items.created.map((item) => {
        const metadata = item.metadata as any
        return {
          path: item.path || '',
          label: item.label,
          module: typeof metadata?.module === 'string' ? metadata.module : 'unknown',
        }
      }),
      toUpdate: result.items.updated.map((item) => ({
        path: item.path || '',
        changes: ['permissions', 'roles'], // Simplified for now
      })),
      toRemove: result.items.removed.map((item) => ({
        path: item.path || '',
        label: item.label,
      })),
    }
  }

  /**
   * Add custom menu item
   */
  async addCustomMenuItem(menuId: string, item: Partial<MenuItem>): Promise<MenuItem> {
    const menu = await this.prisma.menuConfiguration.findUnique({
      where: { id: menuId },
    })

    if (!menu) {
      throw new Error(`Menu ${menuId} not found`)
    }

    const itemMetadata = item.metadata as any
    const saved = await this.prisma.menuItem.create({
      data: {
        menuConfigurationId: menuId,
        parentId: item.parentId,
        label: item.label || 'New Item',
        icon: item.icon,
        path: item.path,
        order: item.order || 999,
        isActive: item.isActive !== undefined ? item.isActive : true,
        isVisible: item.isVisible !== undefined ? item.isVisible : true,
        metadata: {
          ...itemMetadata,
          custom: true,
          createdAt: new Date(),
        },
      },
    })

    // Clear cache
    await this.cacheService.invalidateGroup('menus')

    return saved
  }

  /**
   * Validate menu structure
   */
  async validateMenuStructure(menuId: string): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    const menuItems = await this.prisma.menuItem.findMany({
      where: { menuConfigurationId: menuId },
      include: { roles: true, permissions: true },
    })

    // Check for orphaned parent references
    const itemIds = new Set(menuItems.map((item) => item.id))
    for (const item of menuItems) {
      if (item.parentId && !itemIds.has(item.parentId)) {
        errors.push(`Item ${item.label} (${item.id}) references non-existent parent ${item.parentId}`)
      }
    }

    // Check for circular references
    const visited = new Set<string>()
    const checkCircular = (itemId: string, path: string[] = []): boolean => {
      if (path.includes(itemId)) {
        errors.push(`Circular reference detected: ${path.join(' -> ')} -> ${itemId}`)
        return true
      }

      if (visited.has(itemId)) {
        return false
      }

      visited.add(itemId)
      const item = menuItems.find((i) => i.id === itemId)

      if (item?.parentId) {
        return checkCircular(item.parentId, [...path, itemId])
      }

      return false
    }

    for (const item of menuItems) {
      checkCircular(item.id)
    }

    // Check for duplicate paths
    const paths = new Map<string, MenuItem[]>()
    for (const item of menuItems) {
      if (item.path) {
        const items = paths.get(item.path) || []
        items.push(item)
        paths.set(item.path, items)
      }
    }

    Array.from(paths.entries()).forEach(([path, items]) => {
      if (items.length > 1) {
        warnings.push(`Duplicate path '${path}' found in ${items.length} items`)
      }
    })

    // Check for missing permissions
    for (const item of menuItems) {
      const metadata = item.metadata as any
      if (!metadata?.permission && !metadata?.custom) {
        warnings.push(`Item ${item.label} has no permission defined`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }
}
