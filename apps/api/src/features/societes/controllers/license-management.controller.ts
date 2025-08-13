import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GlobalUserRole } from '../../../domains/auth/core/constants/roles.constants'
import { Roles } from '../../../domains/auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import { RolesGuard } from '../../../domains/auth/security/guards/roles.guard'
import {
  type CheckFeatureDto,
  type CheckRestrictionDto,
  type CreateLicenseDto,
  LicenseResponseDto,
  LicenseUsageStatsDto,
  type SuspendLicenseDto,
  type UpdateLicenseDto,
} from '../dto/license.dto'
import type { SocieteLicense } from '../entities/societe-license.entity'
import type { LicenseManagementService } from '../services/license-management.service'

@ApiTags('License Management')
@ApiBearerAuth()
@Controller('api/admin/licenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LicenseManagementController {
  constructor(private readonly licenseService: LicenseManagementService) {}

  @Post('societe/:societeId')
  @Roles(GlobalUserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Créer une nouvelle licence pour une société' })
  @ApiResponse({ status: 201, type: LicenseResponseDto })
  async createLicense(
    @Param('societeId') societeId: string,
    @Body() createDto: CreateLicenseDto
  ): Promise<SocieteLicense> {
    return await this.licenseService.createLicense(societeId, createDto)
  }

  @Patch(':licenseId')
  @Roles(GlobalUserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mettre à jour une licence' })
  @ApiResponse({ status: 200, type: LicenseResponseDto })
  async updateLicense(
    @Param('licenseId') licenseId: string,
    @Body() updateDto: UpdateLicenseDto
  ): Promise<SocieteLicense> {
    return await this.licenseService.updateLicense(licenseId, updateDto)
  }

  @Post(':licenseId/suspend')
  @Roles(GlobalUserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Suspendre une licence' })
  @ApiResponse({ status: 200 })
  async suspendLicense(
    @Param('licenseId') licenseId: string,
    @Body() suspendDto: SuspendLicenseDto
  ): Promise<void> {
    await this.licenseService.suspendLicense(licenseId, suspendDto.reason)
  }

  @Get('societe/:societeId/usage')
  @Roles(GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN)
  @ApiOperation({ summary: "Obtenir les statistiques d'utilisation d'une licence" })
  @ApiResponse({ status: 200, type: LicenseUsageStatsDto })
  async getLicenseUsageStats(@Param('societeId') societeId: string): Promise<LicenseUsageStatsDto> {
    return await this.licenseService.getLicenseUsageStats(societeId)
  }

  @Post('check-feature')
  @Roles(GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN)
  @ApiOperation({ summary: 'Vérifier si une fonctionnalité est disponible' })
  @ApiResponse({ status: 200, type: Boolean })
  async checkFeature(@Body() checkDto: CheckFeatureDto): Promise<{ enabled: boolean }> {
    const enabled = await this.licenseService.isFeatureEnabled(checkDto.societeId, checkDto.feature)
    return { enabled }
  }

  @Post('check-restriction')
  @Roles(GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN)
  @ApiOperation({ summary: 'Vérifier une restriction quantitative' })
  @ApiResponse({ status: 200, type: Boolean })
  async checkRestriction(@Body() checkDto: CheckRestrictionDto): Promise<{ allowed: boolean }> {
    const allowed = await this.licenseService.checkRestriction(
      checkDto.societeId,
      checkDto.restriction,
      checkDto.currentValue
    )
    return { allowed }
  }

  @Post('cleanup-expired')
  @Roles(GlobalUserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Nettoyer manuellement les licences expirées' })
  @ApiResponse({ status: 200 })
  async cleanupExpiredLicenses(): Promise<{ message: string }> {
    await this.licenseService.checkAndCleanupExpiredLicenses()
    return { message: 'Nettoyage des licences expirées effectué' }
  }

  @Post('send-notifications')
  @Roles(GlobalUserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Envoyer manuellement les notifications de renouvellement' })
  @ApiResponse({ status: 200 })
  async sendRenewalNotifications(): Promise<{ message: string }> {
    await this.licenseService.sendRenewalNotifications()
    return { message: 'Notifications de renouvellement envoyées' }
  }
}
