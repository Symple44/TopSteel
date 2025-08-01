import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { OptimizedCacheService } from '../../../infrastructure/cache/redis-optimized.service'
import { Roles } from '../../../core/common/decorators/roles.decorator'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import { RolesGuard } from '../../../domains/auth/security/guards/roles.guard'
import { UserQueryDto } from '../../../domains/users/dto/user-query.dto'
import { UserRole } from '../../../domains/users/entities/user.entity'
import { UsersService } from '../../../domains/users/users.service'

@Controller('admin/users')
@ApiTags('🔧 Admin - Users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AdminUsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cacheService: OptimizedCacheService
  ) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Lister tous les utilisateurs (Administration)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'includePermissions', required: false, type: Boolean, description: 'Inclure les permissions dans la réponse' })
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
    
    // Adapter les données pour correspondre à l'interface frontend
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.prenom || '',
      lastName: user.nom || '',
      phone: null, // Non disponible dans notre entité
      department: null, // Non disponible dans notre entité
      isActive: user.actif,
      createdAt: user.createdAt,
      lastLogin: user.dernier_login,
      roles: user.role ? [{
        id: user.role,
        name: user.role,
        description: `Rôle ${user.role}`,
        assignedAt: user.createdAt || new Date().toISOString(),
      }] : [],
      groups: [], // Pas de groupes dans notre système actuel
      permissions: [] // TODO: Récupérer les vraies permissions si nécessaire
    }))
    
    const result = {
      success: true,
      data: formattedUsers,
      meta: {
        total: formattedUsers.length,
        includePermissions: query.includePermissions || false
      }
    }
    
    // Mettre en cache pour 2 minutes (120 secondes)
    await this.cacheService.set(cacheKey, result, 120)
    
    return result
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Statistiques administrateur des utilisateurs' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  async getAdminStats() {
    return this.usersService.getStats()
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Récupérer les détails d\'un utilisateur' })
  @ApiResponse({ status: 200, description: 'Détails de l\'utilisateur récupérés avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async findUserById(@Param('id') id: string) {
    const user = await this.usersService.findById(id)
    
    if (!user) {
      return {
        success: false,
        message: 'Utilisateur non trouvé',
        statusCode: 404
      }
    }
    
    // Formatter les données pour correspondre à l'interface frontend
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
      roles: user.role ? [{
        id: user.role,
        name: user.role,
        description: `Rôle ${user.role}`,
      }] : [],
      groups: [], // Pas de groupes dans notre système actuel
    }
    
    return {
      success: true,
      data: formattedUser,
      statusCode: 200,
      message: 'Success',
      timestamp: new Date().toISOString()
    }
  }
}
