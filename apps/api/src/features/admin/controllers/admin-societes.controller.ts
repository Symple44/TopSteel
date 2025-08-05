import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { SocieteRoleType } from '../../../domains/auth/core/constants/roles.constants'
import { CombinedSecurityGuard } from '../../../domains/auth/security/guards/combined-security.guard'
import { RequireSystemAdmin } from '../../../domains/auth/security/guards/enhanced-roles.guard'
import type { RoleFormattingService } from '../../../domains/auth/services/role-formatting.service'
import type { UnifiedRolesService } from '../../../domains/auth/services/unified-roles.service'
import type { UsersService } from '../../../domains/users/users.service'
import type { SocietesService } from '../../../features/societes/services/societes.service'

interface SocieteQueryDto {
  page?: number
  limit?: number
  search?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL'
  includeUsers?: boolean
}

@Controller('admin/societes')
@ApiTags('🔧 Admin - Sociétés')
@UseGuards(CombinedSecurityGuard)
@RequireSystemAdmin()
@ApiBearerAuth('JWT-auth')
export class AdminSocietesController {
  constructor(
    private readonly societesService: SocietesService,
    private readonly unifiedRolesService: UnifiedRolesService,
    private readonly roleFormattingService: RoleFormattingService,
    private readonly usersService: UsersService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lister toutes les sociétés (Administration)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE', 'ALL'] })
  @ApiQuery({ name: 'includeUsers', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Liste des sociétés récupérée avec succès' })
  async findAllSocietes(@Query() query: SocieteQueryDto) {
    try {
      // Récupérer les sociétés selon les filtres
      let societes
      if (query.status === 'ALL') {
        societes = await this.societesService.findAll()
      } else {
        societes = await this.societesService.findActive()
      }

      // Appliquer la recherche si fournie
      if (query.search) {
        const searchTerm = query.search.toLowerCase()
        societes = societes.filter(
          (societe) =>
            societe.nom.toLowerCase().includes(searchTerm) ||
            societe.code.toLowerCase().includes(searchTerm)
        )
      }

      // Pagination
      const page = query.page || 1
      const limit = query.limit || 10
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedSocietes = societes.slice(startIndex, endIndex)

      // Formatter les données avec les utilisateurs si demandé
      const formattedSocietes = await Promise.all(
        paginatedSocietes.map(async (societe) => {
          let users: any[] = []
          let userCount = 0

          if (query.includeUsers) {
            // Récupérer tous les utilisateurs ayant accès à cette société
            const allUsers = await this.usersService.findAll({})
            const usersWithAccess: any[] = []

            for (const user of allUsers) {
              const userSocieteRoles = await this.unifiedRolesService.getUserSocieteRoles(user.id)
              const hasAccessToSociete = userSocieteRoles.some(
                (role) => role.societeId === societe.id && role.isActive
              )

              if (hasAccessToSociete) {
                const userRoleInSociete = userSocieteRoles.find(
                  (role) => role.societeId === societe.id
                )

                usersWithAccess.push({
                  id: user.id,
                  email: user.email,
                  firstName: user.prenom || '',
                  lastName: user.nom || '',
                  globalRole: this.roleFormattingService.formatGlobalRole(user.role),
                  societeRole: userRoleInSociete
                    ? this.roleFormattingService.formatSocieteRole(userRoleInSociete.effectiveRole)
                    : null,
                  isDefault: userRoleInSociete?.isDefaultSociete || false,
                  grantedAt: userRoleInSociete?.expiresAt || user.createdAt,
                })
              }
            }

            users = usersWithAccess
            userCount = usersWithAccess.length
          } else {
            // Compter seulement les utilisateurs
            const allUsers = await this.usersService.findAll({})
            for (const user of allUsers) {
              const userSocieteRoles = await this.unifiedRolesService.getUserSocieteRoles(user.id)
              const hasAccess = userSocieteRoles.some(
                (role) => role.societeId === societe.id && role.isActive
              )
              if (hasAccess) {
                userCount++
              }
            }
          }

          return {
            id: societe.id,
            nom: societe.nom,
            code: societe.code,
            status: societe.status || 'ACTIVE',
            databaseName: societe.databaseName,
            createdAt: societe.createdAt,
            updatedAt: societe.updatedAt,
            userCount,
            users: query.includeUsers ? users : undefined,
            sites:
              societe.sites?.map((site) => ({
                id: site.id,
                nom: site.nom,
                code: site.code,
                isPrincipal: site.isPrincipal,
              })) || [],
          }
        })
      )

      return {
        success: true,
        data: formattedSocietes,
        meta: {
          total: societes.length,
          page,
          limit,
          totalPages: Math.ceil(societes.length / limit),
          includeUsers: query.includeUsers || false,
        },
      }
    } catch (error: any) {
      throw new BadRequestException('Erreur lors de la récupération des sociétés')
    }
  }

  @Get(':id')
  @ApiOperation({ summary: "Récupérer les détails d'une société" })
  @ApiResponse({ status: 200, description: 'Détails de la société récupérés avec succès' })
  @ApiResponse({ status: 404, description: 'Société non trouvée' })
  async findSocieteById(@Param('id') id: string) {
    const societe = await this.societesService.findById(id)

    if (!societe) {
      throw new NotFoundException('Société non trouvée')
    }

    // Récupérer tous les utilisateurs ayant accès à cette société
    const allUsers = await this.usersService.findAll({})
    const usersWithAccess: any[] = []

    for (const user of allUsers) {
      const userSocieteRoles = await this.unifiedRolesService.getUserSocieteRoles(user.id)
      const userRoleInSociete = userSocieteRoles.find(
        (role) => role.societeId === societe.id && role.isActive
      )

      if (userRoleInSociete) {
        usersWithAccess.push({
          id: user.id,
          email: user.email,
          firstName: user.prenom || '',
          lastName: user.nom || '',
          globalRole: this.roleFormattingService.formatGlobalRole(user.role),
          societeRole: this.roleFormattingService.formatSocieteRole(
            userRoleInSociete.effectiveRole
          ),
          isDefault: userRoleInSociete.isDefaultSociete,
          isActive: userRoleInSociete.isActive,
          grantedAt: userRoleInSociete.expiresAt,
          expiresAt: userRoleInSociete.expiresAt,
          additionalPermissions: userRoleInSociete.additionalPermissions,
          restrictedPermissions: userRoleInSociete.restrictedPermissions,
        })
      }
    }

    return {
      success: true,
      data: {
        id: societe.id,
        nom: societe.nom,
        code: societe.code,
        status: societe.status || 'ACTIVE',
        databaseName: societe.databaseName,
        createdAt: societe.createdAt,
        updatedAt: societe.updatedAt,
        users: usersWithAccess,
        sites:
          societe.sites?.map((site) => ({
            id: site.id,
            nom: site.nom,
            code: site.code,
            isPrincipal: site.isPrincipal,
          })) || [],
      },
    }
  }

  @Post(':societeId/users/:userId')
  @ApiOperation({ summary: 'Ajouter un utilisateur à une société' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        roleType: { type: 'string', enum: Object.values(SocieteRoleType) },
        isDefault: { type: 'boolean', default: false },
        additionalPermissions: { type: 'array', items: { type: 'string' } },
        restrictedPermissions: { type: 'array', items: { type: 'string' } },
        expiresAt: { type: 'string', format: 'date-time', nullable: true },
      },
      required: ['roleType'],
    },
  })
  @ApiResponse({ status: 201, description: 'Utilisateur ajouté à la société avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur ou société non trouvé' })
  async addUserToSociete(
    @Param('societeId') societeId: string,
    @Param('userId') userId: string,
    @Body() body: {
      roleType: SocieteRoleType
      isDefault?: boolean
      additionalPermissions?: string[]
      restrictedPermissions?: string[]
      expiresAt?: Date
    },
    @Req() request: any
  ) {
    // Vérifier que la société existe
    const societe = await this.societesService.findById(societeId)
    if (!societe) {
      throw new NotFoundException('Société non trouvée')
    }

    // Vérifier que l'utilisateur existe
    const user = await this.usersService.findById(userId)
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé')
    }

    // Validation du rôle
    if (!Object.values(SocieteRoleType).includes(body.roleType)) {
      throw new BadRequestException('Type de rôle invalide')
    }

    try {
      const currentUser = request.user
      const userSocieteRole = await this.unifiedRolesService.assignUserToSociete(
        userId,
        societeId,
        body.roleType,
        currentUser.id,
        {
          isDefault: body.isDefault || false,
          additionalPermissions: body.additionalPermissions || [],
          restrictedPermissions: body.restrictedPermissions || [],
          expiresAt: body.expiresAt,
        }
      )

      return {
        success: true,
        data: {
          id: userSocieteRole.id,
          userId: userSocieteRole.userId,
          societeId: userSocieteRole.societeId,
          roleType: userSocieteRole.roleType,
          isDefault: userSocieteRole.isDefaultSociete,
          isActive: userSocieteRole.isActive,
          grantedAt: userSocieteRole.grantedAt,
          grantedBy: currentUser.id,
        },
        message: 'Utilisateur ajouté à la société avec succès',
        statusCode: 201,
      }
    } catch (error: any) {
      throw new BadRequestException("Erreur lors de l'ajout de l'utilisateur à la société")
    }
  }

