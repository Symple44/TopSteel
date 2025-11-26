import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import { CombinedSecurityGuard } from '../../../domains/auth/security/guards/combined-security.guard'
import { RequireSystemAdmin } from '../../../domains/auth/security/guards/enhanced-roles.guard'
import { RoleFormattingService } from '../../../domains/auth/services/role-formatting.service'
import { UnifiedRolesService } from '../../../domains/auth/services/unified-roles.service'
import { UsersService } from '../../../domains/users/users.service'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import { Public } from '../../../core/multi-tenant'

@Controller('admin/roles')
@ApiTags('🔧 Admin - Rôles')
@Public()
@ApiBearerAuth('JWT-auth')
export class AdminRolesController {
  constructor(
    private readonly unifiedRolesService: UnifiedRolesService,
    private readonly roleFormattingService: RoleFormattingService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService
  ) {}

  @Get(':roleId/permissions')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Récupérer les permissions d\'un rôle' })
  @ApiParam({ name: 'roleId', description: 'ID ou nom du rôle' })
  @ApiResponse({ status: 200, description: 'Permissions du rôle récupérées avec succès' })
  async getRolePermissions(@Param('roleId') roleId: string) {
    // Chercher le rôle par ID ou par nom
    const role = await this.prisma.role.findFirst({
      where: {
        OR: [
          { id: roleId },
          { name: roleId },
        ],
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })

    if (!role) {
      return {
        success: true,
        data: [],
        message: `Rôle ${roleId} non trouvé, retour des permissions par défaut`,
      }
    }

    const permissions = role.permissions.map((rp) => ({
      id: rp.permission.id,
      name: rp.permission.name,
      label: rp.permission.label,
      module: rp.permission.module,
      action: rp.permission.action,
    }))

    return {
      success: true,
      data: permissions,
    }
  }

  @Get()
  @UseGuards(CombinedSecurityGuard)
  @RequireSystemAdmin()
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
      const usersWithRole = allUsers.filter((user: { role?: string }) => user.role === role.id)
      return {
        ...role,
        userCount: usersWithRole.length,
        users: usersWithRole.map((user: {
          id: string
          email: string
          prenom?: string | null
          nom?: string | null
          actif?: boolean
          dernier_login?: Date | null
        }) => ({
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
