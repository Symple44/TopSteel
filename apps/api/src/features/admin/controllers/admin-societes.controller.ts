import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { Public } from '../../../core/multi-tenant'
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import type { Societe, Site } from '@prisma/client'
import { SocieteRoleType } from '../../../domains/auth/core/constants/roles.constants'
import { CombinedSecurityGuard } from '../../../domains/auth/security/guards/combined-security.guard'
import { RequireSystemAdmin } from '../../../domains/auth/security/guards/enhanced-roles.guard'
import { RoleFormattingService } from '../../../domains/auth/services/role-formatting.service'
import { UnifiedRolesService } from '../../../domains/auth/services/unified-roles.service'
import type { UserSocieteInfo } from '../../../domains/auth/services/unified-roles.service'
import { UsersService } from '../../../domains/users/users.service'
import { SocietesService } from '../../../features/societes/services/societes.service'
import type { SiteData, SocieteData } from '../../../types/entities/societe.types'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type {
  AddUserToSocieteBody,
  AddUserToSocieteResponse,
  AdminUserWithSocieteRole,
  AuthenticatedRequest,
  FormattedUserForSociete,
  RemoveUserFromSocieteResponse,
  RoleDistribution,
  SocieteStatsResponse,
  SocieteWithUserInfo,
  UpdateUserRoleBody,
  UpdateUserRoleResponse,
} from '../interfaces/admin-societes.interfaces'
import {
  isAuthenticatedUser,
  isDatabaseError,
  isAdminUserArray,
  hasOptionalSites,
  type EntityWithSites,
} from '../guards/type-guards'

// Type for Societe with sites included
type SocieteWithSites = Societe & EntityWithSites<Site>

interface SocieteQueryDto {
  page?: number
  limit?: number
  search?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL'
  includeUsers?: boolean
}

@Controller('admin/societes')
@ApiTags('🔧 Admin - Sociétés')
@Public() // Bypass global TenantGuard - CombinedSecurityGuard handles JWT auth
@UseGuards(CombinedSecurityGuard)
@RequireSystemAdmin()
@ApiBearerAuth('JWT-auth')
export class AdminSocietesController {
  private readonly logger = new Logger(AdminSocietesController.name)

