import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { CombinedSecurityGuard, Resource, Action } from '../../auth/security/guards/combined-security.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { PageDiscoveryService } from '../services/page-discovery.service'
import { MenuSyncService, MenuSyncOptions } from '../services/menu-sync.service'
import { MenuConfiguration } from '../entities/menu-configuration.entity'
import { MenuItem } from '../entities/menu-item.entity'
import { UserMenuPreference } from '../entities/user-menu-preference.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@ApiTags('Admin - Menu Management')
@ApiBearerAuth()
@Controller('api/admin/menus')
@UseGuards(CombinedSecurityGuard)
@Resource('admin.menus')
export class MenuAdminController {
  constructor(
    private readonly pageDiscoveryService: PageDiscoveryService,
    private readonly menuSyncService: MenuSyncService,
    @InjectRepository(MenuConfiguration, 'auth')
    private readonly menuConfigRepository: Repository<MenuConfiguration>,
    @InjectRepository(MenuItem, 'auth')
    private readonly menuItemRepository: Repository<MenuItem>,
    @InjectRepository(UserMenuPreference, 'auth')
    private readonly userPreferenceRepository: Repository<UserMenuPreference>
  ) {}

  /**
   * Discover all pages/routes in the application
   */
  @Get('discovery/pages')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Action('discover')
  @ApiOperation({ summary: 'Discover all pages/routes in the application' })
  @ApiResponse({ status: 200, description: 'Pages discovered successfully' })
  async discoverPages(
    @Query('module') module?: string,
    @Query('permission') permission?: string,
    @Query('isPublic') isPublic?: boolean
  ) {
    const pages = await this.pageDiscoveryService.discoverAllPages()

    // Apply filters if provided
    let filteredPages = pages
    if (module) {
      filteredPages = filteredPages.filter(p => p.module === module)
    }
    if (permission) {
      filteredPages = filteredPages.filter(p => 
        p.metadata.permissions?.includes(permission)
      )
    }
    if (isPublic !== undefined) {
      filteredPages = filteredPages.filter(p => 
        p.metadata.isPublic === isPublic
      )
    }

    const statistics = this.pageDiscoveryService.getModuleStatistics()

    return {
      success: true,
      data: {
        pages: filteredPages,
        total: filteredPages.length,
        statistics: Array.from(statistics.entries()).map(([name, info]) => ({
          module: name,
          ...info,
          permissions: Array.from(info.permissions),
        })),
      },
    }
  }

  /**
   * Get module statistics
   */
  @Get('discovery/statistics')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Action('read')
  @ApiOperation({ summary: 'Get module statistics' })
  async getModuleStatistics() {
    await this.pageDiscoveryService.discoverAllPages()
    const statistics = this.pageDiscoveryService.getModuleStatistics()

    return {
      success: true,
      data: Array.from(statistics.entries()).map(([name, info]) => ({
        module: name,
        ...info,
        permissions: Array.from(info.permissions),
      })),
    }
  }

  /**
   * Export discovered pages documentation
   */
  @Get('discovery/export')
  @Roles('SUPER_ADMIN')
  @Action('export')
  @ApiOperation({ summary: 'Export discovered pages documentation' })
  async exportDiscovery(
    @Query('format') format: 'json' | 'markdown' = 'json'
  ) {
    await this.pageDiscoveryService.discoverAllPages()

    if (format === 'markdown') {
      const documentation = this.pageDiscoveryService.generateDocumentation()
      return {
        success: true,
        data: {
          format: 'markdown',
          content: documentation,
        },
      }
    }

    const json = this.pageDiscoveryService.exportToJson()
    return {
      success: true,
      data: {
        format: 'json',
        content: JSON.parse(json),
      },
    }
  }