  @Delete(':societeId/users/:userId')
  @ApiOperation({ summary: "Retirer un utilisateur d'une société" })
  @ApiResponse({ status: 200, description: 'Utilisateur retiré de la société avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur ou rôle non trouvé' })
  async removeUserFromSociete(
    @Param('societeId') societeId: string,
    @Param('userId') userId: string
  ) {
    const success = await this.unifiedRolesService.revokeUserFromSociete(userId, societeId)

    if (!success) {
      throw new NotFoundException('Utilisateur ou rôle société non trouvé')
    }

    return {
      success: true,
      message: 'Utilisateur retiré de la société avec succès',
      statusCode: 200,
    }
  }

  @Put(':societeId/users/:userId/role')
  @ApiOperation({ summary: "Modifier le rôle d'un utilisateur dans une société" })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        roleType: { type: 'string', enum: Object.values(SocieteRoleType) },
        isDefault: { type: 'boolean' },
        additionalPermissions: { type: 'array', items: { type: 'string' } },
        restrictedPermissions: { type: 'array', items: { type: 'string' } },
        expiresAt: { type: 'string', format: 'date-time', nullable: true },
      },
      required: ['roleType'],
    },
  })
  @ApiResponse({ status: 200, description: "Rôle de l'utilisateur modifié avec succès" })
  @ApiResponse({ status: 404, description: 'Utilisateur ou société non trouvé' })
  async updateUserRoleInSociete(
    @Param('societeId') societeId: string,
    @Param('userId') userId: string,
    @Body() body: {
      roleType: SocieteRoleType
      isDefault?: boolean
      additionalPermissions?: string[]
      restrictedPermissions?: string[]
      expiresAt?: Date
    },
    @Req() request: any
  ) {
    // Vérifier que l'utilisateur a déjà un rôle dans cette société
    const existingRole = await this.unifiedRolesService.getUserSocieteRole(userId, societeId)
    if (!existingRole) {
      throw new NotFoundException("L'utilisateur n'a pas de rôle dans cette société")
    }

    // Validation du nouveau rôle
    if (!Object.values(SocieteRoleType).includes(body.roleType)) {
      throw new BadRequestException('Type de rôle invalide')
    }

    try {
      const currentUser = request.user
      const updatedRole = await this.unifiedRolesService.assignUserToSociete(
        userId,
        societeId,
        body.roleType,
        currentUser.id,
        {
          isDefault: body.isDefault !== undefined ? body.isDefault : existingRole.isDefaultSociete,
          additionalPermissions: body.additionalPermissions || existingRole.additionalPermissions,
          restrictedPermissions: body.restrictedPermissions || existingRole.restrictedPermissions,
          expiresAt: body.expiresAt || existingRole.expiresAt,
        }
      )

      return {
        success: true,
        data: {
          id: updatedRole.id,
          userId: updatedRole.userId,
          societeId: updatedRole.societeId,
          roleType: updatedRole.roleType,
          isDefault: updatedRole.isDefaultSociete,
          isActive: updatedRole.isActive,
          grantedAt: updatedRole.grantedAt,
        },
        message: "Rôle de l'utilisateur modifié avec succès",
        statusCode: 200,
      }
    } catch (error: any) {
      throw new BadRequestException('Erreur lors de la modification du rôle')
    }
  }

  @Get(':id/stats')
  @ApiOperation({ summary: "Statistiques d'une société" })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  @ApiResponse({ status: 404, description: 'Société non trouvée' })
  async getSocieteStats(@Param('id') id: string) {
    const societe = await this.societesService.findById(id)
    if (!societe) {
      throw new NotFoundException('Société non trouvée')
    }

    // Compter les utilisateurs par rôle
    const allUsers = await this.usersService.findAll({})
    const roleStats: Record<string, number> = {}
    let totalUsers = 0
    let activeUsers = 0

    for (const user of allUsers) {
      const userSocieteRoles = await this.unifiedRolesService.getUserSocieteRoles(user.id)
      const userRoleInSociete = userSocieteRoles.find((role) => role.societeId === societe.id)

      if (userRoleInSociete) {
        totalUsers++
        if (userRoleInSociete.isActive) {
          activeUsers++
        }

        const roleType = userRoleInSociete.effectiveRole
        roleStats[roleType] = (roleStats[roleType] || 0) + 1
      }
    }

    return {
      success: true,
      data: {
        societeId: societe.id,
        societeName: societe.nom,
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        roleDistribution: Object.entries(roleStats).map(([role, count]) => ({
          role: this.roleFormattingService.formatSocieteRole(role as SocieteRoleType),
          count,
        })),
        sitesCount: societe.sites?.length || 0,
      },
    }
  }
}
