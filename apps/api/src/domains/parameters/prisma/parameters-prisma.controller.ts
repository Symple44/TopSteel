import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/security/guards/jwt-auth.guard'
import { ParameterSystemPrismaService } from './parameter-system-prisma.service'

/**
 * ParametersPrismaController
 *
 * Contrôleur migré vers Prisma pour la gestion des paramètres système
 * Remplace progressivement ParametersController (TypeORM)
 *
 * Routes:
 * - GET /parameters-prisma/system/user_roles - Récupérer les rôles utilisateur
 * - GET /parameters-prisma/system/user_roles/cache/invalidate - Invalider le cache (placeholder)
 */
@Controller('parameters-prisma')
@ApiTags('🔧 Parameters (Prisma)')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ParametersPrismaController {
  constructor(private readonly parameterSystemService: ParameterSystemPrismaService) {}

  /**
   * Récupérer les rôles utilisateur depuis la base de données via Prisma
   */
  @Get('system/user_roles')
  @ApiOperation({
    summary: 'Récupérer les rôles utilisateur depuis Prisma',
    description:
      'Récupère les rôles utilisateur depuis parameter_system via Prisma (category=user_roles)',
  })
  @ApiResponse({ status: 200, description: 'Rôles utilisateur récupérés avec succès' })
  async getUserRoles(@Query('language') language = 'fr') {
    const roles = await this.parameterSystemService.getUserRoles(language)
    return {
      data: roles,
      statusCode: 200,
      message: 'Success',
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Invalider le cache des rôles utilisateur
   * Note: Pour l'instant, c'est un placeholder car le cache n'est pas encore implémenté au niveau Prisma
   */
  @Get('system/user_roles/cache/invalidate')
  @ApiOperation({
    summary: 'Invalider le cache des rôles utilisateur',
    description: 'Invalide le cache des rôles (placeholder - pas de cache Prisma actuellement)',
  })
  @ApiResponse({ status: 200, description: 'Cache invalidé avec succès' })
  async invalidateUserRolesCache() {
    // Note: Le ParameterSystemPrismaService ne gère pas encore de cache
    // Le cache pourrait être géré par un CacheService séparé (Redis)
    // Pour l'instant, cette route retourne simplement success
    return {
      statusCode: 200,
      message: 'Cache invalidé avec succès (Prisma service ne gère pas de cache interne)',
      timestamp: new Date().toISOString(),
    }
  }
}
