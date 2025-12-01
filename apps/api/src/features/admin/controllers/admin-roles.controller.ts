import {
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
  Query,
  Req,
  ForbiddenException,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import { CombinedSecurityGuard } from '../../../domains/auth/security/guards/combined-security.guard'
import { RequireSystemAdmin } from '../../../domains/auth/security/guards/enhanced-roles.guard'
import { RoleFormattingService } from '../../../domains/auth/services/role-formatting.service'
import { UnifiedRolesService } from '../../../domains/auth/services/unified-roles.service'
import { UsersService } from '../../../domains/users/users.service'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import { Public } from '../../../core/multi-tenant'
import { CreateRoleDto, UpdateRoleDto, UpdateRolePermissionsDto } from '../dto/role.dto'
import { GlobalUserRole, SYSTEM_ADMIN_ROLES } from '../../../domains/auth/core/constants/roles.constants'

@Controller('admin/roles')
@ApiTags('🔧 Admin - Rôles')
@Public()
@ApiBearerAuth('JWT-auth')
export class AdminRolesController {
  private readonly logger = new Logger(AdminRolesController.name)

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
  @ApiResponse({ status: 403, description: 'Accès interdit - Vous ne pouvez consulter que les permissions de votre propre rôle' })
  async getRolePermissions(@Param('roleId') roleId: string, @Req() request: any) {
    const user = request.user

    // Sécurité : Vérifier que l'utilisateur peut accéder aux permissions de ce rôle
    // Autoriser l'accès si :
    // 1. L'utilisateur consulte son propre rôle
    // 2. L'utilisateur est un administrateur système (SUPER_ADMIN ou ADMIN)
    const isSystemAdmin = user?.role && SYSTEM_ADMIN_ROLES.includes(user.role as GlobalUserRole)
    const isOwnRole = user?.role === roleId

    if (!isOwnRole && !isSystemAdmin) {
      throw new ForbiddenException(
        'Accès interdit. Vous ne pouvez consulter que les permissions de votre propre rôle, ' +
        'sauf si vous êtes administrateur système.'
      )
    }

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
  @UseGuards(CombinedSecurityGuard)
  @RequireSystemAdmin()
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

  @Post()
  @UseGuards(CombinedSecurityGuard)
  @RequireSystemAdmin()
  @ApiOperation({ summary: 'Créer un nouveau rôle' })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({ status: 201, description: 'Rôle créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides ou nom déjà utilisé' })
  async createRole(@Body() createRoleDto: CreateRoleDto, @Req() request: any) {
    // Vérifier si le nom existe déjà
    const existingRole = await this.prisma.role.findUnique({
      where: { name: createRoleDto.name },
    })

    if (existingRole) {
      throw new HttpException(
        {
          success: false,
          message: `Un rôle avec le nom "${createRoleDto.name}" existe déjà`,
        },
        HttpStatus.BAD_REQUEST
      )
    }

    // Créer le rôle
    const role = await this.prisma.role.create({
      data: {
        name: createRoleDto.name,
        label: createRoleDto.name,
        description: createRoleDto.description || '',
        isActive: createRoleDto.isActive ?? true,
        isSystem: false,
      },
    })

    // Audit logging
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: request.user?.id,
          action: 'CREATE',
          resource: 'ROLE',
          resourceId: role.id,
          description: `Création du rôle ${role.name}`,
          ipAddress: request.ip || request.headers?.['x-forwarded-for'] || request.connection?.remoteAddress,
          userAgent: request.headers?.['user-agent'],
          changes: {
            name: role.name,
            description: role.description,
            isActive: role.isActive,
          },
          metadata: {
            action: 'role_created',
            roleId: role.id,
          },
        },
      })
    } catch (auditError) {
      this.logger.warn('Failed to create audit log:', auditError)
    }

    return {
      success: true,
      data: role,
      message: 'Rôle créé avec succès',
    }
  }

  @Put(':id')
  @UseGuards(CombinedSecurityGuard)
  @RequireSystemAdmin()
  @ApiOperation({ summary: 'Mettre à jour un rôle existant' })
  @ApiParam({ name: 'id', description: 'ID du rôle' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({ status: 200, description: 'Rôle mis à jour avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides ou rôle système non modifiable' })
  @ApiResponse({ status: 404, description: 'Rôle non trouvé' })
  async updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto, @Req() request: any) {
    // Vérifier si le rôle existe
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
    })

    if (!existingRole) {
      throw new HttpException(
        {
          success: false,
          message: 'Rôle non trouvé',
        },
        HttpStatus.NOT_FOUND
      )
    }

    // Interdire la modification des rôles système
    if (existingRole.isSystem) {
      throw new HttpException(
        {
          success: false,
          message: 'Les rôles système ne peuvent pas être modifiés',
        },
        HttpStatus.BAD_REQUEST
      )
    }

    // Vérifier l'unicité du nom si changé
    if (updateRoleDto.name && updateRoleDto.name !== existingRole.name) {
      const roleWithSameName = await this.prisma.role.findUnique({
        where: { name: updateRoleDto.name },
      })

      if (roleWithSameName) {
        throw new HttpException(
          {
            success: false,
            message: `Un rôle avec le nom "${updateRoleDto.name}" existe déjà`,
          },
          HttpStatus.BAD_REQUEST
        )
      }
    }

    // Capture changes for audit log
    const changes: Record<string, { old: any; new: any }> = {}
    if (updateRoleDto.name && updateRoleDto.name !== existingRole.name) {
      changes.name = { old: existingRole.name, new: updateRoleDto.name }
    }
    if (updateRoleDto.description !== undefined && updateRoleDto.description !== existingRole.description) {
      changes.description = { old: existingRole.description, new: updateRoleDto.description }
    }
    if (updateRoleDto.isActive !== undefined && updateRoleDto.isActive !== existingRole.isActive) {
      changes.isActive = { old: existingRole.isActive, new: updateRoleDto.isActive }
    }

    // Mettre à jour le rôle
    const updatedRole = await this.prisma.role.update({
      where: { id },
      data: {
        ...(updateRoleDto.name && { name: updateRoleDto.name, label: updateRoleDto.name }),
        ...(updateRoleDto.description !== undefined && { description: updateRoleDto.description }),
        ...(updateRoleDto.isActive !== undefined && { isActive: updateRoleDto.isActive }),
      },
    })

    // Audit logging
    if (Object.keys(changes).length > 0) {
      try {
        await this.prisma.auditLog.create({
          data: {
            userId: request.user?.id,
            action: 'UPDATE',
            resource: 'ROLE',
            resourceId: id,
            description: `Mise à jour du rôle ${updatedRole.name}`,
            ipAddress: request.ip || request.headers?.['x-forwarded-for'] || request.connection?.remoteAddress,
            userAgent: request.headers?.['user-agent'],
            changes,
            metadata: {
              action: 'role_updated',
              roleId: id,
              fieldsChanged: Object.keys(changes),
            },
          },
        })
      } catch (auditError) {
        this.logger.warn('Failed to create audit log:', auditError)
      }
    }

    return {
      success: true,
      data: updatedRole,
      message: 'Rôle mis à jour avec succès',
    }
  }

  @Delete()
  @UseGuards(CombinedSecurityGuard)
  @RequireSystemAdmin()
  @ApiOperation({ summary: 'Supprimer un rôle' })
  @ApiResponse({ status: 200, description: 'Rôle supprimé avec succès' })
  @ApiResponse({ status: 400, description: 'Rôle système non supprimable ou rôle utilisé' })
  @ApiResponse({ status: 404, description: 'Rôle non trouvé' })
  async deleteRole(@Query('id') id: string, @Req() request: any) {
    // Vérifier si le rôle existe
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
      include: {
        users: true,
      },
    })

    if (!existingRole) {
      throw new HttpException(
        {
          success: false,
          message: 'Rôle non trouvé',
        },
        HttpStatus.NOT_FOUND
      )
    }

    // Interdire la suppression des rôles système
    if (existingRole.isSystem) {
      throw new HttpException(
        {
          success: false,
          message: 'Les rôles système ne peuvent pas être supprimés',
        },
        HttpStatus.BAD_REQUEST
      )
    }

    // Vérifier si le rôle est utilisé
    if (existingRole.users && existingRole.users.length > 0) {
      throw new HttpException(
        {
          success: false,
          message: `Ce rôle est assigné à ${existingRole.users.length} utilisateur(s) et ne peut pas être supprimé`,
        },
        HttpStatus.BAD_REQUEST
      )
    }

    // Supprimer le rôle
    await this.prisma.role.delete({
      where: { id },
    })

    // Audit logging
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: request.user?.id,
          action: 'DELETE',
          resource: 'ROLE',
          resourceId: id,
          description: `Suppression du rôle ${existingRole.name}`,
          ipAddress: request.ip || request.headers?.['x-forwarded-for'] || request.connection?.remoteAddress,
          userAgent: request.headers?.['user-agent'],
          changes: {
            deletedRole: {
              id: existingRole.id,
              name: existingRole.name,
              description: existingRole.description,
              isActive: existingRole.isActive,
            },
          },
          metadata: {
            action: 'role_deleted',
            roleId: id,
          },
        },
      })
    } catch (auditError) {
      this.logger.warn('Failed to create audit log:', auditError)
    }

    return {
      success: true,
      message: 'Rôle supprimé avec succès',
    }
  }

  @Post(':id/permissions')
  @UseGuards(CombinedSecurityGuard)
  @RequireSystemAdmin()
  @ApiOperation({ summary: 'Mettre à jour les permissions d\'un rôle' })
  @ApiParam({ name: 'id', description: 'ID du rôle' })
  @ApiBody({ type: UpdateRolePermissionsDto })
  @ApiResponse({ status: 200, description: 'Permissions mises à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Rôle non trouvé' })
  async updateRolePermissions(
    @Param('id') id: string,
    @Body() updatePermissionsDto: UpdateRolePermissionsDto
  ) {
    // Vérifier si le rôle existe
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
    })

    if (!existingRole) {
      throw new HttpException(
        {
          success: false,
          message: 'Rôle non trouvé',
        },
        HttpStatus.NOT_FOUND
      )
    }

    // Utiliser une transaction pour garantir l'atomicité
    await this.prisma.$transaction(async (tx) => {
      // Supprimer toutes les permissions existantes du rôle
      await tx.rolePermission.deleteMany({
        where: { roleId: id },
      })

      // Filtrer uniquement les permissions accordées
      const grantedPermissions = updatePermissionsDto.permissions.filter((p) => p.isGranted)

      // Ajouter les nouvelles permissions
      if (grantedPermissions.length > 0) {
        await tx.rolePermission.createMany({
          data: grantedPermissions.map((permission) => ({
            roleId: id,
            permissionId: permission.permissionId,
          })),
          skipDuplicates: true,
        })
      }
    })

    // Récupérer le rôle mis à jour avec ses permissions
    const updatedRole = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })

    return {
      success: true,
      data: updatedRole,
      message: 'Permissions mises à jour avec succès',
    }
  }
}
