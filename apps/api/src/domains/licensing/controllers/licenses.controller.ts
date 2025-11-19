import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GlobalUserRole } from '../../auth/core/constants/roles.constants'
import { Roles } from '../../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../../auth/security/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/security/guards/roles.guard'
import { CreateLicenseDto } from '../dto/create-license.dto'
import { UpdateLicenseDto } from '../dto/update-license.dto'
import { LicensePrismaService } from '../prisma/license-prisma.service'

/**
 * Licenses Controller
 *
 * Gestion CRUD des licenses via Prisma
 * Routes: /api/licensing/licenses
 */
@ApiTags('Licensing - Licenses')
@ApiBearerAuth()
@Controller('api/licensing/licenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LicensesController {
  constructor(private readonly licenseService: LicensePrismaService) {}

  /**
   * Créer une nouvelle license
   */
  @Post()
  @Roles(GlobalUserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Créer une nouvelle license' })
  @ApiResponse({ status: 201, description: 'License créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async createLicense(@Body() createDto: CreateLicenseDto) {
    // Provide default startsAt if not specified
    const startsAt = createDto.startsAt || new Date()
    return await this.licenseService.createLicense({ ...createDto, startsAt })
  }

  /**
   * Récupérer toutes les licenses
   */
  @Get()
  @Roles(GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN)
  @ApiOperation({ summary: 'Récupérer les licenses' })
  @ApiQuery({ name: 'societeId', required: false, description: 'Filtrer par société' })
  @ApiResponse({ status: 200, description: 'Liste des licenses' })
  async findAll(@Query('societeId') societeId?: string) {
    if (societeId) {
      return await this.licenseService.findBySocieteId(societeId)
    }
    // For now, return empty array or require societeId
    // TODO: Add findAll() method to service if needed
    return []
  }

  /**
   * Récupérer une license par ID
   */
  @Get(':id')
  @Roles(GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN)
  @ApiOperation({ summary: 'Récupérer une license par ID' })
  @ApiResponse({ status: 200, description: 'License trouvée' })
  @ApiResponse({ status: 404, description: 'License non trouvée' })
  async findOne(@Param('id') id: string) {
    const license = await this.licenseService.findById(id)
    if (!license) {
      throw new NotFoundException(`License with ID ${id} not found`)
    }
    return license
  }

  /**
   * Récupérer une license par clé
   */
  @Get('key/:licenseKey')
  @Roles(GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN)
  @ApiOperation({ summary: 'Récupérer une license par clé' })
  @ApiResponse({ status: 200, description: 'License trouvée' })
  @ApiResponse({ status: 404, description: 'License non trouvée' })
  async findByKey(@Param('licenseKey') licenseKey: string) {
    return await this.licenseService.findByLicenseKey(licenseKey)
  }

  /**
   * Mettre à jour une license
   */
  @Patch(':id')
  @Roles(GlobalUserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mettre à jour une license' })
  @ApiResponse({ status: 200, description: 'License mise à jour' })
  @ApiResponse({ status: 404, description: 'License non trouvée' })
  async updateLicense(@Param('id') id: string, @Body() updateDto: UpdateLicenseDto) {
    return await this.licenseService.updateLicense(id, updateDto)
  }

  /**
   * Supprimer une license
   */
  @Delete(':id')
  @Roles(GlobalUserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Supprimer une license' })
  @ApiResponse({ status: 200, description: 'License supprimée' })
  @ApiResponse({ status: 404, description: 'License non trouvée' })
  async deleteLicense(@Param('id') id: string) {
    return await this.licenseService.deleteLicense(id)
  }

  /**
   * Vérifier l'expiration d'une license
   */
  @Get(':id/expiration')
  @Roles(GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN)
  @ApiOperation({ summary: "Vérifier l'expiration d'une license" })
  @ApiResponse({ status: 200, description: 'Statut d\'expiration' })
  async checkExpiration(@Param('id') id: string) {
    return await this.licenseService.checkExpiration(id)
  }

  /**
   * Vérifier les limites d'une license
   */
  @Get(':id/limits')
  @Roles(GlobalUserRole.SUPER_ADMIN, GlobalUserRole.ADMIN)
  @ApiOperation({ summary: 'Vérifier les limites d\'une license' })
  @ApiResponse({ status: 200, description: 'Statut des limites' })
  async checkLimits(@Param('id') id: string) {
    return await this.licenseService.checkLimits(id)
  }
}
