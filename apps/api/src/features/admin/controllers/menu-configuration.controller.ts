import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import type {
  CreateMenuConfigDto,
  MenuConfigurationService,
  UpdateMenuConfigDto,
} from '../services/menu-configuration.service'

@ApiTags('Menu Configuration')
@Controller('admin/menu-config')
// @UseGuards(JwtAuthGuard) // Temporairement désactivé pour debug
// @ApiBearerAuth()
export class MenuConfigurationController {
  constructor(private readonly menuConfigService: MenuConfigurationService) {}

  @Get()
  @ApiOperation({ summary: 'Obtenir toutes les configurations de menu' })
  @ApiResponse({ status: 200, description: 'Liste des configurations récupérée avec succès' })
  async getAllConfigurations() {
    const configs = await this.menuConfigService.findAllConfigurations()
    return {
      success: true,
      data: configs,
    }
  }

  @Get('active')
  @ApiOperation({ summary: 'Obtenir la configuration de menu active' })
  @ApiResponse({ status: 200, description: 'Configuration active récupérée avec succès' })
  async getActiveConfiguration() {
    const config = await this.menuConfigService.findActiveConfiguration()
    return {
      success: true,
      data: config,
    }
  }

  @Get('tree')
  @ApiOperation({ summary: "Obtenir l'arbre de menu de la configuration active" })
  @ApiResponse({ status: 200, description: 'Arbre de menu récupéré avec succès' })
  async getMenuTree(@Query('configId') configId?: string) {
    const tree = await this.menuConfigService.getMenuTree(configId)
    return {
      success: true,
      data: tree,
    }
  }

  @Get('tree/filtered')
  @ApiOperation({
    summary: "Obtenir l'arbre de menu filtré selon les permissions de l'utilisateur",
  })
  @ApiResponse({ status: 200, description: 'Arbre de menu filtré récupéré avec succès' })
  async getFilteredMenuTree() {
    // TODO: Récupérer les rôles et permissions de l'utilisateur
    // Temporairement hardcodé pour debug
    const userRoles = ['ADMIN']
    const userPermissions = [] // TODO: Implémenter la récupération des permissions

    const tree = await this.menuConfigService.getFilteredMenuForUser(
      'debug-user',
      userRoles,
      userPermissions
    )

    return {
      success: true,
      data: tree,
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une configuration de menu par ID' })
  @ApiResponse({ status: 200, description: 'Configuration récupérée avec succès' })
  async getConfigurationById(@Param('id') id: string) {
    const config = await this.menuConfigService.findConfigurationById(id)
    return {
      success: true,
      data: config,
    }
  }

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle configuration de menu' })
  @ApiResponse({ status: 201, description: 'Configuration créée avec succès' })
  async createConfiguration(@Body() createDto: CreateMenuConfigDto) {
    const config = await this.menuConfigService.createConfiguration(createDto, 'debug-user')
    return {
      success: true,
      data: config,
      message: 'Configuration de menu créée avec succès',
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une configuration de menu' })
  @ApiResponse({ status: 200, description: 'Configuration mise à jour avec succès' })
  async updateConfiguration(@Param('id') id: string, @Body() updateDto: UpdateMenuConfigDto) {
    const config = await this.menuConfigService.updateConfiguration(id, updateDto, 'debug-user')
    return {
      success: true,
      data: config,
      message: 'Configuration de menu mise à jour avec succès',
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une configuration de menu' })
  @ApiResponse({ status: 200, description: 'Configuration supprimée avec succès' })
  async deleteConfiguration(@Param('id') id: string) {
    await this.menuConfigService.deleteConfiguration(id)
    return {
      success: true,
      message: 'Configuration de menu supprimée avec succès',
    }
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activer une configuration de menu' })
  @ApiResponse({ status: 200, description: 'Configuration activée avec succès' })
  async activateConfiguration(@Param('id') id: string) {
    await this.menuConfigService.activateConfiguration(id)
    return {
      success: true,
      message: 'Configuration de menu activée avec succès',
    }
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Exporter une configuration de menu' })
  @ApiResponse({ status: 200, description: 'Configuration exportée avec succès' })
  async exportConfiguration(@Param('id') id: string) {
    const exportData = await this.menuConfigService.exportConfiguration(id)
    return {
      success: true,
      data: exportData,
    }
  }

  @Post('import')
  @ApiOperation({ summary: 'Importer une configuration de menu' })
  @ApiResponse({ status: 201, description: 'Configuration importée avec succès' })
  async importConfiguration(@Body() importData: Record<string, unknown>) {
    const config = await this.menuConfigService.importConfiguration(importData, 'debug-user')
    return {
      success: true,
      data: config,
      message: 'Configuration de menu importée avec succès',
    }
  }
}