  /**
   * Synchronize menus with discovered pages
   */
  @Post('sync')
  @Roles('SUPER_ADMIN')
  @Action('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Synchronize menus with discovered pages' })
  async syncMenus(
    @Body() options: MenuSyncOptions
  ) {
    const result = await this.menuSyncService.syncMenus(options)

    return {
      success: result.errors.length === 0,
      data: result,
    }
  }

  /**
   * Preview sync changes
   */
  @Post('sync/preview')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Action('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Preview sync changes without applying them' })
  async previewSync(
    @Body() options: MenuSyncOptions
  ) {
    const preview = await this.menuSyncService.previewSync(options)

    return {
      success: true,
      data: preview,
    }
  }

  /**
   * Get sync status
   */
  @Get('sync/status')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Action('read')
  @ApiOperation({ summary: 'Get menu sync status' })
  async getSyncStatus() {
    const status = await this.menuSyncService.getSyncStatus()

    return {
      success: true,
      data: status,
    }
  }

  /**
   * Get all menu configurations
   */
  @Get('configurations')
  @Roles('ADMIN')
  @Action('read')
  @ApiOperation({ summary: 'Get all menu configurations' })
  async getMenuConfigurations(
    @Query('type') type?: string,
    @Query('isActive') isActive?: boolean,
    @Query('societeId') societeId?: string
  ) {
    const query = this.menuConfigRepository.createQueryBuilder('menu')

    if (type) {
      query.andWhere('menu.type = :type', { type })
    }
    if (isActive !== undefined) {
      query.andWhere('menu.isActive = :isActive', { isActive })
    }
    if (societeId) {
      query.andWhere('(menu.societeId = :societeId OR menu.societeId IS NULL)', { societeId })
    }

    const menus = await query.getMany()

    return {
      success: true,
      data: menus,
    }
  }

  /**
   * Get menu configuration with items
   */
  @Get('configurations/:id')
  @Roles('ADMIN')
  @Action('read')
  @ApiOperation({ summary: 'Get menu configuration with items' })
  async getMenuConfiguration(
    @Param('id') id: string
  ) {
    const menu = await this.menuConfigRepository.findOne({
      where: { id },
      relations: ['items'],
    })

    if (!menu) {
      return {
        success: false,
        error: 'Menu configuration not found',
      }
    }

    // Build hierarchical structure
    const itemsMap = new Map<string, MenuItem>()
    const rootItems: MenuItem[] = []

    menu.items.forEach(item => {
      itemsMap.set(item.id, item)
      item.children = []
    })

    menu.items.forEach(item => {
      if (item.parentId) {
        const parent = itemsMap.get(item.parentId)
        if (parent) {
          parent.children.push(item)
        }
      } else {
        rootItems.push(item)
      }
    })

    // Sort items by orderIndex
    const sortItems = (items: MenuItem[]) => {
      items.sort((a, b) => a.orderIndex - b.orderIndex)
      items.forEach(item => {
        if (item.children?.length) {
          sortItems(item.children)
        }
      })
    }

    sortItems(rootItems)

    return {
      success: true,
      data: {
        ...menu,
        items: rootItems,
      },
    }
  }

  /**
   * Create menu configuration
   */
  @Post('configurations')
  @Roles('SUPER_ADMIN')
  @Action('create')
  @ApiOperation({ summary: 'Create menu configuration' })
  async createMenuConfiguration(
    @Body() data: Partial<MenuConfiguration>
  ) {
    const menu = this.menuConfigRepository.create(data)
    const saved = await this.menuConfigRepository.save(menu)

    return {
      success: true,
      data: saved,
    }
  }

  /**
   * Update menu configuration
   */
  @Put('configurations/:id')
  @Roles('SUPER_ADMIN')
  @Action('update')
  @ApiOperation({ summary: 'Update menu configuration' })
  async updateMenuConfiguration(
    @Param('id') id: string,
    @Body() data: Partial<MenuConfiguration>
  ) {
    const menu = await this.menuConfigRepository.findOne({ where: { id } })

    if (!menu) {
      return {
        success: false,
        error: 'Menu configuration not found',
      }
    }

    Object.assign(menu, data)
    const saved = await this.menuConfigRepository.save(menu)

    return {
      success: true,
      data: saved,
    }
  }

  /**
   * Delete menu configuration
   */
  @Delete('configurations/:id')
  @Roles('SUPER_ADMIN')
  @Action('delete')
  @ApiOperation({ summary: 'Delete menu configuration' })
  async deleteMenuConfiguration(
    @Param('id') id: string
  ) {
    const result = await this.menuConfigRepository.delete(id)

    return {
      success: result.affected > 0,
      data: {
        deleted: result.affected,
      },
    }
  }

  /**
   * Add custom menu item
   */
  @Post('configurations/:menuId/items')
  @Roles('SUPER_ADMIN')
  @Action('create')
  @ApiOperation({ summary: 'Add custom menu item' })
  async addMenuItem(
    @Param('menuId') menuId: string,
    @Body() data: Partial<MenuItem>
  ) {
    const item = await this.menuSyncService.addCustomMenuItem(menuId, data)

    return {
      success: true,
      data: item,
    }
  }

  /**
   * Update menu item
   */
  @Put('items/:id')
  @Roles('SUPER_ADMIN')
  @Action('update')
  @ApiOperation({ summary: 'Update menu item' })
  async updateMenuItem(
    @Param('id') id: string,
    @Body() data: Partial<MenuItem>
  ) {
    const item = await this.menuItemRepository.findOne({ where: { id } })

    if (!item) {
      return {
        success: false,
        error: 'Menu item not found',
      }
    }

    Object.assign(item, data)
    const saved = await this.menuItemRepository.save(item)

    return {
      success: true,
      data: saved,
    }
  }

  /**
   * Delete menu item
   */
  @Delete('items/:id')
  @Roles('SUPER_ADMIN')
  @Action('delete')
  @ApiOperation({ summary: 'Delete menu item' })
  async deleteMenuItem(
    @Param('id') id: string
  ) {
    const result = await this.menuItemRepository.delete(id)

    return {
      success: result.affected > 0,
      data: {
        deleted: result.affected,
      },
    }
  }

  /**
   * Validate menu structure
   */
  @Post('configurations/:id/validate')
  @Roles('ADMIN')
  @Action('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate menu structure' })
  async validateMenuStructure(
    @Param('id') id: string
  ) {
    const validation = await this.menuSyncService.validateMenuStructure(id)

    return {
      success: validation.valid,
      data: validation,
    }
  }

  /**
   * Get user menu preferences
   */
  @Get('preferences')
  @Action('read')
  @ApiOperation({ summary: 'Get current user menu preferences' })
  async getUserPreferences(
    @Req() req: any,
    @Query('menuId') menuId?: string
  ) {
    const userId = req.user.id

    const query = this.userPreferenceRepository.createQueryBuilder('pref')
      .where('pref.userId = :userId', { userId })

    if (menuId) {
      query.andWhere('pref.menuId = :menuId', { menuId })
    }

    const preferences = await query.getMany()

    return {
      success: true,
      data: preferences,
    }
  }

  /**
   * Update user menu preferences
   */
  @Put('preferences/:menuId')
  @Action('update')
  @ApiOperation({ summary: 'Update user menu preferences' })
  async updateUserPreferences(
    @Req() req: any,
    @Param('menuId') menuId: string,
    @Body() data: Partial<UserMenuPreference>
  ) {
    const userId = req.user.id

    let preference = await this.userPreferenceRepository.findOne({
      where: { userId, menuId },
    })

    if (!preference) {
      preference = this.userPreferenceRepository.create({
        userId,
        menuId,
        ...data,
      })
    } else {
      Object.assign(preference, data)
    }

    const saved = await this.userPreferenceRepository.save(preference)

    return {
      success: true,
      data: saved,
    }
  }

  /**
   * Reset user menu preferences
   */
  @Delete('preferences/:menuId')
  @Action('delete')
  @ApiOperation({ summary: 'Reset user menu preferences to defaults' })
  async resetUserPreferences(
    @Req() req: any,
    @Param('menuId') menuId: string
  ) {
    const userId = req.user.id

    const result = await this.userPreferenceRepository.delete({
      userId,
      menuId,
    })

    return {
      success: result.affected > 0,
      data: {
        reset: true,
      },
    }
  }

  /**
   * Export user preferences
   */
  @Get('preferences/export')
  @Action('export')
  @ApiOperation({ summary: 'Export user menu preferences' })
  async exportUserPreferences(
    @Req() req: any
  ) {
    const userId = req.user.id

    const preferences = await this.userPreferenceRepository.find({
      where: { userId },
    })

    const exportData = preferences.map(pref => pref.exportPreferences())

    return {
      success: true,
      data: {
        userId,
        preferences: exportData,
        exportedAt: new Date(),
      },
    }
  }

  /**
   * Import user preferences
   */
  @Post('preferences/import')
  @Action('import')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import user menu preferences' })
  async importUserPreferences(
    @Req() req: any,
    @Body() data: { preferences: any[] }
  ) {
    const userId = req.user.id
    const imported = []

    for (const prefData of data.preferences) {
      const menuId = prefData.menuId
      if (!menuId) continue

      let preference = await this.userPreferenceRepository.findOne({
        where: { userId, menuId },
      })

      if (!preference) {
        preference = this.userPreferenceRepository.create({
          userId,
          menuId,
        })
      }

      preference.importPreferences(prefData)
      const saved = await this.userPreferenceRepository.save(preference)
      imported.push(saved)
    }

    return {
      success: true,
      data: {
        imported: imported.length,
        preferences: imported,
      },
    }
  }
}