  constructor(
    private readonly societesService: SocietesService,
    private readonly unifiedRolesService: UnifiedRolesService,
    private readonly roleFormattingService: RoleFormattingService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService
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
      // Récupérer les sociétés selon les filtres - type from Prisma
      let societesRaw: unknown
      if (query.status === 'ALL') {
        societesRaw = await this.societesService.findAll()
      } else {
        societesRaw = await this.societesService.findActive()
      }

      // Validate that the result is an array of entities with optional sites
      if (!Array.isArray(societesRaw) || !societesRaw.every(hasOptionalSites)) {
        throw new BadRequestException('Format de données invalide pour les sociétés')
      }
      let societes = societesRaw as SocieteWithSites[]

      // Appliquer la recherche si fournie
      if (query.search) {
        const searchTerm = query.search.toLowerCase()
        societes = societes.filter(
          (societe) =>
            societe.name.toLowerCase().includes(searchTerm) ||
            societe.code.toLowerCase().includes(searchTerm)
        )
      }

      // Pagination
      const page = query.page || 1
      const limit = query.limit || 10
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedSocietes = societes.slice(startIndex, endIndex)

      // OPTIMIZED: Formatter les données avec les utilisateurs si demandé
      const formattedSocietes = await Promise.all(
        paginatedSocietes.map(async (societe) => {
          let users: FormattedUserForSociete[] = []
          let userCount = 0

          // Utiliser la méthode optimisée pour éviter N+1
          const userRolesMap = await this.unifiedRolesService.getAllUsersRolesForSociete(societe.id)
          userCount = userRolesMap.size

          if (query.includeUsers && userRolesMap.size > 0) {
            users = await this.getFormattedUsersForSociete(societe.id, userRolesMap)
          }

          return {
            id: societe.id,
            nom: societe.name, // Map Prisma 'name' to interface 'nom'
            code: societe.code,
            status: (societe.isActive ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
            createdAt: societe.createdAt,
            updatedAt: societe.updatedAt,
            userCount,
            users: query.includeUsers ? users : undefined,
            sites: societe.sites?.map((site: Site) => ({
              id: site.id,
              nom: site.name,
              code: site.code,
              isPrincipal: false, // Not in Prisma schema
            })) || [],
          } as SocieteWithUserInfo
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
    } catch (_error) {
      throw new BadRequestException('Erreur lors de la récupération des sociétés')
    }
  }

  @Get(':id')
  @ApiOperation({ summary: "Récupérer les détails d'une société" })
  @ApiResponse({ status: 200, description: 'Détails de la société récupérés avec succès' })
  @ApiResponse({ status: 404, description: 'Société non trouvée' })
  async findSocieteById(@Param('id') id: string) {
    const societeRaw = await this.societesService.findById(id)

    if (!societeRaw) {
      throw new NotFoundException('Société non trouvée')
    }

    // Validate that the result has optional sites
    if (!hasOptionalSites<Site>(societeRaw)) {
      throw new BadRequestException('Format de données invalide pour la société')
    }
    const societe = societeRaw as SocieteWithSites

    // OPTIMIZED: Récupérer tous les utilisateurs ayant accès à cette société
    const userRolesMap = await this.unifiedRolesService.getAllUsersRolesForSociete(societe.id)
    const usersWithAccess = await this.getFormattedUsersForSociete(societe.id, userRolesMap)

    return {
      success: true,
      data: {
        id: societe.id,
        nom: societe.name, // Map Prisma 'name' to interface 'nom'
        code: societe.code,
        status: societe.isActive ? 'ACTIVE' : 'INACTIVE',
        databaseName: societe.databaseName,
        createdAt: societe.createdAt,
        updatedAt: societe.updatedAt,
        users: usersWithAccess,
        sites: societe.sites?.map((site: Site) => ({
          id: site.id,
          nom: site.name,
          code: site.code,
          isPrincipal: false, // Not in Prisma schema
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
    @Body() body: AddUserToSocieteBody,
    @Req() request: AuthenticatedRequest
  ): Promise<AddUserToSocieteResponse> {
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

    // Type guard for current user
    if (!isAuthenticatedUser(request.user)) {
      throw new BadRequestException('Utilisateur non authentifié')
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
          roleType: body.roleType,
          isDefault: body.isDefault || false,
          isActive: userSocieteRole.isActive,
          grantedAt: userSocieteRole.activatedAt || userSocieteRole.createdAt,
          grantedBy: currentUser.id,
        },
        message: 'Utilisateur ajouté à la société avec succès',
        statusCode: 201,
      }
    } catch (_error) {
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
  ): Promise<RemoveUserFromSocieteResponse> {
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
    @Body() body: UpdateUserRoleBody,
    @Req() request: AuthenticatedRequest
  ): Promise<UpdateUserRoleResponse> {
    // Vérifier que l'utilisateur a déjà un rôle dans cette société
    const existingRole = await this.unifiedRolesService.getUserSocieteRole(userId, societeId)
    if (!existingRole) {
      throw new NotFoundException("L'utilisateur n'a pas de rôle dans cette société")
    }

    // Validation du nouveau rôle
    if (!Object.values(SocieteRoleType).includes(body.roleType)) {
      throw new BadRequestException('Type de rôle invalide')
    }

    // Type guard for current user
    if (!isAuthenticatedUser(request.user)) {
      throw new BadRequestException('Utilisateur non authentifié')
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
          expiresAt: body.expiresAt || existingRole.expiresAt || undefined,
        }
      )

      return {
        success: true,
        data: {
          id: updatedRole.id,
          userId: updatedRole.userId,
          societeId: updatedRole.societeId,
          roleType: body.roleType,
          isDefault: body.isDefault !== undefined ? body.isDefault : (existingRole.isDefaultSociete || false),
          isActive: updatedRole.isActive,
          grantedAt: updatedRole.activatedAt || updatedRole.createdAt,
        },
        message: "Rôle de l'utilisateur modifié avec succès",
        statusCode: 200,
      }
    } catch (_error) {
      throw new BadRequestException('Erreur lors de la modification du rôle')
    }
  }

  @Get(':id/stats')
  @ApiOperation({ summary: "Statistiques d'une société" })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  @ApiResponse({ status: 404, description: 'Société non trouvée' })
  async getSocieteStats(@Param('id') id: string): Promise<SocieteStatsResponse> {
    const societeRaw = await this.societesService.findById(id)
    if (!societeRaw) {
      throw new NotFoundException('Société non trouvée')
    }

    // Validate that the result has optional sites
    if (!hasOptionalSites<Site>(societeRaw)) {
      throw new BadRequestException('Format de données invalide pour la société')
    }
    const societe = societeRaw as SocieteWithSites

    // OPTIMIZED: Compter les utilisateurs par rôle
    const userRolesMap = await this.unifiedRolesService.getAllUsersRolesForSociete(societe.id)
    const roleStats: Record<string, number> = {}
    let totalUsers = 0
    let activeUsers = 0

    for (const [userId, userRoleInfo] of userRolesMap.entries()) {
      totalUsers++
      if (userRoleInfo.isActive) {
        activeUsers++
      }

      const roleType = userRoleInfo.effectiveRole || 'UNKNOWN'
      roleStats[roleType] = (roleStats[roleType] || 0) + 1
    }

    return {
      success: true,
      data: {
        societeId: societe.id,
        societeName: societe.name, // Map Prisma 'name' to expected 'nom'
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        roleDistribution: Object.entries(roleStats).map(
          ([role, count]) =>
            ({
              role: this.roleFormattingService.formatSocieteRole(role as SocieteRoleType),
              count,
            }) as RoleDistribution
        ),
        sitesCount: societe.sites?.length || 0,
      },
    }
  }

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle société' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Code unique de la société' },
        name: { type: 'string', description: 'Nom de la société' },
        legalName: { type: 'string', description: 'Raison sociale', nullable: true },
        siret: { type: 'string', description: 'Numéro SIRET', nullable: true },
        address: { type: 'string', description: 'Adresse', nullable: true },
        city: { type: 'string', description: 'Ville', nullable: true },
        postalCode: { type: 'string', description: 'Code postal', nullable: true },
        country: { type: 'string', description: 'Pays', nullable: true },
        phone: { type: 'string', description: 'Téléphone', nullable: true },
        email: { type: 'string', description: 'Email', nullable: true },
        website: { type: 'string', description: 'Site web', nullable: true },
        databaseName: { type: 'string', description: 'Nom de la base de données', nullable: true },
        isActive: { type: 'boolean', description: 'Statut actif', default: true },
      },
      required: ['code', 'name'],
    },
  })
  @ApiResponse({ status: 201, description: 'Société créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Une société avec ce code existe déjà' })
  async createSociete(
    @Body()
    body: {
      code: string
      name: string
      legalName?: string
      siret?: string
      address?: string
      city?: string
      postalCode?: string
      country?: string
      phone?: string
      email?: string
      website?: string
      databaseName?: string
      isActive?: boolean
    },
    @Req() request: any
  ) {
    try {
      // Vérifier l'unicité du code
      const existingSociete = await this.societesService.findByCode(body.code)
      if (existingSociete) {
        throw new BadRequestException('Une société avec ce code existe déjà')
      }

      // Validation du nom (non vide)
      if (!body.name || body.name.trim().length === 0) {
        throw new BadRequestException('Le nom de la société est requis')
      }

      // Validation du code (non vide, format alphanumérique)
      if (!body.code || !/^[A-Za-z0-9_-]+$/.test(body.code)) {
        throw new BadRequestException(
          'Le code de la société est invalide (alphanumérique, tirets et underscores uniquement)'
        )
      }

      // Validation de l'email si fourni
      if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
        throw new BadRequestException('Format email invalide')
      }

      // Create societe - databaseName is auto-generated by service if not provided
      const societe = await this.societesService.create({
        code: body.code,
        name: body.name,
        legalName: body.legalName,
        siret: body.siret,
        address: body.address,
        city: body.city,
        postalCode: body.postalCode,
        country: body.country,
        phone: body.phone,
        email: body.email,
        website: body.website,
        databaseName: body.databaseName as string, // Service auto-generates if undefined
        isActive: body.isActive ?? true,
      })

      // Audit logging
      try {
        await this.prisma.auditLog.create({
          data: {
            userId: request.user?.id,
            societeId: societe.id,
            action: 'CREATE',
            resource: 'SOCIETE',
            resourceId: societe.id,
            description: `Création de la société ${societe.name} (${societe.code})`,
            ipAddress: request.ip || request.headers?.['x-forwarded-for'] || request.connection?.remoteAddress,
            userAgent: request.headers?.['user-agent'],
            changes: {
              code: societe.code,
              name: societe.name,
              legalName: societe.legalName,
              isActive: societe.isActive,
            },
            metadata: {
              action: 'societe_created',
              societeId: societe.id,
            },
          },
        })
      } catch (auditError) {
        this.logger.warn('Failed to create audit log:', auditError)
      }

      return {
        success: true,
        data: {
          id: societe.id,
          code: societe.code,
          nom: societe.name,
          legalName: societe.legalName,
          siret: societe.siret,
          address: societe.address,
          city: societe.city,
          postalCode: societe.postalCode,
          country: societe.country,
          phone: societe.phone,
          email: societe.email,
          website: societe.website,
          databaseName: societe.databaseName,
          isActive: societe.isActive,
          createdAt: societe.createdAt,
        },
        message: 'Société créée avec succès',
        statusCode: 201,
      }
    } catch (error: unknown) {
      // Gestion des erreurs Prisma pour violations d'unicité
      if (isDatabaseError(error) && error.code === 'P2002') {
        throw new BadRequestException('Une société avec ce code existe déjà')
      }
      throw error
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une société' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nom de la société', nullable: true },
        legalName: { type: 'string', description: 'Raison sociale', nullable: true },
        siret: { type: 'string', description: 'Numéro SIRET', nullable: true },
        address: { type: 'string', description: 'Adresse', nullable: true },
        city: { type: 'string', description: 'Ville', nullable: true },
        postalCode: { type: 'string', description: 'Code postal', nullable: true },
        country: { type: 'string', description: 'Pays', nullable: true },
        phone: { type: 'string', description: 'Téléphone', nullable: true },
        email: { type: 'string', description: 'Email', nullable: true },
        website: { type: 'string', description: 'Site web', nullable: true },
        isActive: { type: 'boolean', description: 'Statut actif', nullable: true },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Société mise à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Société non trouvée' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async updateSociete(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string
      legalName?: string
      siret?: string
      address?: string
      city?: string
      postalCode?: string
      country?: string
      phone?: string
      email?: string
      website?: string
      isActive?: boolean
    },
    @Req() request: any
  ) {
    try {
      // Vérifier que la société existe
      const existingSociete = await this.societesService.findById(id)
      if (!existingSociete) {
        throw new NotFoundException('Société non trouvée')
      }

      // Validation du nom si fourni (non vide)
      if (body.name !== undefined && (!body.name || body.name.trim().length === 0)) {
        throw new BadRequestException('Le nom de la société ne peut pas être vide')
      }

      // Validation de l'email si fourni
      if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
        throw new BadRequestException('Format email invalide')
      }

      // Capture changes for audit log
      const changes: Record<string, { old: any; new: any }> = {}
      if (body.name !== undefined && body.name !== existingSociete.name) {
        changes.name = { old: existingSociete.name, new: body.name }
      }
      if (body.legalName !== undefined && body.legalName !== existingSociete.legalName) {
        changes.legalName = { old: existingSociete.legalName, new: body.legalName }
      }
      if (body.siret !== undefined && body.siret !== existingSociete.siret) {
        changes.siret = { old: existingSociete.siret, new: body.siret }
      }
      if (body.email !== undefined && body.email !== existingSociete.email) {
        changes.email = { old: existingSociete.email, new: body.email }
      }
      if (body.isActive !== undefined && body.isActive !== existingSociete.isActive) {
        changes.isActive = { old: existingSociete.isActive, new: body.isActive }
      }

      const societe = await this.societesService.update(id, {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.legalName !== undefined && { legalName: body.legalName }),
        ...(body.siret !== undefined && { siret: body.siret }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.postalCode !== undefined && { postalCode: body.postalCode }),
        ...(body.country !== undefined && { country: body.country }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.website !== undefined && { website: body.website }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      })

      // Audit logging
      if (Object.keys(changes).length > 0) {
        try {
          await this.prisma.auditLog.create({
            data: {
              userId: request.user?.id,
              societeId: id,
              action: 'UPDATE',
              resource: 'SOCIETE',
              resourceId: id,
              description: `Mise à jour de la société ${societe.name} (${societe.code})`,
              ipAddress: request.ip || request.headers?.['x-forwarded-for'] || request.connection?.remoteAddress,
              userAgent: request.headers?.['user-agent'],
              changes,
              metadata: {
                action: 'societe_updated',
                societeId: id,
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
        data: {
          id: societe.id,
          code: societe.code,
          nom: societe.name,
          legalName: societe.legalName,
          siret: societe.siret,
          address: societe.address,
          city: societe.city,
          postalCode: societe.postalCode,
          country: societe.country,
          phone: societe.phone,
          email: societe.email,
          website: societe.website,
          databaseName: societe.databaseName,
          isActive: societe.isActive,
          updatedAt: societe.updatedAt,
        },
        message: 'Société mise à jour avec succès',
        statusCode: 200,
      }
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException('Erreur lors de la mise à jour de la société')
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une société (soft delete)' })
  @ApiResponse({ status: 200, description: 'Société supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Société non trouvée' })
  @ApiResponse({ status: 400, description: 'Impossible de supprimer cette société' })
  async deleteSociete(@Param('id') id: string, @Req() request: any) {
    try {
      // Vérifier que la société existe
      const existingSociete = await this.societesService.findById(id)
      if (!existingSociete) {
        throw new NotFoundException('Société non trouvée')
      }

      // Vérifier qu'il reste au moins une société active
      const activeSocietes = await this.societesService.findActive()
      if (existingSociete.isActive && activeSocietes.length <= 1) {
        throw new BadRequestException(
          'Impossible de supprimer la dernière société active. ' +
          'Au moins une société active doit être maintenue dans le système.'
        )
      }

      // Vérifier si la société a des utilisateurs actifs
      const allUsers: AdminUserWithSocieteRole[] = await this.usersService.findAll({})
      let activeUserCount = 0

      for (const user of allUsers) {
        const userSocieteRoles: UserSocieteInfo[] =
          await this.unifiedRolesService.getUserSocieteRoles(user.id)
        const hasActiveRole = userSocieteRoles.some(
          (role) => role.societeId === id && role.isActive
        )
        if (hasActiveRole) {
          activeUserCount++
        }
      }

      if (activeUserCount > 0) {
        throw new BadRequestException(
          `Impossible de supprimer cette société car elle a ${activeUserCount} utilisateur(s) actif(s). ` +
          'Veuillez d\'abord retirer ou désactiver tous les utilisateurs.'
        )
      }

      await this.societesService.delete(id)

      // Audit logging
      try {
        await this.prisma.auditLog.create({
          data: {
            userId: request.user?.id,
            societeId: id,
            action: 'DELETE',
            resource: 'SOCIETE',
            resourceId: id,
            description: `Suppression de la société ${existingSociete.name} (${existingSociete.code})`,
            ipAddress: request.ip || request.headers?.['x-forwarded-for'] || request.connection?.remoteAddress,
            userAgent: request.headers?.['user-agent'],
            changes: {
              deletedSociete: {
                id: existingSociete.id,
                code: existingSociete.code,
                name: existingSociete.name,
                legalName: existingSociete.legalName,
                isActive: existingSociete.isActive,
              },
            },
            metadata: {
              action: 'societe_deleted',
              societeId: id,
            },
          },
        })
      } catch (auditError) {
        this.logger.warn('Failed to create audit log:', auditError)
      }

      return {
        success: true,
        message: 'Société supprimée avec succès',
        statusCode: 200,
      }
    } catch (error: unknown) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException('Erreur lors de la suppression de la société')
    }
  }

  /**
   * Helper method to format user data with societe roles
   */
  private async formatUserWithSocieteRole(
    user: AdminUserWithSocieteRole,
    userRoleInfo: UserSocieteInfo
  ): Promise<FormattedUserForSociete> {
    return {
      id: user.id,
      email: user.email,
      firstName: user.prenom || '',
      lastName: user.nom || '',
      globalRole: this.roleFormattingService.formatGlobalRole(
        (user.role || 'USER') as import('../../../domains/auth/core/constants/roles.constants').GlobalUserRole
      ),
      societeRole: this.roleFormattingService.formatSocieteRole(
        userRoleInfo.effectiveRole || 'USER'
      ),
      isDefault: userRoleInfo.isDefaultSociete || false,
      isActive: userRoleInfo.isActive,
      grantedAt: userRoleInfo.grantedAt || user.createdAt || new Date(),
      expiresAt: userRoleInfo.expiresAt || undefined,
      additionalPermissions: userRoleInfo.additionalPermissions,
      restrictedPermissions: userRoleInfo.restrictedPermissions,
    }
  }

  /**
   * Helper method to get all users formatted with their societe roles
   */
  private async getFormattedUsersForSociete(
    societeId: string,
    userRolesMap: Map<string, UserSocieteInfo>
  ): Promise<FormattedUserForSociete[]> {
    if (userRolesMap.size === 0) return []

    // Récupérer les informations utilisateur en une seule requête
    const userIds = Array.from(userRolesMap.keys())
    const allUsersRaw = await this.usersService.findAll({})

    // Validate array of users
    if (!isAdminUserArray(allUsersRaw)) {
      throw new BadRequestException('Format de données invalide pour les utilisateurs')
    }

    const usersById = new Map<string, AdminUserWithSocieteRole>(
      allUsersRaw.map((u) => [u.id, u] as [string, AdminUserWithSocieteRole])
    )

    const formattedUsers: FormattedUserForSociete[] = []

    for (const [userId, userRoleInfo] of userRolesMap.entries()) {
      const user = usersById.get(userId)
      if (!user) continue

      formattedUsers.push(await this.formatUserWithSocieteRole(user, userRoleInfo))
    }

    return formattedUsers
  }
}
