import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GlobalUserRole } from '../../auth/core/constants/roles.constants'
import { Roles } from '../../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../../auth/security/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/security/guards/roles.guard'
import {
  ActivateLicenseDto,
  RenewLicenseDto,
  RevokeLicenseDto,
  SuspendLicenseDto,
  ValidateLicenseDto,
} from '../dto/license-status.dto'
import { LicensePrismaService } from '../prisma/license-prisma.service'

/**
 * License Status Controller
 *
 * Gestion du statut des licenses (activation, suspension, révocation, renouvellement)
 * Routes: /api/licensing/licenses/:id/...
 */
@ApiTags('Licensing - Status')
@ApiBearerAuth()
@Controller('api/licensing/licenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LicenseStatusController {
  constructor(private readonly licenseService: LicensePrismaService) {}

  /**
   * Activer une license
   */
  @Post(':id/activate')
  @Roles(GlobalUserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Activer une license' })
  @ApiResponse({ status: 200, description: 'License activée' })
  @ApiResponse({ status: 400, description: 'License déjà active' })
  async activateLicense(@Param('id') id: string, @Body() dto: ActivateLicenseDto) {
    return await this.licenseService.activateLicense(id, dto.activatedBy)
  }

  /**
   * Suspendre une license
   */
  @Post(':id/suspend')
  @Roles(GlobalUserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Suspendre une license' })
  @ApiResponse({ status: 200, description: 'License suspendue' })
  @ApiResponse({ status: 400, description: 'License déjà suspendue' })
  async suspendLicense(@Param('id') id: string, @Body() dto: SuspendLicenseDto) {
    return await this.licenseService.suspendLicense(id, dto.reason)
  }

  /**
   * Révoquer une license
   */
  @Post(':id/revoke')
  @Roles(GlobalUserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Révoquer une license' })
  @ApiResponse({ status: 200, description: 'License révoquée' })
  @ApiResponse({ status: 400, description: 'License déjà révoquée' })
  async revokeLicense(@Param('id') id: string, @Body() dto: RevokeLicenseDto) {
    return await this.licenseService.revokeLicense(id, dto.reason)
  }

  /**
   * Renouveler une license
   */
  @Post(':id/renew')
  @Roles(GlobalUserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Renouveler une license' })
  @ApiResponse({ status: 200, description: 'License renouvelée' })
  @ApiResponse({ status: 404, description: 'License non trouvée' })
  async renewLicense(@Param('id') id: string, @Body() dto: RenewLicenseDto) {
    // Provide required expiresAt if not specified
    const renewData = {
      expiresAt: dto.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 year default
      price: dto.price,
      billingCycle: dto.billingCycle,
    }
    return await this.licenseService.renewLicense(id, renewData)
  }

  /**
   * Valider une license par sa clé
   */
  @Post('validate')
  @Roles(GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN, GlobalUserRole.USER)
  @ApiOperation({ summary: 'Valider une license par sa clé' })
  @ApiResponse({ status: 200, description: 'Résultat de la validation' })
  async validateLicense(@Body() dto: ValidateLicenseDto) {
    return await this.licenseService.validateLicense(dto.licenseKey)
  }
}
