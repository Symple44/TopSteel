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
  Request,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import { Public } from '../../../core/multi-tenant'
import type { MenuConfiguration } from '@prisma/client'
import type {
  CreateMenuConfigDto,
  MenuConfigurationService,
  UpdateMenuConfigDto,
} from '../services/menu-configuration.service'

// Local enum definition for menu item types
enum MenuItemType {
  FOLDER = 'F',
  PROGRAM = 'P',
  LINK = 'L',
  DATA_VIEW = 'D',
}

@Controller('admin/menus')
@Public() // Bypass global TenantGuard - JwtAuthGuard handles JWT auth
@UseGuards(JwtAuthGuard)
export class AdminMenusController {
  constructor(private readonly menuConfigService: MenuConfigurationService) {}

  // ===== GESTION DES CONFIGURATIONS =====

  @Get('configurations')
  async getAllConfigurations(): Promise<MenuConfiguration[]> {
    return await this.menuConfigService.findAllConfigurations()
  }

  @Get('configurations/active')
  async getActiveConfiguration() {
    const config = await this.menuConfigService.findActiveConfiguration()
    if (!config) {
      return null
    }

    const menuTree = await this.menuConfigService.getMenuTree(config.id)
    return {
      configuration: config,
      menuTree,
    }
  }

  @Get('configurations/:id')
  async getConfiguration(@Param('id') id: string) {
    const config = await this.menuConfigService.findConfigurationById(id)
    const menuTree = await this.menuConfigService.getMenuTree(id)

    return {
      configuration: config,
      menuTree,
    }
  }

  @Post('configurations')
  async createConfiguration(
    @Body() createDto: CreateMenuConfigDto,
    @Request() req: Record<string, unknown>
  ): Promise<MenuConfiguration> {
    const userId =

      (req.user as { id?: string; sub?: string; email?: string })?.sub ||
      (req.user as { id?: string; sub?: string; email?: string })?.id ||
      'system'
    return await this.menuConfigService.createConfiguration(createDto, userId)
  }

  @Put('configurations/:id')
  async updateConfiguration(
    @Param('id') id: string,
    @Body() updateDto: UpdateMenuConfigDto,
    @Request() req: Record<string, unknown>
  ): Promise<MenuConfiguration> {
    const userId =
      (req.user as { id?: string; sub?: string; email?: string })?.sub ||
      (req.user as { id?: string; sub?: string; email?: string })?.id ||
      'system'
    return await this.menuConfigService.updateConfiguration(id, updateDto, userId)
  }

  @Delete('configurations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteConfiguration(@Param('id') id: string): Promise<void> {
    await this.menuConfigService.deleteConfiguration(id)
  }

  @Post('configurations/:id/activate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async activateConfiguration(@Param('id') id: string): Promise<void> {
    await this.menuConfigService.activateConfiguration(id)
  }

  // ===== GESTION DES ITEMS DE MENU =====

  @Get('configurations/:configId/tree')
  async getMenuTree(@Param('configId') configId: string) {
    return await this.menuConfigService.getMenuTree(configId)
  }

  @Post('configurations/:configId/data-view')
  async addDataViewItem(
    @Param('configId') configId: string,
    @Body() body: {
      queryBuilderId: string
      title: string
      icon?: string
      parentId?: string
    }
  ) {
    return await this.menuConfigService.createDataViewMenuItem(
      configId,
      body.queryBuilderId,
      body.title,
      body.icon,
      body.parentId
    )
  }

  // ===== TEMPLATES ET UTILITAIRES =====

  @Post('configurations/default')
  async createDefaultConfiguration(
    @Request() _req: Record<string, unknown>
  ): Promise<MenuConfiguration> {
    return await this.menuConfigService.createDefaultConfiguration()
  }

  @Get('configurations/:id/export')
  async exportConfiguration(@Param('id') id: string) {
    return await this.menuConfigService.exportConfiguration(id)
  }

