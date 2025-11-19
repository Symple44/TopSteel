import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GlobalUserRole } from '../../auth/core/constants/roles.constants'
import { Roles } from '../../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../../auth/security/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/security/guards/roles.guard'
import {
  CreateActivationDto,
  DeactivateActivationDto,
  UpdateHeartbeatDto,
} from '../dto/activation.dto'
import { LicensePrismaService } from '../prisma/license-prisma.service'

/**
 * License Activations Controller
 *
 * Gestion des activations de licenses sur les machines
 * - Activer license sur une machine
 * - Mettre à jour heartbeat
 * - Désactiver machine
 * - Lister activations
 * - Vérifier limites machines
 *
 * Routes: /api/licensing/licenses/:licenseId/activations
 *         /api/licensing/activations/:activationKey/...
 */
@ApiTags('Licensing - Activations')
@ApiBearerAuth()
@Controller('api/licensing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LicenseActivationsController {
  constructor(private readonly licenseService: LicensePrismaService) {}

  /**
   * Créer une activation sur une machine
   */
  @Post('licenses/:licenseId/activations')
  @Roles(GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN, GlobalUserRole.USER)
  @ApiOperation({ summary: 'Activer une license sur une machine' })
  @ApiResponse({ status: 201, description: 'Activation créée avec succès' })
  @ApiResponse({ status: 400, description: 'Limite de machines atteinte' })
  @ApiResponse({ status: 404, description: 'License non trouvée' })
  async createActivation(
    @Param('licenseId') licenseId: string,
    @Body() createDto: CreateActivationDto
  ) {
    return await this.licenseService.createActivation(licenseId, createDto)
  }

  /**
   * Récupérer toutes les activations d'une license
   */
  @Get('licenses/:licenseId/activations')
  @Roles(GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN)
  @ApiOperation({ summary: 'Récupérer toutes les activations d\'une license' })
  @ApiResponse({ status: 200, description: 'Liste des activations' })
  async getActivations(@Param('licenseId') licenseId: string) {
    // Get license with activations included
    const license = await this.licenseService.findById(licenseId)
    return (license as any)?.activations || []
  }

  /**
   * Récupérer les activations actives d'une license
   */
  @Get('licenses/:licenseId/activations/active')
  @Roles(GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN)
  @ApiOperation({ summary: 'Récupérer les activations actives d\'une license' })
  @ApiResponse({ status: 200, description: 'Liste des activations actives' })
  async getActiveActivations(@Param('licenseId') licenseId: string) {
    return await this.licenseService.getActiveActivations(licenseId)
  }

  /**
   * Vérifier la limite de machines
   */
  @Get('licenses/:licenseId/activations/check-limit')
  @Roles(GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN, GlobalUserRole.USER)
  @ApiOperation({ summary: 'Vérifier si la limite de machines est atteinte' })
  @ApiResponse({ status: 200, description: 'Statut de la limite' })
  async checkMachineLimit(@Param('licenseId') licenseId: string) {
    // Get active activations and compare with license limit
    const activeActivations = await this.licenseService.getActiveActivations(licenseId)
    const license = await this.licenseService.findById(licenseId)

    return {
      currentActivations: activeActivations.length,
      limitReached: false, // Would need maxActivations field in License model
      activeDevices: activeActivations,
    }
  }

  /**
   * Mettre à jour le heartbeat d'une activation
   */
  @Post('activations/:activationKey/heartbeat')
  @Roles(GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN, GlobalUserRole.USER)
  @ApiOperation({ summary: 'Mettre à jour le heartbeat d\'une activation' })
  @ApiResponse({ status: 200, description: 'Heartbeat mis à jour' })
  @ApiResponse({ status: 404, description: 'Activation non trouvée' })
  async updateHeartbeat(
    @Param('activationKey') activationKey: string,
    @Body() updateDto: UpdateHeartbeatDto
  ) {
    // Extract optional data from DTO
    const hardwareInfo = updateDto.hardwareInfo
    const softwareInfo = updateDto.softwareInfo
    const metadata = updateDto.metadata

    return await this.licenseService.updateHeartbeat(activationKey)
  }

  /**
   * Désactiver une activation
   */
  @Post('activations/:activationKey/deactivate')
  @Roles(GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN, GlobalUserRole.USER)
  @ApiOperation({ summary: 'Désactiver une machine' })
  @ApiResponse({ status: 200, description: 'Activation désactivée' })
  @ApiResponse({ status: 404, description: 'Activation non trouvée' })
  async deactivateActivation(
    @Param('activationKey') activationKey: string,
    @Body() deactivateDto: DeactivateActivationDto
  ) {
    return await this.licenseService.deactivateActivation(activationKey, deactivateDto.reason)
  }
}
