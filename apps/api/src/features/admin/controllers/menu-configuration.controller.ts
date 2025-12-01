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
import { Public } from '../../../core/multi-tenant'
import { CurrentUser } from '../../../core/common/decorators/current-user.decorator'
import { getErrorMessage } from '../../../core/common/utils'
import {
  GlobalUserRole,
  SocieteRoleType,
} from '../../../domains/auth/core/constants/roles.constants'
import { CombinedSecurityGuard } from '../../../domains/auth/security/guards/combined-security.guard'
import { RequireSystemAdmin } from '../../../domains/auth/security/guards/enhanced-roles.guard'
import { UnifiedRolesService } from '../../../domains/auth/services/unified-roles.service'
import type { User } from '@prisma/client'
import { MenuConfigurationService } from '../services/menu-configuration.service'
import type {
  CreateMenuConfigDto,
  UpdateMenuConfigDto,
} from '../services/menu-configuration.service'
import { MenuSyncService } from '../services/menu-sync.service'

@ApiTags('🔧 Admin - Menu Configuration')
@Controller('admin/menu-config')
@Public() // Bypass global TenantGuard - CombinedSecurityGuard handles JWT auth
@UseGuards(CombinedSecurityGuard)
@ApiBearerAuth('JWT-auth')
export class MenuConfigurationController {
  constructor(
    private readonly menuConfigService: MenuConfigurationService,
    private readonly unifiedRolesService: UnifiedRolesService,
    private readonly menuSyncService: MenuSyncService
  ) {}

  @Get()
  @RequireSystemAdmin()
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
  async getFilteredMenuTree(@CurrentUser() user?: User) {
    try {
      // Si pas d'utilisateur, retourner le menu complet (sera filtré côté client)
      if (!user) {
        const tree = await this.menuConfigService.getMenuTree()
        return {
          success: true,
          data: tree,
        }
      }

      // Récupérer les rôles et permissions réels de l'utilisateur
      const userRoles = user.role ? [user.role] : [] // Rôle global

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
  @RequireSystemAdmin()
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
  @RequireSystemAdmin()
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
  @RequireSystemAdmin()
  @ApiOperation({ summary: 'Mettre à jour une configuration de menu' })
  @ApiParam({ name: 'id', type: String, description: 'ID de la configuration de menu' })
  @ApiBody({ description: 'Données de mise à jour de la configuration' })
  @ApiResponse({ status: 200, description: 'Configuration mise à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Configuration non trouvée' })
  @ApiResponse({ status: 403, description: 'Opération interdite (configuration système)' })
  async updateConfiguration(
    @Param('id') id: string,
    @Body() updateDto: UpdateMenuConfigDto,
    @CurrentUser() user?: User
  ) {
    const config = await this.menuConfigService.updateConfiguration(id, updateDto, user?.id || 'system')
    return {
      success: true,
      data: config,
      message: 'Configuration de menu mise à jour avec succès',
    }
  }

  @Delete(':id')
  @RequireSystemAdmin()
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
  @RequireSystemAdmin()
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
  @RequireSystemAdmin()
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
  @RequireSystemAdmin()
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

  @Post('default')
  @RequireSystemAdmin()
  @ApiOperation({ summary: 'Créer la configuration de menu par défaut' })
  @ApiResponse({ status: 201, description: 'Configuration par défaut créée avec succès' })
  async createDefaultConfiguration() {
    const config = await this.menuConfigService.createDefaultConfiguration()
    return {
      success: true,
      data: config,
      message: 'Configuration de menu par défaut créée avec succès',
    }
  }

  @Post('sync')
  @RequireSystemAdmin()
  @ApiOperation({ summary: 'Synchroniser le menu depuis la structure du sidebar' })
  @ApiResponse({ status: 200, description: 'Menu synchronisé avec succès' })
  async syncMenu() {
    const config = await this.menuSyncService.syncMenuFromSidebar()
    return {
      success: true,
      data: config,
      message: 'Menu synchronisé avec succès depuis la structure du sidebar',
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
