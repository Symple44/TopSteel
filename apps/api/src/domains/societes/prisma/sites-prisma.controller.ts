import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger'
import { SitePrismaService } from './site-prisma.service'
import { CombinedSecurityGuard } from '../../auth/security/guards/combined-security.guard'

// DTOs
interface CreateSiteDto {
  societeId: string
  name: string
  code: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  phone?: string
  email?: string
  configuration?: Record<string, any>
  metadata?: Record<string, any>
  isActive?: boolean
}

interface UpdateSiteDto {
  name?: string
  code?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  phone?: string
  email?: string
  configuration?: Record<string, any>
  metadata?: Record<string, any>
  isActive?: boolean
}

interface SearchSiteDto {
  name?: string
  code?: string
  city?: string
  country?: string
  isActive?: boolean
}

/**
 * SitesPrismaController - Phase 8.1
 *
 * Contrôleur Prisma pour la gestion des sites/usines (Infrastructure Multi-Tenant)
 * Route: /sites-prisma
 *
 * Sites = Lieux physiques d'une société (usines, bureaux, entrepôts, etc.)
 *
 * Endpoints:
 * - GET    /sites-prisma/societe/:societeId         Sites d'une société
 * - GET    /sites-prisma/societe/:societeId/search  Recherche sites
 * - GET    /sites-prisma/societe/:societeId/count   Compter sites
 * - GET    /sites-prisma/societe/:societeId/code/:code Récupérer par code
 * - GET    /sites-prisma/:id                         Détails site
 * - GET    /sites-prisma/:id/with-societe            Site avec société
 * - POST   /sites-prisma                             Créer site
 * - PUT    /sites-prisma/:id                         Mettre à jour site
 * - PUT    /sites-prisma/:id/configuration           Mettre à jour configuration
 * - PUT    /sites-prisma/:id/metadata                Mettre à jour metadata
 * - POST   /sites-prisma/:id/deactivate              Désactiver site
 * - DELETE /sites-prisma/:id                         Supprimer site
 */
@Controller('sites-prisma')
@ApiTags('🏭 Sites/Usines (Prisma - Multi-Tenant)')
@UseGuards(CombinedSecurityGuard)
@ApiBearerAuth('JWT-auth')
export class SitesPrismaController {
  constructor(private readonly sitePrismaService: SitePrismaService) {}

