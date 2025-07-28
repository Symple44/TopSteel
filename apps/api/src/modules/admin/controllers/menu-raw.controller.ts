import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { MenuRawService } from '../services/menu-raw.service'

@Controller('admin/menu-raw')
@UseGuards(JwtAuthGuard)
export class MenuRawController {
  constructor(private readonly menuRawService: MenuRawService) {}

  @Get('configurations')
  async getAllConfigurations() {
    const configs = await this.menuRawService.findAllConfigurations()
    return {
      success: true,
      data: configs
    }
  }

  @Get('configurations/active')
  async getActiveConfiguration() {
    const config = await this.menuRawService.findActiveConfiguration()
    if (!config) {
      return {
        success: false,
        message: 'Aucune configuration active trouvée',
        data: null
      }
    }
    
    const menuTree = await this.menuRawService.getMenuTree(config.id)
    return {
      success: true,
      data: {
        configuration: config,
        menuTree
      }
    }
  }

  @Get('tree')
  async getMenuTree(@Query('configId') configId?: string) {
    const tree = await this.menuRawService.getMenuTree(configId)
    return {
      success: true,
      data: tree
    }
  }

  @Post('filtered-menu')
  async getFilteredMenuForUser(
    @Body() body: {
      userId: string
      userRoles: string[]
      userPermissions: string[]
    }
  ) {
    const filteredMenu = await this.menuRawService.getFilteredMenuForUser(
      body.userId,
      body.userRoles,
      body.userPermissions
    )
    
    return {
      success: true,
      data: filteredMenu
    }
  }

  @Get('test')
  async testConnection() {
    try {
      const configs = await this.menuRawService.findAllConfigurations()
      return {
        success: true,
        message: 'Service fonctionnel!',
        configCount: configs.length
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}