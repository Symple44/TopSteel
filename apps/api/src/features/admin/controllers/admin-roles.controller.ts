import { Controller, Delete, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CombinedSecurityGuard } from '../../../domains/auth/security/guards/combined-security.guard'
import { RequireSystemAdmin } from '../../../domains/auth/security/guards/enhanced-roles.guard'
import { RoleFormattingService } from '../../../domains/auth/services/role-formatting.service'
import { UnifiedRolesService } from '../../../domains/auth/services/unified-roles.service'
import { UsersService } from '../../../domains/users/users.service'

@Controller('admin/roles')
@ApiTags('🔧 Admin - Rôles')
@UseGuards(CombinedSecurityGuard)
@RequireSystemAdmin()
@ApiBearerAuth('JWT-auth')
export class AdminRolesController {
  constructor(
    private readonly unifiedRolesService: UnifiedRolesService,
    private readonly roleFormattingService: RoleFormattingService,
    private readonly usersService: UsersService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les rôles disponibles avec statistiques' })
  @ApiResponse({
    status: 200,
    description: 'Liste des rôles avec statistiques récupérée avec succès',
  })
  async getAllRolesWithStats() {
    const globalRoles = this.roleFormattingService.getAllFormattedGlobalRoles()
    const societeRoles = this.roleFormattingService.getAllFormattedSocieteRoles()

    // Calculer les statistiques d'utilisation pour les rôles globaux
    const allUsers = await this.usersService.findAll({})
    const globalRoleStats = globalRoles.map((role) => {
      const usersWithRole = allUsers.filter((user) => user.role === role.id)
      return {
        ...role,
        userCount: usersWithRole.length,
        users: usersWithRole.map((user) => ({
          id: user.id,
          email: user.email,
          firstName: user.prenom || '',
          lastName: user.nom || '',
          isActive: user.actif,
          lastLogin: user.dernier_login,
        })),
      }
    })

    return {
      success: true,
      data: {
        globalRoles: globalRoleStats,
        societeRoles,
        summary: {
          totalGlobalRoles: globalRoles.length,
          totalSocieteRoles: societeRoles.length,
          totalUsers: allUsers.length,
        },
      },
    }
  }

  @Delete('expired')
  @ApiOperation({ summary: 'Nettoyer les rôles expirés' })
  @ApiResponse({ status: 200, description: 'Rôles expirés nettoyés avec succès' })
  async cleanupExpiredRoles() {
    const cleanedCount = await this.unifiedRolesService.cleanupExpiredRoles()

    return {
      success: true,
      data: {
        cleanedCount,
        message: `${cleanedCount} rôle(s) expiré(s) ont été désactivés`,
      },
    }
  }
}
