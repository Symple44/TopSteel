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
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger'
import {
    GlobalUserRole,
    SocieteRoleType,
} from '../../../domains/auth/core/constants/roles.constants'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import { RequireSystemAdmin } from '../../../domains/auth/security/guards/enhanced-roles.guard'
import { RequireSocieteContext } from '../../../domains/auth/security/guards/enhanced-tenant.guard'
import { RoleFormattingService } from '../../../domains/auth/services/role-formatting.service'
import { UnifiedRolesService } from '../../../domains/auth/services/unified-roles.service'
import { CreateUserDto } from '../../../domains/users/dto/create-user.dto'
import { UpdateUserDto } from '../../../domains/users/dto/update-user.dto'
import type { UserQueryDto } from '../../../domains/users/dto/user-query.dto'
import { UsersService } from '../../../domains/users/users.service'
import { OptimizedCacheService } from '../../../infrastructure/cache/redis-optimized.service'
import { Public } from '../../../core/multi-tenant'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import {
  isAuthenticatedUser,
  isUserWithTenant,
  isDatabaseError,
  type AuthenticatedUser,
  type UserWithTenant,
} from '../guards/type-guards'

@Controller('admin/users')
@ApiTags('🔧 Admin - Users')
@Public() // Bypass TenantGuard - JwtAuthGuard handles authentication
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AdminUsersController {
  private readonly logger = new Logger(AdminUsersController.name)

  constructor(
    private readonly usersService: UsersService,
    private readonly unifiedRolesService: UnifiedRolesService,
    private readonly roleFormattingService: RoleFormattingService,
    private readonly cacheService: OptimizedCacheService,
    private readonly prisma: PrismaService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lister tous les utilisateurs (Administration)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'includePermissions',
    required: false,
    type: Boolean,
    description: 'Inclure les permissions dans la réponse',
  })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs récupérée avec succès' })
  async findAllUsers(@Query() query: UserQueryDto & { includePermissions?: boolean }) {
    // Créer une clé de cache basée sur les paramètres de requête
    const cacheKey = `admin:users:${JSON.stringify(query)}`

    // Vérifier le cache d'abord
    const cachedResult = await this.cacheService.get(cacheKey)
    if (cachedResult) {
      return cachedResult
    }

    const users = await this.usersService.findAll(query)

    // Adapter les données avec le formatage des rôles amélioré
    const formattedUsers = await Promise.all(
      users.map(async (user: { id: string; email: string; prenom?: string | null; nom?: string | null; acronyme?: string | null; actif: boolean; createdAt?: Date | null; dernier_login?: Date | null; role: string }) => {
        const formattedGlobalRole = user.role
          ? this.roleFormattingService.formatGlobalRole(user.role as GlobalUserRole)
          : null

        // Récupérer les rôles société si demandé
        let societeRoles: Record<string, unknown>[] = []
        if (query.includePermissions) {
          const userSocieteRoles = await this.unifiedRolesService.getUserSocieteRoles(user.id)
          societeRoles = userSocieteRoles.map((roleInfo) => ({
            societeId: roleInfo.societeId,
            role: this.roleFormattingService.formatSocieteRole(roleInfo.societeRole),
            effectiveRole: this.roleFormattingService.formatSocieteRole(roleInfo.effectiveRole),
            isDefault: roleInfo.isDefaultSociete,
            isActive: roleInfo.isActive,
            expiresAt: roleInfo.expiresAt,
          }))
        }

        return {
          id: user.id,
          email: user.email,
          firstName: user.prenom || '',
          lastName: user.nom || '',
          acronym: user.acronyme || '',
          phone: null, // Non disponible dans notre entité
          department: null, // Non disponible dans notre entité
          isActive: user.actif,
          createdAt: user.createdAt,
          lastLogin: user.dernier_login,
          globalRole: formattedGlobalRole,
          // Maintenir la compatibilité avec l'ancien format
          roles: formattedGlobalRole
            ? [
                {
                  id: formattedGlobalRole.id,
                  name: formattedGlobalRole.displayName,
                  description: formattedGlobalRole.description,
                  color: formattedGlobalRole.color,
                  icon: formattedGlobalRole.icon,
                  hierarchy: formattedGlobalRole.hierarchy,
                  assignedAt: user.createdAt || new Date().toISOString(),
                },
              ]
            : [],
          societeRoles,
          groups: [], // Pas de groupes dans notre système actuel
          permissions: query.includePermissions ? await this.getUserPermissions(user.id) : [],
        }
      })
    )

    const result = {
      success: true,
      data: formattedUsers,
      meta: {
        total: formattedUsers.length,
        includePermissions: query.includePermissions || false,
      },
    }

    // Mettre en cache pour 2 minutes (120 secondes)
    await this.cacheService.set(cacheKey, result, 120)

    return result
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques administrateur des utilisateurs' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  async getAdminStats() {
    return this.usersService.getStats()
  }

  @Get('roles')
  @ApiOperation({ summary: 'Récupérer tous les rôles disponibles avec leur formatage' })
  @ApiResponse({ status: 200, description: 'Liste des rôles formatés récupérée avec succès' })
  async getAvailableRoles() {
    const globalRoles = this.roleFormattingService.getAllFormattedGlobalRoles()
    const societeRoles = this.roleFormattingService.getAllFormattedSocieteRoles()

    return {
      success: true,
      data: {
        globalRoles,
        societeRoles,
        css: this.roleFormattingService.getRoleBadgeCSS(),
      },
      message: 'Rôles formatés récupérés avec succès',
      statusCode: 200,
    }
  }

  @Get(':id')
  @ApiOperation({ summary: "Récupérer les détails d'un utilisateur" })
  @ApiResponse({ status: 200, description: "Détails de l'utilisateur récupérés avec succès" })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async findUserById(@Param('id') id: string) {
    const user = await this.usersService.findById(id)

    if (!user) {
      return {
        success: false,
        message: 'Utilisateur non trouvé',
        statusCode: 404,
      }
    }

    // Formatter les données avec le formatage des rôles amélioré
    const formattedGlobalRole = user.role
      ? this.roleFormattingService.formatGlobalRole(user.role as GlobalUserRole)
      : null

    // Récupérer les rôles société pour cet utilisateur
    const userSocieteRoles = await this.unifiedRolesService.getUserSocieteRoles(user.id)
    const societeRoles = userSocieteRoles.map((roleInfo) => ({
      societeId: roleInfo.societeId,
      role: this.roleFormattingService.formatSocieteRole(roleInfo.societeRole),
      effectiveRole: this.roleFormattingService.formatSocieteRole(roleInfo.effectiveRole),
      isDefault: roleInfo.isDefaultSociete,
      isActive: roleInfo.isActive,
      grantedAt: roleInfo.expiresAt,
      additionalPermissions: roleInfo.additionalPermissions,
      restrictedPermissions: roleInfo.restrictedPermissions,
    }))

    const formattedUser = {
      id: user.id,
      email: user.email,
      firstName: user.prenom || '',
      lastName: user.nom || '',
      acronym: user.acronyme || '',
      phone: null, // Non disponible dans notre entité
      department: null, // Non disponible dans notre entité
      isActive: user.actif,
      lastLogin: user.dernier_login,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      globalRole: formattedGlobalRole,
      // Maintenir la compatibilité avec l'ancien format
      roles: formattedGlobalRole
        ? [
            {
              id: formattedGlobalRole.id,
              name: formattedGlobalRole.displayName,
              description: formattedGlobalRole.description,
              color: formattedGlobalRole.color,
              icon: formattedGlobalRole.icon,
              hierarchy: formattedGlobalRole.hierarchy,
            },
          ]
        : [],
      societeRoles,
      groups: [], // Pas de groupes dans notre système actuel
    }

    return {
      success: true,
      data: formattedUser,
      statusCode: 200,
      message: 'Success',
      timestamp: new Date().toISOString(),
    }
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouvel utilisateur' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Utilisateur créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Utilisateur déjà existant' })
  async createUser(@Body() createUserDto: CreateUserDto, @Req() request: any) {
    try {
      // Validation supplémentaire pour les rôles
      if (
        createUserDto.role &&
        !Object.values(GlobalUserRole).includes(createUserDto.role as GlobalUserRole)
      ) {
        throw new BadRequestException('Rôle invalide')
      }

      const user = await this.usersService.create(createUserDto)

      // Audit logging
      try {
        await this.prisma.auditLog.create({
          data: {
            userId: request.user?.id,
            action: 'CREATE',
            resource: 'USER',
            resourceId: user.id,
            description: `Création de l'utilisateur ${user.email}`,
            ipAddress: request.ip || request.headers?.['x-forwarded-for'] || request.connection?.remoteAddress,
            userAgent: request.headers?.['user-agent'],
            changes: {
              email: user.email,
              nom: user.nom,
              prenom: user.prenom,
              role: user.role,
              actif: user.actif,
            },
            metadata: {
              action: 'user_created',
              userId: user.id,
            },
          },
        })
      } catch (auditError) {
        this.logger.warn('Failed to create audit log:', auditError)
      }

      // Invalider le cache des utilisateurs
      await this.invalidateUsersCache()

      return {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.prenom || '',
          lastName: user.nom || '',
          role: user.role,
          isActive: user.actif,
          createdAt: user.createdAt,
        },
        message: 'Utilisateur créé avec succès',
        statusCode: 201,
      }
    } catch (error: unknown) {
      if (isDatabaseError(error) && error.code === '23505') {
        // Violation de contrainte unique PostgreSQL
        throw new BadRequestException('Un utilisateur avec cet email existe déjà')
      }
      throw error
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un utilisateur' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Utilisateur mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() request: any) {
    try {
      // Vérifier que l'utilisateur existe
      const existingUser = await this.usersService.findById(id)
      if (!existingUser) {
        throw new NotFoundException('Utilisateur non trouvé')
      }

      // Validation supplémentaire pour les rôles si fourni
      if (
        updateUserDto.role &&
        !Object.values(GlobalUserRole).includes(updateUserDto.role as GlobalUserRole)
      ) {
        throw new BadRequestException('Rôle invalide')
      }

      // Capture changes for audit log
      const changes: Record<string, { old: any; new: any }> = {}
      if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
        changes.email = { old: existingUser.email, new: updateUserDto.email }
      }
      if (updateUserDto.nom && updateUserDto.nom !== existingUser.nom) {
        changes.nom = { old: existingUser.nom, new: updateUserDto.nom }
      }
      if (updateUserDto.prenom && updateUserDto.prenom !== existingUser.prenom) {
        changes.prenom = { old: existingUser.prenom, new: updateUserDto.prenom }
      }
      if (updateUserDto.role && updateUserDto.role !== existingUser.role) {
        changes.role = { old: existingUser.role, new: updateUserDto.role }
      }
      if (updateUserDto.actif !== undefined && updateUserDto.actif !== existingUser.actif) {
        changes.actif = { old: existingUser.actif, new: updateUserDto.actif }
      }
      if (updateUserDto.password) {
        changes.password = { old: '[MASKED]', new: '[MASKED]' }
      }

      await this.usersService.update(id, updateUserDto)
      const updatedUser = await this.usersService.findById(id)

      if (!updatedUser) {
        throw new NotFoundException('Utilisateur non trouvé après mise à jour')
      }

      // Audit logging
      if (Object.keys(changes).length > 0) {
        try {
          await this.prisma.auditLog.create({
            data: {
              userId: request.user?.id,
              action: 'UPDATE',
              resource: 'USER',
              resourceId: id,
              description: `Mise à jour de l'utilisateur ${updatedUser.email}`,
              ipAddress: request.ip || request.headers?.['x-forwarded-for'] || request.connection?.remoteAddress,
              userAgent: request.headers?.['user-agent'],
              changes,
              metadata: {
                action: 'user_updated',
                userId: id,
                fieldsChanged: Object.keys(changes),
              },
            },
          })
        } catch (auditError) {
          this.logger.warn('Failed to create audit log:', auditError)
        }
      }

      // Invalider le cache des utilisateurs
      await this.invalidateUsersCache()

      return {
        success: true,
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.prenom || '',
          lastName: updatedUser.nom || '',
          role: updatedUser.role,
          isActive: updatedUser.actif,
          updatedAt: updatedUser.updatedAt,
        },
        message: 'Utilisateur mis à jour avec succès',
        statusCode: 200,
      }
    } catch (error: unknown) {
      if (isDatabaseError(error) && error.code === '23505') {
        throw new BadRequestException('Un utilisateur avec cet email existe déjà')
      }
      throw error
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiResponse({ status: 400, description: 'Impossible de supprimer cet utilisateur' })
  async deleteUser(@Param('id') id: string, @Req() request: any) {
    // Vérifier que l'utilisateur existe
    const existingUser = await this.usersService.findById(id)
    if (!existingUser) {
      throw new NotFoundException('Utilisateur non trouvé')
    }

    // Protection : empêcher la suppression du dernier SUPER_ADMIN
    if (existingUser.role === GlobalUserRole.SUPER_ADMIN) {
      // Compter le nombre de SUPER_ADMIN actifs
      const allUsers = await this.usersService.findAll({})
      const superAdminCount = allUsers.filter(
        (user: { role?: string; actif?: boolean }) =>
          user.role === GlobalUserRole.SUPER_ADMIN && user.actif
      ).length

      if (superAdminCount <= 1) {
        throw new BadRequestException(
          'Impossible de supprimer le dernier administrateur système (SUPER_ADMIN). ' +
          'Au moins un SUPER_ADMIN actif doit être maintenu dans le système.'
        )
      }

      this.logger.warn(
        `Tentative de suppression d'un SUPER_ADMIN (${existingUser.email}). ` +
        `${superAdminCount - 1} SUPER_ADMIN(s) restera(ont) actif(s).`
      )
    }

    try {
      await this.usersService.remove(id)

      // Audit logging
      try {
        await this.prisma.auditLog.create({
          data: {
            userId: request.user?.id,
            action: 'DELETE',
            resource: 'USER',
            resourceId: id,
            description: `Suppression de l'utilisateur ${existingUser.email}`,
            ipAddress: request.ip || request.headers?.['x-forwarded-for'] || request.connection?.remoteAddress,
            userAgent: request.headers?.['user-agent'],
            changes: {
              deletedUser: {
                id: existingUser.id,
                email: existingUser.email,
                nom: existingUser.nom,
                prenom: existingUser.prenom,
                role: existingUser.role,
              },
            },
            metadata: {
              action: 'user_deleted',
              userId: id,
            },
          },
        })
      } catch (auditError) {
        this.logger.warn('Failed to create audit log:', auditError)
      }

      // Invalider le cache des utilisateurs
      await this.invalidateUsersCache()

      return {
        success: true,
        message: 'Utilisateur supprimé avec succès',
        statusCode: 200,
      }
    } catch (_error: unknown) {
      throw new BadRequestException("Erreur lors de la suppression de l'utilisateur")
    }
  }

  @Post(':id/roles')
  @RequireSocieteContext()
  @ApiOperation({ summary: 'Assigner un rôle société à un utilisateur' })
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
  @ApiResponse({ status: 201, description: 'Rôle assigné avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiResponse({ status: 403, description: 'Privilèges insuffisants pour assigner ce rôle' })
  async assignSocieteRole(
    @Param('id') userId: string,
    @Body() body: {
      roleType: SocieteRoleType
      isDefault?: boolean
      additionalPermissions?: string[]
      restrictedPermissions?: string[]
      expiresAt?: Date
    },
    @Req() request: Record<string, unknown>
  ) {
    // Type guard for tenant
    if (!isUserWithTenant(request.tenant)) {
      throw new BadRequestException('Contexte de société requis')
    }
    const tenant = request.tenant

    // Type guard for current user
    if (!isAuthenticatedUser(request.user)) {
      throw new BadRequestException('Utilisateur non authentifié')
    }
    const currentUser = request.user

    // Vérifier que l'utilisateur existe
    const user = await this.usersService.findById(userId)
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé')
    }

    // Validation du rôle
    if (!Object.values(SocieteRoleType).includes(body.roleType)) {
      throw new BadRequestException('Type de rôle invalide')
    }

    // VÉRIFICATION DE LA HIÉRARCHIE DES RÔLES
    // Récupérer le rôle global de l'utilisateur courant (celui qui fait l'action)
    const currentUserData = await this.usersService.findById(currentUser.id)
    if (!currentUserData) {
      throw new BadRequestException('Utilisateur courant non trouvé')
    }
    const currentUserGlobalRole = (currentUserData.role || 'USER') as GlobalUserRole

    // SUPER_ADMIN peut assigner n'importe quel rôle
    if (currentUserGlobalRole !== GlobalUserRole.SUPER_ADMIN) {
      // Récupérer le rôle société actuel de l'utilisateur courant dans cette société
      const currentUserSocieteRole = await this.unifiedRolesService.getUserSocieteRole(
        currentUser.id,
        tenant.societeId
      )

      if (!currentUserSocieteRole) {
        throw new BadRequestException(
          "Vous n'avez pas de rôle dans cette société pour effectuer cette opération"
        )
      }

      // Obtenir le rôle effectif de l'utilisateur courant
      const currentUserEffectiveSocieteRole = currentUserSocieteRole.effectiveRole as SocieteRoleType

      // Vérifier que l'utilisateur courant peut assigner le rôle demandé
      // L'utilisateur peut uniquement assigner des rôles de niveau égal ou inférieur
      const canAssignRole = this.canAssignSocieteRole(
        currentUserEffectiveSocieteRole,
        body.roleType
      )

      if (!canAssignRole) {
        throw new BadRequestException(
          `Vous ne pouvez pas assigner le rôle "${body.roleType}". ` +
          `Votre rôle actuel (${currentUserEffectiveSocieteRole}) ne vous permet d'assigner que des rôles de niveau égal ou inférieur.`
        )
      }
    }

    try {
      const userSocieteRole = await this.unifiedRolesService.assignUserToSociete(
        userId,
        tenant.societeId,
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
        },
        message: 'Rôle société assigné avec succès',
        statusCode: 201,
      }
    } catch (_error: unknown) {
      throw new BadRequestException("Erreur lors de l'assignation du rôle")
    }
  }

  @Delete(':id/roles/:societeId')
  @RequireSocieteContext()
  @ApiOperation({ summary: "Révoquer l'accès d'un utilisateur à une société" })
  @ApiResponse({ status: 200, description: 'Accès révoqué avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur ou rôle non trouvé' })
  async revokeSocieteAccess(@Param('id') userId: string, @Param('societeId') societeId: string) {
    const success = await this.unifiedRolesService.revokeUserFromSociete(userId, societeId)

    if (!success) {
      throw new NotFoundException('Utilisateur ou rôle société non trouvé')
    }

    return {
      success: true,
      message: 'Accès à la société révoqué avec succès',
      statusCode: 200,
    }
  }

  @Get(':id/societes')
  @ApiOperation({ summary: 'Lister les sociétés accessibles par un utilisateur' })
  @ApiResponse({ status: 200, description: 'Liste des sociétés récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async getUserSocietes(@Param('id') userId: string) {
    // Vérifier que l'utilisateur existe
    const user = await this.usersService.findById(userId)
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé')
    }

    const userSocietes = await this.unifiedRolesService.getUserSocieteRoles(userId)

    return {
      success: true,
      data: userSocietes.map((info) => ({
        societeId: info.societeId,
        globalRole: info.globalRole,
        societeRole: info.societeRole,
        effectiveRole: info.effectiveRole,
        isDefaultSociete: info.isDefaultSociete,
        isActive: info.isActive,
        permissions: info.permissions,
        additionalPermissions: info.additionalPermissions,
        restrictedPermissions: info.restrictedPermissions,
        expiresAt: info.expiresAt,
      })),
      message: 'Liste des sociétés récupérée avec succès',
      statusCode: 200,
    }
  }

  /**
   * Récupère les permissions d'un utilisateur
   */
  private async getUserPermissions(userId: string): Promise<string[]> {
    try {
      // Récupérer les permissions via le service unifié de rôles
      const userSocieteRoles = await this.unifiedRolesService.getUserSocieteRoles(userId)

      // Collecter toutes les permissions des différents rôles
      const allPermissions = new Set<string>()

      for (const roleInfo of userSocieteRoles) {
        // Ajouter les permissions du rôle
        if (roleInfo.permissions) {
          roleInfo.permissions.forEach((permission) => {
            allPermissions.add(permission)
          })
        }

        // Ajouter les permissions additionnelles
        if (roleInfo.additionalPermissions) {
          roleInfo.additionalPermissions.forEach((permission) => {
            allPermissions.add(permission)
          })
        }

        // Retirer les permissions restreintes
        if (roleInfo.restrictedPermissions) {
          roleInfo.restrictedPermissions.forEach((permission) => {
            allPermissions.delete(permission)
          })
        }
      }

      return Array.from(allPermissions)
    } catch (error) {
      this.logger?.warn('Erreur lors de la récupération des permissions utilisateur:', error)
      return []
    }
  }

  /**
   * Invalide le cache des utilisateurs
   */
  private async invalidateUsersCache(): Promise<void> {
    try {
      // Invalider toutes les clés de cache liées aux utilisateurs en utilisant un pattern
      await this.cacheService.invalidatePattern('admin:users:*')
    } catch (error) {
      this.logger.warn('Erreur lors de l\'invalidation du cache utilisateurs:', error)
    }
  }

  /**
   * Vérifie si un utilisateur avec un rôle donné peut assigner un autre rôle
   * Un utilisateur peut assigner des rôles de niveau égal ou inférieur au sien
   */
  private canAssignSocieteRole(
    assignerRole: SocieteRoleType,
    roleToAssign: SocieteRoleType
  ): boolean {
    // Import des constantes de hiérarchie
    const { SOCIETE_ROLE_HIERARCHY } = require('../../../domains/auth/core/constants/roles.constants')

    // Récupérer les niveaux hiérarchiques
    const assignerLevel = SOCIETE_ROLE_HIERARCHY[assignerRole]
    const roleToAssignLevel = SOCIETE_ROLE_HIERARCHY[roleToAssign]

    // L'utilisateur peut assigner un rôle si son niveau est supérieur ou égal
    return assignerLevel >= roleToAssignLevel
  }
}