  /**
   * GET /sites-prisma/societe/:societeId
   * Récupérer les sites d'une société
   */
  @Get('societe/:societeId')
  @ApiOperation({ summary: 'Récupérer les sites d\'une société (Prisma)' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Sites récupérés avec succès' })
  async getSocieteSites(
    @Param('societeId') societeId: string,
    @Query('includeInactive') includeInactive?: boolean
  ) {
    const sites = await this.sitePrismaService.getSocieteSites(
      societeId,
      includeInactive || false
    )

    return {
      success: true,
      data: sites,
      meta: {
        total: sites.length,
        societeId,
        includeInactive: includeInactive || false,
      },
    }
  }

  /**
   * GET /sites-prisma/societe/:societeId/search
   * Recherche de sites par critères
   */
  @Get('societe/:societeId/search')
  @ApiOperation({ summary: 'Recherche de sites par critères (Prisma)' })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'code', required: false, type: String })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiQuery({ name: 'country', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Sites trouvés avec succès' })
  async searchSites(
    @Param('societeId') societeId: string,
    @Query() searchDto: SearchSiteDto
  ) {
    const sites = await this.sitePrismaService.searchSites({
      ...searchDto,
      societeId,
    })

    return {
      success: true,
      data: sites,
      meta: {
        total: sites.length,
        societeId,
        filters: searchDto,
      },
    }
  }

  /**
   * GET /sites-prisma/societe/:societeId/count
   * Compter les sites d'une société
   */
  @Get('societe/:societeId/count')
  @ApiOperation({ summary: 'Compter les sites d\'une société (Prisma)' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Nombre de sites récupéré avec succès' })
  async countSites(
    @Param('societeId') societeId: string,
    @Query('includeInactive') includeInactive?: boolean
  ) {
    const count = await this.sitePrismaService.countSocieteSites(
      societeId,
      includeInactive || false
    )

    return {
      success: true,
      data: {
        societeId,
        sitesCount: count,
        includeInactive: includeInactive || false,
      },
    }
  }

  /**
   * GET /sites-prisma/societe/:societeId/code/:code
   * Récupérer un site par code
   */
  @Get('societe/:societeId/code/:code')
  @ApiOperation({ summary: 'Récupérer un site par code (Prisma)' })
  @ApiResponse({ status: 200, description: 'Site récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Site non trouvé' })
  async findByCode(
    @Param('societeId') societeId: string,
    @Param('code') code: string
  ) {
    const site = await this.sitePrismaService.getSiteByCode(societeId, code)

    if (!site) {
      return {
        success: false,
        message: 'Site non trouvé',
        statusCode: 404,
      }
    }

    return {
      success: true,
      data: site,
    }
  }

  /**
   * GET /sites-prisma/:id
   * Récupérer un site par ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un site par ID (Prisma)' })
  @ApiResponse({ status: 200, description: 'Site récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Site non trouvé' })
  async findOne(@Param('id') id: string) {
    const site = await this.sitePrismaService.getSiteById(id)

    if (!site) {
      return {
        success: false,
        message: 'Site non trouvé',
        statusCode: 404,
      }
    }

    return {
      success: true,
      data: site,
    }
  }

  /**
   * GET /sites-prisma/:id/with-societe
   * Récupérer un site avec sa société
   */
  @Get(':id/with-societe')
  @ApiOperation({ summary: 'Récupérer un site avec sa société (Prisma)' })
  @ApiResponse({ status: 200, description: 'Site avec société récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Site non trouvé' })
  async findOneWithSociete(@Param('id') id: string) {
    const site = await this.sitePrismaService.getSiteWithSociete(id)

    if (!site) {
      return {
        success: false,
        message: 'Site non trouvé',
        statusCode: 404,
      }
    }

    return {
      success: true,
      data: site,
    }
  }

  /**
   * POST /sites-prisma
   * Créer un nouveau site
   */
  @Post()
  @ApiOperation({ summary: 'Créer un nouveau site/usine (Prisma)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        societeId: { type: 'string' },
        name: { type: 'string' },
        code: { type: 'string' },
        address: { type: 'string' },
        city: { type: 'string' },
        postalCode: { type: 'string' },
        country: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string', format: 'email' },
        configuration: { type: 'object' },
        metadata: { type: 'object' },
        isActive: { type: 'boolean', default: true },
      },
      required: ['societeId', 'name', 'code'],
    },
  })
  @ApiResponse({ status: 201, description: 'Site créé avec succès' })
  @ApiResponse({ status: 409, description: 'Code site déjà existant pour cette société' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createSiteDto: CreateSiteDto) {
    // Vérifier si le code existe déjà
    const exists = await this.sitePrismaService.siteExists(
      createSiteDto.societeId,
      createSiteDto.code
    )
    if (exists) {
      return {
        success: false,
        message: 'Un site avec ce code existe déjà pour cette société',
        statusCode: 409,
      }
    }

    const site = await this.sitePrismaService.createSite(createSiteDto)

    return {
      success: true,
      data: site,
      message: 'Site créé avec succès',
      statusCode: 201,
    }
  }

  /**
   * PUT /sites-prisma/:id
   * Mettre à jour un site
   */
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un site (Prisma)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        code: { type: 'string' },
        address: { type: 'string' },
        city: { type: 'string' },
        postalCode: { type: 'string' },
        country: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string', format: 'email' },
        configuration: { type: 'object' },
        metadata: { type: 'object' },
        isActive: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Site mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Site non trouvé' })
  async update(@Param('id') id: string, @Body() updateSiteDto: UpdateSiteDto) {
    const site = await this.sitePrismaService.updateSite(id, updateSiteDto)

    return {
      success: true,
      data: site,
      message: 'Site mis à jour avec succès',
    }
  }

  /**
   * PUT /sites-prisma/:id/configuration
   * Mettre à jour la configuration d'un site
   */
  @Put(':id/configuration')
  @ApiOperation({ summary: 'Mettre à jour la configuration d\'un site (Prisma)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        configuration: { type: 'object' },
      },
      required: ['configuration'],
    },
  })
  @ApiResponse({ status: 200, description: 'Configuration mise à jour avec succès' })
  async updateConfiguration(@Param('id') id: string, @Body('configuration') configuration: Record<string, any>) {
    const site = await this.sitePrismaService.updateConfiguration(id, configuration)

    return {
      success: true,
      data: site,
      message: 'Configuration mise à jour avec succès',
    }
  }

  /**
   * PUT /sites-prisma/:id/metadata
   * Mettre à jour les métadonnées d'un site
   */
  @Put(':id/metadata')
  @ApiOperation({ summary: 'Mettre à jour les métadonnées d\'un site (Prisma)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        metadata: { type: 'object' },
      },
      required: ['metadata'],
    },
  })
  @ApiResponse({ status: 200, description: 'Métadonnées mises à jour avec succès' })
  async updateMetadata(@Param('id') id: string, @Body('metadata') metadata: Record<string, any>) {
    const site = await this.sitePrismaService.updateMetadata(id, metadata)

    return {
      success: true,
      data: site,
      message: 'Métadonnées mises à jour avec succès',
    }
  }

  /**
   * POST /sites-prisma/:id/deactivate
   * Désactiver un site
   */
  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Désactiver un site (Prisma)' })
  @ApiResponse({ status: 200, description: 'Site désactivé avec succès' })
  @ApiResponse({ status: 404, description: 'Site non trouvé' })
  async deactivate(@Param('id') id: string) {
    const site = await this.sitePrismaService.deactivateSite(id)

    return {
      success: true,
      data: site,
      message: 'Site désactivé avec succès',
    }
  }

  /**
   * DELETE /sites-prisma/:id
   * Supprimer un site
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un site (Prisma)' })
  @ApiResponse({ status: 200, description: 'Site supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Site non trouvé' })
  async remove(@Param('id') id: string) {
    await this.sitePrismaService.deleteSite(id)

    return {
      success: true,
      message: 'Site supprimé avec succès',
    }
  }
}
