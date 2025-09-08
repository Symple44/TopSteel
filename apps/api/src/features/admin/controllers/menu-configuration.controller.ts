import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { CurrentUser } from '../../../core/common/decorators/current-user.decorator'
import { getErrorMessage } from '../../../core/common/utils'
import {
  GlobalUserRole,
  SocieteRoleType,
} from '../../../domains/auth/core/constants/roles.constants'
import { CombinedSecurityGuard } from '../../../domains/auth/security/guards/combined-security.guard'
import { RequireSystemAdmin } from '../../../domains/auth/security/guards/enhanced-roles.guard'
import type { UnifiedRolesService } from '../../../domains/auth/services/unified-roles.service'
import type { User } from '../../../domains/users/entities/user.entity'
import type {
  CreateMenuConfigDto,
  MenuConfigurationService,
  UpdateMenuConfigDto,
} from '../services/menu-configuration.service'

@ApiTags('🔧 Admin - Menu Configuration')
@Controller('admin/menu-config')
@UseGuards(CombinedSecurityGuard)
@RequireSystemAdmin()
@ApiBearerAuth('JWT-auth')
export class MenuConfigurationController {
  constructor(
    private readonly menuConfigService: MenuConfigurationService,
    private readonly unifiedRolesService: UnifiedRolesService
  ) {}

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
  @ApiQuery({
    name: 'configId',
    required: false,
    type: String,
    description: 'ID de la configuration spécifique (optionnel)',
  })
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
  async getFilteredMenuTree(@CurrentUser() user: User) {
    try {
      // Récupérer les rôles et permissions réels de l'utilisateur
      const userRoles = [user.role] // Rôle global

      // Récupérer les rôles société et permissions
      const userSocieteRoles = await this.unifiedRolesService.getUserSocieteRoles(user.id)

      // Ajouter les rôles société (converted to global roles for permission checking)
      for (const roleInfo of userSocieteRoles) {
        if (roleInfo.effectiveRole) {
          // Convert SocieteRoleType to equivalent GlobalUserRole
          const globalEquivalent = this.convertSocieteToGlobalRole(roleInfo.effectiveRole)
          if (globalEquivalent && !userRoles.includes(globalEquivalent)) {
            userRoles.push(globalEquivalent)
          }
        }
      }

      // Collecter toutes les permissions
      const userPermissions = new Set<string>()
      for (const roleInfo of userSocieteRoles) {
        if (roleInfo.permissions) {
          roleInfo.permissions.forEach((permission) => {
            userPermissions.add(permission)
          })
        }
        if (roleInfo.additionalPermissions) {
          roleInfo.additionalPermissions.forEach((permission) => {
            userPermissions.add(permission)
          })
        }
        if (roleInfo.restrictedPermissions) {
          roleInfo.restrictedPermissions.forEach((permission) => {
            userPermissions.delete(permission)
          })
        }
      }

      const tree = await this.menuConfigService.getFilteredMenuForUser(
        user.id,
        userRoles,
        Array.from(userPermissions)
      )

      return {
        success: true,
        data: tree,
        meta: {
          userId: user.id,
          userRoles,
          permissionCount: userPermissions.size,
        },
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la récupération du menu filtré',
        error: error instanceof Error ? getErrorMessage(error) : 'Erreur inconnue',
      }
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une configuration de menu par ID' })
  @ApiParam({ name: 'id', type: String, description: 'ID de la configuration de menu' })
  @ApiResponse({ status: 200, description: 'Configuration récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Configuration non trouvée' })
  async getConfigurationById(@Param('id') id: string) {
    const config = await this.menuConfigService.findConfigurationById(id)
    return {
      success: true,
      data: config,
    }
  }

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle configuration de menu' })
  @ApiBody({ description: 'Données de la nouvelle configuration de menu' })
  @ApiResponse({ status: 201, description: 'Configuration créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Une configuration avec ce nom existe déjà' })
  async createConfiguration(@Body() createDto: CreateMenuConfigDto, @CurrentUser() user: User) {
    const config = await this.menuConfigService.createConfiguration(createDto, user.id)
    return {
      success: true,
      data: config,
      message: 'Configuration de menu créée avec succès',
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une configuration de menu' })
  @ApiParam({ name: 'id', type: String, description: 'ID de la configuration de menu' })
  @ApiBody({ description: 'Données de mise à jour de la configuration' })
  @ApiResponse({ status: 200, description: 'Configuration mise à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Configuration non trouvée' })
  @ApiResponse({ status: 403, description: 'Opération interdite (configuration système)' })
  async updateConfiguration(
    @Param('id') id: string,
    @Body() updateDto: UpdateMenuConfigDto,
    @CurrentUser() user: User
  ) {
    const config = await this.menuConfigService.updateConfiguration(id, updateDto, user.id)
    return {
      success: true,
      data: config,
      message: 'Configuration de menu mise à jour avec succès',
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une configuration de menu' })
  @ApiParam({ name: 'id', type: String, description: 'ID de la configuration de menu' })
  @ApiResponse({ status: 200, description: 'Configuration supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Configuration non trouvée' })
  @ApiResponse({
    status: 403,
    description: 'Opération interdite (configuration système ou active)',
  })
  async deleteConfiguration(@Param('id') id: string) {
    await this.menuConfigService.deleteConfiguration(id)
    return {
      success: true,
      message: 'Configuration de menu supprimée avec succès',
    }
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activer une configuration de menu' })
  @ApiParam({ name: 'id', type: String, description: 'ID de la configuration de menu' })
  @ApiResponse({ status: 200, description: 'Configuration activée avec succès' })
  @ApiResponse({ status: 404, description: 'Configuration non trouvée' })
  async activateConfiguration(@Param('id') id: string) {
    await this.menuConfigService.activateConfiguration(id)
    return {
      success: true,
      message: 'Configuration de menu activée avec succès',
    }
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Exporter une configuration de menu' })
  @ApiParam({ name: 'id', type: String, description: 'ID de la configuration de menu' })
  @ApiResponse({ status: 200, description: 'Configuration exportée avec succès' })
  @ApiResponse({ status: 404, description: 'Configuration non trouvée' })
  async exportConfiguration(@Param('id') id: string) {
    const exportData = await this.menuConfigService.exportConfiguration(id)
    return {
      success: true,
      data: exportData,
    }
  }

  @Post('import')
  @ApiOperation({ summary: 'Importer une configuration de menu' })
  @ApiBody({ description: 'Données de configuration exportée à importer' })
  @ApiResponse({ status: 201, description: 'Configuration importée avec succès' })
  @ApiResponse({ status: 400, description: "Données d'importation invalides" })
  async importConfiguration(
    @Body() importData: Record<string, unknown>,
    @CurrentUser() user: User
  ) {
    const config = await this.menuConfigService.importConfiguration(importData, user.id)
    return {
      success: true,
      data: config,
      message: 'Configuration de menu importée avec succès',
    }
  }

  private convertSocieteToGlobalRole(societeRole: SocieteRoleType): GlobalUserRole | null {
    // Convert SocieteRoleType to equivalent GlobalUserRole for permission checking
    switch (societeRole) {
      case SocieteRoleType.OWNER:
        return GlobalUserRole.ADMIN
      case SocieteRoleType.ADMIN:
        return GlobalUserRole.ADMIN
      case SocieteRoleType.MANAGER:
        return GlobalUserRole.MANAGER
      case SocieteRoleType.COMMERCIAL:
        return GlobalUserRole.COMMERCIAL
      case SocieteRoleType.COMPTABLE:
        return GlobalUserRole.COMPTABLE
      case SocieteRoleType.TECHNICIEN:
        return GlobalUserRole.TECHNICIEN
      case SocieteRoleType.OPERATEUR:
        return GlobalUserRole.OPERATEUR
      case SocieteRoleType.USER:
        return GlobalUserRole.USER
      case SocieteRoleType.VIEWER:
      case SocieteRoleType.GUEST:
        return GlobalUserRole.VIEWER
      default:
        return null
    }
  }
}