  @Post('configurations/import')
  async importConfiguration(
    @Body() data: Record<string, unknown>,
    @Request() req: Record<string, unknown>
  ): Promise<MenuConfiguration> {
    const userId =
      (req.user as { id?: string; sub?: string; email?: string })?.sub ||
      (req.user as { id?: string; sub?: string; email?: string })?.id ||
      'system'
    return await this.menuConfigService.importConfiguration(data, userId)
  }

  // ===== TYPES ET MÉTADONNÉES =====

  @Get('menu-types')
  getMenuTypes() {
    return {
      types: [
        {
          value: MenuItemType.FOLDER,
          label: 'Dossier',
          description: 'Conteneur pour regrouper des éléments',
          icon: 'Folder',
          canHaveChildren: true,
          requiredFields: ['title', 'icon'],
        },
        {
          value: MenuItemType.PROGRAM,
          label: 'Programme',
          description: "Lien vers un module ou une page de l'application",
          icon: 'Play',
          canHaveChildren: false,
          requiredFields: ['title', 'programId'],
        },
        {
          value: MenuItemType.LINK,
          label: 'Lien externe',
          description: 'Lien vers une URL externe (nouvel onglet)',
          icon: 'ExternalLink',
          canHaveChildren: false,
          requiredFields: ['title', 'externalUrl'],
        },
        {
          value: MenuItemType.DATA_VIEW,
          label: 'Vue Data',
          description: 'Vue créée avec le Query Builder',
          icon: 'BarChart3',
          canHaveChildren: false,
          requiredFields: ['title', 'queryBuilderId'],
        },
      ],
    }
  }

  @Get('available-programs')
  getAvailablePrograms() {
    return {
      programs: [
        { id: '/dashboard', name: 'Tableau de bord', icon: 'Home' },
        { id: '/admin/users', name: 'Gestion des utilisateurs', icon: 'Users' },
        { id: '/admin/roles', name: 'Gestion des rôles', icon: 'Shield' },
        { id: '/admin/groups', name: 'Gestion des groupes', icon: 'Building' },
        { id: '/admin/menus', name: 'Gestion des menus', icon: 'Menu' },
        { id: '/query-builder', name: 'Query Builder', icon: 'Database' },
        { id: '/settings', name: 'Paramètres', icon: 'Settings' },
      ],
    }
  }

  @Get('available-icons')
  getAvailableIcons() {
    return {
      icons: [
        'Home',
        'Users',
        'Shield',
        'Building',
        'Menu',
        'Database',
        'Settings',
        'Folder',
        'Play',
        'ExternalLink',
        'BarChart3',
        'Table',
        'PieChart',
        'LineChart',
        'Calendar',
        'Clock',
        'Mail',
        'Phone',
        'MapPin',
        'Star',
        'Heart',
        'Bookmark',
        'Tag',
        'Search',
        'Filter',
        'Plus',
        'Minus',
        'Edit',
        'Trash',
        'Download',
        'Upload',
        'Lock',
        'Unlock',
        'Eye',
        'EyeOff',
        'Bell',
        'BellOff',
      ],
    }
  }

  // ===== MENU FILTRÉ POUR UTILISATEURS =====

  @Post('filtered-menu')
  async getFilteredMenuForUser(
    @Body() body: { userId: string; userRoles: string[]; userPermissions: string[] }
  ) {
    return await this.menuConfigService.getFilteredMenuForUser(
      body.userId,
      body.userRoles,
      body.userPermissions
    )
  }

  @Post('user-data-view')
  async addUserDataView(
    @Body() body: {
      queryBuilderId: string
      title: string
      icon?: string
    },
    @Request() req: Record<string, unknown>
  ) {
    const userId =
      (req.user as { id?: string; sub?: string; email?: string })?.sub ||
      (req.user as { id?: string; sub?: string; email?: string })?.id ||
      'system'
    return await this.menuConfigService.addUserDataViewToMenu(
      userId,
      body.queryBuilderId,
      body.title,
      body.icon
    )
  }
}
