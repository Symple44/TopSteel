import { MenuItem, MenuConfiguration, UserMenuPreference } from '@prisma/client'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { Request } from 'express'

// RequestWithUser type definition for menu admin operations
interface RequestWithUser extends Request {
  user: {
    id: string
    email: string
    roles?: string[]
    permissions?: string[]
  }
}

// Extended MenuItem interface for hierarchical operations
interface MenuItemHierarchy extends MenuItem {
  children: MenuItemHierarchy[]
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'


import { Roles } from '../../auth/decorators/roles.decorator'
import {
  Action,
  CombinedSecurityGuard,
  Resource,
} from '../../auth/security/guards/combined-security.guard'



import { MenuSyncOptions, MenuSyncService } from '../services/menu-sync.service'
import { PageDiscoveryService } from '../services/page-discovery.service'



@ApiTags('Admin - Menu Management')
@ApiBearerAuth()
@Controller('api/admin/menus')
@UseGuards(CombinedSecurityGuard)
@Resource('admin.menus')
export class MenuAdminController {
  constructor(
    private readonly pageDiscoveryService: PageDiscoveryService,
    private readonly menuSyncService: MenuSyncService,
    private readonly prisma: PrismaService
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
      filteredPages = filteredPages.filter((p) => p.module === module)
    }
    if (permission) {
      filteredPages = filteredPages.filter((p) => p.metadata.permissions?.includes(permission))
    }
    if (isPublic !== undefined) {
      filteredPages = filteredPages.filter((p) => p.metadata.isPublic === isPublic)
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
  async exportDiscovery(@Query('format') format: 'json' | 'markdown' = 'json') {
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
  async syncMenus(@Body() options: MenuSyncOptions) {
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
  async previewSync(@Body() options: MenuSyncOptions) {
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
    const where: any = {}

    if (isActive !== undefined) {
      where.isActive = isActive
    }
    if (societeId) {
      where.OR = [{ societeId }, { societeId: null }]
    }

    const menus = await this.prisma.menuConfiguration.findMany({ where })

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
  async getMenuConfiguration(@Param('id') id: string) {
    const menu = await this.prisma.menuConfiguration.findUnique({
      where: { id },
      include: { menuItems: true },
    })

    if (!menu) {
      return {
        success: false,
        error: 'Menu configuration not found',
      }
    }

    // Build hierarchical structure
    const itemsMap = new Map<string, MenuItemHierarchy>()
    const rootItems: MenuItemHierarchy[] = []

    // Convert items to hierarchical structure
    const hierarchicalItems: MenuItemHierarchy[] = menu.menuItems.map(
      (item) =>
        ({
          ...item,
          children: [] as MenuItemHierarchy[],
        }) as MenuItemHierarchy
    )

    hierarchicalItems.forEach((item) => {
      itemsMap.set(item.id, item)
    })

    hierarchicalItems.forEach((item) => {
      if (item.parentId) {
        const parent = itemsMap.get(item.parentId)
        if (parent) {
          parent.children.push(item)
        }
      } else {
        rootItems.push(item)
      }
    })

    // Sort items by order
    const sortItems = (items: MenuItemHierarchy[]) => {
      items.sort((a, b) => a.order - b.order)
      items.forEach((item) => {
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
  async createMenuConfiguration(@Body() data: Partial<MenuConfiguration>) {
    const saved = await this.prisma.menuConfiguration.create({
      data: {
        name: data.name || 'New Menu',
        societeId: data.societeId,
        description: data.description,
        isActive: data.isActive !== undefined ? data.isActive : true,
        isDefault: data.isDefault !== undefined ? data.isDefault : false,
      },
    })

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
  async updateMenuConfiguration(@Param('id') id: string, @Body() data: Partial<MenuConfiguration>) {
    const menu = await this.prisma.menuConfiguration.findUnique({ where: { id } })

    if (!menu) {
      return {
        success: false,
        error: 'Menu configuration not found',
      }
    }

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.societeId !== undefined) updateData.societeId = data.societeId
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault

    const saved = await this.prisma.menuConfiguration.update({
      where: { id },
      data: updateData,
    })

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
  async deleteMenuConfiguration(@Param('id') id: string) {
    try {
      await this.prisma.menuConfiguration.delete({ where: { id } })
      return {
        success: true,
        data: {
          deleted: 1,
        },
      }
    } catch (error) {
      return {
        success: false,
        data: {
          deleted: 0,
        },
      }
    }
  }

  /**
   * Add custom menu item
   */
  @Post('configurations/:menuId/items')
  @Roles('SUPER_ADMIN')
  @Action('create')
  @ApiOperation({ summary: 'Add custom menu item' })
  async addMenuItem(@Param('menuId') menuId: string, @Body() data: Partial<MenuItem>) {
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
  async updateMenuItem(@Param('id') id: string, @Body() data: Partial<MenuItem>) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } })

    if (!item) {
      return {
        success: false,
        error: 'Menu item not found',
      }
    }

    const updateData: any = {}
    if (data.label !== undefined) updateData.label = data.label
    if (data.icon !== undefined) updateData.icon = data.icon
    if (data.path !== undefined) updateData.path = data.path
    if (data.order !== undefined) updateData.order = data.order
    if (data.parentId !== undefined) updateData.parentId = data.parentId
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.isVisible !== undefined) updateData.isVisible = data.isVisible
    if (data.metadata !== undefined) updateData.metadata = data.metadata

    const saved = await this.prisma.menuItem.update({
      where: { id },
      data: updateData,
    })

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
  async deleteMenuItem(@Param('id') id: string) {
    try {
      await this.prisma.menuItem.delete({ where: { id } })
      return {
        success: true,
        data: {
          deleted: 1,
        },
      }
    } catch (error) {
      return {
        success: false,
        data: {
          deleted: 0,
        },
      }
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
  async validateMenuStructure(@Param('id') id: string) {
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
  async getUserPreferences(@Req() req: RequestWithUser, @Query('menuId') menuId?: string) {
    const userId = req.user.id

    const preference = await this.prisma.userMenuPreference.findUnique({
      where: { userId },
    })

    if (!preference) {
      return {
        success: true,
        data: null,
      }
    }

    return {
      success: true,
      data: preference,
    }
  }

  /**
   * Update user menu preferences
   */
  @Put('preferences/:menuId')
  @Action('update')
  @ApiOperation({ summary: 'Update user menu preferences' })
  async updateUserPreferences(
    @Req() req: RequestWithUser,
    @Param('menuId') menuId: string,
    @Body() data: Partial<UserMenuPreference>
  ) {
    const userId = req.user.id

    const existingPreference = await this.prisma.userMenuPreference.findUnique({
      where: { userId },
    })

    const updateData: any = {}
    if (data.menuData !== undefined) updateData.menuData = data.menuData as any
    if (data.preferences !== undefined) updateData.preferences = data.preferences as any
    if (data.societeId !== undefined) updateData.societeId = data.societeId

    const saved = existingPreference
      ? await this.prisma.userMenuPreference.update({
          where: { userId },
          data: updateData,
        })
      : await this.prisma.userMenuPreference.create({
          data: {
            userId,
            societeId: data.societeId,
            menuData: (data.menuData || {}) as any,
            preferences: data.preferences as any,
          },
        })

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
  async resetUserPreferences(@Req() req: RequestWithUser, @Param('menuId') menuId: string) {
    const userId = req.user.id

    try {
      await this.prisma.userMenuPreference.delete({
        where: { userId },
      })
      return {
        success: true,
        data: {
          reset: true,
        },
      }
    } catch (error) {
      return {
        success: false,
        data: {
          reset: false,
        },
      }
    }
  }

  /**
   * Export user preferences
   */
  @Get('preferences/export')
  @Action('export')
  @ApiOperation({ summary: 'Export user menu preferences' })
  async exportUserPreferences(@Req() req: RequestWithUser) {
    const userId = req.user.id

    const preference = await this.prisma.userMenuPreference.findUnique({
      where: { userId },
    })

    return {
      success: true,
      data: {
        userId,
        preferences: preference ? [preference] : [],
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
    @Req() req: RequestWithUser,
    @Body() data: { preferences: Partial<UserMenuPreference>[] }
  ) {
    const userId = req.user.id

    if (!data.preferences || data.preferences.length === 0) {
      return {
        success: false,
        data: {
          imported: 0,
          preferences: [],
        },
      }
    }

    const prefData = data.preferences[0]
    const existingPreference = await this.prisma.userMenuPreference.findUnique({
      where: { userId },
    })

    const saved = existingPreference
      ? await this.prisma.userMenuPreference.update({
          where: { userId },
          data: {
            menuData: (prefData.menuData || {}) as any,
            preferences: prefData.preferences as any,
            societeId: prefData.societeId,
          },
        })
      : await this.prisma.userMenuPreference.create({
          data: {
            userId,
            menuData: (prefData.menuData || {}) as any,
            preferences: prefData.preferences as any,
            societeId: prefData.societeId,
          },
        })

    return {
      success: true,
      data: {
        imported: 1,
        preferences: [saved],
      },
    }
  }
}

