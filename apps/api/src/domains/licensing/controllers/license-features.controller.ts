import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GlobalUserRole } from '../../auth/core/constants/roles.constants'
import { Roles } from '../../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../../auth/security/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/security/guards/roles.guard'
import { CreateFeatureDto, IncrementFeatureUsageDto } from '../dto/feature.dto'
import { LicensePrismaService } from '../prisma/license-prisma.service'

/**
 * License Features Controller
 *
 * Gestion des features des licenses
 * Routes: /api/licensing/licenses/:licenseId/features
 */
@ApiTags('Licensing - Features')
@ApiBearerAuth()
@Controller('api/licensing/licenses/:licenseId/features')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LicenseFeaturesController {
  constructor(private readonly licenseService: LicensePrismaService) {}

  /**
   * Récupérer toutes les features d'une license
   */
  @Get()
  @Roles(GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN)
  @ApiOperation({ summary: 'Récupérer toutes les features d\'une license' })
  @ApiResponse({ status: 200, description: 'Liste des features' })
  async getFeatures(@Param('licenseId') licenseId: string) {
    // Get license with features included
    const license = await this.licenseService.findById(licenseId)
    return (license as any)?.features || []
  }

  /**
   * Ajouter une feature à une license
   */
  @Post()
  @Roles(GlobalUserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Ajouter une feature à une license' })
  @ApiResponse({ status: 201, description: 'Feature ajoutée' })
  @ApiResponse({ status: 400, description: 'Feature déjà existante' })
  async addFeature(@Param('licenseId') licenseId: string, @Body() featureDto: CreateFeatureDto) {
    return await this.licenseService.addFeature(licenseId, featureDto)
  }

  /**
   * Vérifier la disponibilité d'une feature
   */
  @Get(':featureCode/availability')
  @Roles(GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN, GlobalUserRole.USER)
  @ApiOperation({ summary: 'Vérifier la disponibilité d\'une feature' })
  @ApiResponse({ status: 200, description: 'Statut de disponibilité' })
  async checkAvailability(
    @Param('licenseId') licenseId: string,
    @Param('featureCode') featureCode: string
  ) {
    return await this.licenseService.checkFeatureAvailability(licenseId, featureCode)
  }

  /**
   * Activer une feature
   */
  @Patch(':featureCode/enable')
  @Roles(GlobalUserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Activer une feature' })
  @ApiResponse({ status: 200, description: 'Feature activée' })
  @ApiResponse({ status: 404, description: 'Feature non trouvée' })
  async enableFeature(
    @Param('licenseId') licenseId: string,
    @Param('featureCode') featureCode: string
  ) {
    return await this.licenseService.enableFeature(licenseId, featureCode)
  }

  /**
   * Désactiver une feature
   */
  @Patch(':featureCode/disable')
  @Roles(GlobalUserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Désactiver une feature' })
  @ApiResponse({ status: 200, description: 'Feature désactivée' })
  @ApiResponse({ status: 404, description: 'Feature non trouvée' })
  async disableFeature(
    @Param('licenseId') licenseId: string,
    @Param('featureCode') featureCode: string
  ) {
    return await this.licenseService.disableFeature(licenseId, featureCode)
  }

  /**
   * Incrémenter l'usage d'une feature
   */
  @Post(':featureCode/increment')
  @Roles(GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN)
  @ApiOperation({ summary: 'Incrémenter l\'usage d\'une feature' })
  @ApiResponse({ status: 200, description: 'Usage incrémenté' })
  async incrementUsage(
    @Param('licenseId') licenseId: string,
    @Param('featureCode') featureCode: string,
    @Body() dto: IncrementFeatureUsageDto
  ) {
    return await this.licenseService.incrementFeatureUsage(
      licenseId,
      featureCode,
      dto.amount || 1
    )
  }
}
