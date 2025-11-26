import { Controller, Get, Logger, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../../core/common/decorators/current-user.decorator'
import {
  GlobalUserRole,
  SocieteRoleType,
} from '../../../domains/auth/core/constants/roles.constants'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import { UnifiedRolesService } from '../../../domains/auth/services/unified-roles.service'
import type { User } from '@prisma/client'
import { PageSyncService } from '../services/page-sync.service'
import { Public } from '../../../core/multi-tenant'

@Controller('user/available-pages')
@ApiTags('📋 User - Available Pages')
@Public() // Bypass TenantGuard - JwtAuthGuard handles authentication
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AvailablePagesController {
  private readonly logger = new Logger(AvailablePagesController.name)

  constructor(
    private readonly pageSyncService: PageSyncService,
    private readonly unifiedRolesService: UnifiedRolesService
  ) {}

  @Get()
  @ApiOperation({ summary: "Récupérer les pages disponibles pour l'utilisateur connecté" })
  @ApiResponse({ status: 200, description: 'Pages disponibles récupérées avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async getAvailablePages(@CurrentUser() user: User) {
    try {
      this.logger.debug(`Récupération des pages disponibles pour l'utilisateur: ${user.id}`)

      // Synchroniser les pages d'abord
      await this.pageSyncService.syncPages()

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
          roleInfo.permissions.forEach((permission: string) => {
            userPermissions.add(permission)
          })
        }
        if (roleInfo.additionalPermissions) {
          roleInfo.additionalPermissions.forEach((permission: string) => {
            userPermissions.add(permission)
          })
        }
        if (roleInfo.restrictedPermissions) {
          roleInfo.restrictedPermissions.forEach((permission: string) => {
            userPermissions.delete(permission)
          })
        }
      }

      // Utiliser le rôle principal pour déterminer les pages disponibles
      const primaryRole = userRoles.length > 0 ? userRoles[0] : 'USER'

      // Obtenir les pages organisées par catégorie
      const categories = await this.pageSyncService.getPagesByCategory(
        user.id,
        primaryRole,
        Array.from(userPermissions)
      )

      this.logger.debug(
        `Pages récupérées: ${categories.length} catégories, rôles: [${userRoles.join(', ')}], permissions: ${userPermissions.size}`
      )

      return {
        success: true,
        data: categories,
        meta: {
          userId: user.id,
          userRoles,
          permissionCount: userPermissions.size,
          categoryCount: categories.length,
        },
      }
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des pages disponibles:', error)

      // Retourner des données de fallback minimales en cas d'erreur
      return {
        success: true,
        data: [
          {
            id: 'dashboard',
            title: 'Tableau de bord',
            description: "Vues d'ensemble et métriques principales",
            icon: 'LayoutDashboard',
            pages: [
              {
                id: 'home',
                title: 'Accueil',
                href: '/',
                description: "Page d'accueil",
                icon: 'Home',
                category: 'dashboard',
                permissions: [],
                roles: [],
                isEnabled: true,
                isVisible: true,
              },
            ],
          },
        ],
        meta: {
          fallback: true,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        },
      }
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
