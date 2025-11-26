import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { getErrorMessage } from '../../../core/common/utils'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import { OptimizedCacheService } from '../../../infrastructure/cache/redis-optimized.service'
import { MenuRawService } from '../services/menu-raw.service'
import { Public } from '../../../core/multi-tenant'

@Controller('admin/menu-raw')
@Public() // Bypass TenantGuard - JwtAuthGuard handles authentication
@UseGuards(JwtAuthGuard)
export class MenuRawController {
  constructor(
    private readonly menuRawService: MenuRawService,
    private readonly cacheService: OptimizedCacheService
  ) {}

  @Get('configurations')
  async getAllConfigurations() {
    const configs = await this.menuRawService.findAllConfigurations()
    return {
      success: true,
      data: configs,
    }
  }

  @Get('configurations/active')
  async getActiveConfiguration() {
    const cacheKey = 'menu:active-configuration'

    // Vérifier le cache d'abord
    const cachedResult = await this.cacheService.get(cacheKey)
    if (cachedResult) {
      return cachedResult
    }

    const config = await this.menuRawService.findActiveConfiguration()
    if (!config) {
      return {
        success: false,
        message: 'Aucune configuration active trouvée',
        data: null,
      }
    }

    const menuTree = await this.menuRawService.getMenuTree(config.id)
    const result = {
      success: true,
      data: {
        configuration: config,
        menuTree,
      },
    }

    // Mettre en cache pour 10 minutes (600 secondes)
    await this.cacheService.set(cacheKey, result, 600)

    return result
  }

  @Get('tree')
  async getMenuTree(@Query('configId') configId?: string) {
    const tree = await this.menuRawService.getMenuTree(configId)
    return {
      success: true,
      data: tree,
    }
  }

  @Post('filtered-menu')
  async getFilteredMenuForUser(
    @Body() body: { userId: string; userRoles: string[]; userPermissions: string[] }
  ) {
    const filteredMenu = await this.menuRawService.getFilteredMenuForUser(
      body.userId,
      body.userRoles,
      body.userPermissions
    )

    return {
      success: true,
      data: filteredMenu,
    }
  }

  @Get('test')
  async testConnection() {
    try {
      const configs = await this.menuRawService.findAllConfigurations()
      return {
        success: true,
        message: 'Service fonctionnel!',
        configCount: configs.length,
      }
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? getErrorMessage(error) : getErrorMessage(error),
      }
    }
  }
}
