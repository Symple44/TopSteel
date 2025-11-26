import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { License, Prisma } from '@prisma/client'
import { Public } from '../../../core/multi-tenant'
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
import { LicenseManagementService } from '../services/license-management.service'

@ApiTags('License Management')
@ApiBearerAuth()
@Controller('api/admin/licenses')
@Public() // Bypass global TenantGuard - JwtAuthGuard handles JWT auth
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
  ): Promise<License> {
    // Convert DTO to Prisma input - mapping DTO fields to actual schema fields
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const prismaInput: Prisma.LicenseCreateInput = {
      licenseKey: createDto.licenseKey || 'LIC-' + timestamp + '-' + random,
      customerName: 'Customer',
      customerEmail: 'customer@example.com',
      type: createDto.type,
      startsAt: createDto.validFrom || new Date(),
      expiresAt: createDto.expiresAt,
      maxUsers: createDto.maxUsers,
      maxSites: createDto.maxSites || 1,
      maxStorage: createDto.maxStorageGB ? createDto.maxStorageGB * 1024 : -1,
      allowApiAccess: createDto.features?.apiAccess ?? false,
      allowCustomModules: createDto.features?.customIntegrations ?? false,
      restrictions: createDto.restrictions as Prisma.InputJsonValue || {},
      metadata: (createDto.billing ? { billing: createDto.billing } : {}) as Prisma.InputJsonValue,
      notes: createDto.notes,
      societe: {
        connect: { id: societeId }
      },
    }

    return await this.licenseService.createLicense(societeId, prismaInput)
  }

  @Patch(':licenseId')
  @Roles(GlobalUserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mettre à jour une licence' })
  @ApiResponse({ status: 200, type: LicenseResponseDto })
  async updateLicense(
    @Param('licenseId') licenseId: string,
    @Body() updateDto: UpdateLicenseDto
  ): Promise<License> {
    // Convert DTO to Prisma input - only include provided fields
    const prismaInput: Prisma.LicenseUpdateInput = {}

    if (updateDto.type !== undefined) prismaInput.type = updateDto.type
    if (updateDto.status !== undefined) prismaInput.status = updateDto.status
    if (updateDto.maxUsers !== undefined) prismaInput.maxUsers = updateDto.maxUsers
    if (updateDto.maxSites !== undefined) prismaInput.maxSites = updateDto.maxSites
    if (updateDto.maxStorageGB !== undefined) prismaInput.maxStorage = updateDto.maxStorageGB * 1024
    if (updateDto.validFrom !== undefined) prismaInput.startsAt = updateDto.validFrom
    if (updateDto.expiresAt !== undefined) prismaInput.expiresAt = updateDto.expiresAt
    if (updateDto.licenseKey !== undefined) prismaInput.licenseKey = updateDto.licenseKey
    if (updateDto.notes !== undefined) prismaInput.notes = updateDto.notes
    if (updateDto.restrictions !== undefined) prismaInput.restrictions = updateDto.restrictions as Prisma.InputJsonValue
    
    // Handle features - map to schema fields
    if (updateDto.features) {
      if (updateDto.features.apiAccess !== undefined) prismaInput.allowApiAccess = updateDto.features.apiAccess
      if (updateDto.features.customIntegrations !== undefined) prismaInput.allowCustomModules = updateDto.features.customIntegrations
    }

    // Handle billing in metadata
    if (updateDto.billing !== undefined) {
      prismaInput.metadata = { billing: updateDto.billing } as Prisma.InputJsonValue
    }

    return await this.licenseService.updateLicense(licenseId, prismaInput)
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
