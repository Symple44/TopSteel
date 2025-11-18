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
import { SocietePrismaService } from './societe-prisma.service'
import { CombinedSecurityGuard } from '../../auth/security/guards/combined-security.guard'

// DTOs
interface CreateSocieteDto {
  code: string
  name: string
  databaseName: string
  legalName?: string
  siret?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  isActive?: boolean
}

interface UpdateSocieteDto {
  code?: string
  name?: string
  databaseName?: string
  legalName?: string
  siret?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  isActive?: boolean
}

interface SearchSocieteDto {
  name?: string
  code?: string
  city?: string
  country?: string
  isActive?: boolean
}

interface SocieteQueryDto {
  includeInactive?: boolean
}

/**
 * SocietesPrismaController - Phase 8.1
 *
 * Contrôleur Prisma pour la gestion des sociétés (Infrastructure Multi-Tenant)
 * Route: /societes-prisma
 *
 * Endpoints:
 * - GET    /societes-prisma                Liste sociétés
 * - GET    /societes-prisma/search         Recherche sociétés
 * - GET    /societes-prisma/count          Compter sociétés
 * - GET    /societes-prisma/code/:code     Récupérer par code
 * - GET    /societes-prisma/:id            Détails société
 * - GET    /societes-prisma/:id/relations  Société avec relations
 * - POST   /societes-prisma                Créer société
 * - PUT    /societes-prisma/:id            Mettre à jour société
 * - DELETE /societes-prisma/:id            Supprimer (soft delete)
 * - DELETE /societes-prisma/:id/hard       Supprimer (hard delete)
 * - POST   /societes-prisma/:id/deactivate Désactiver société
 */
@Controller('societes-prisma')
@ApiTags('🏢 Sociétés (Prisma - Multi-Tenant)')
@UseGuards(CombinedSecurityGuard)
@ApiBearerAuth('JWT-auth')
export class SocietesPrismaController {
  constructor(private readonly societePrismaService: SocietePrismaService) {}

  /**
   * GET /societes-prisma
   * Liste des sociétés
   */
  @Get()
  @ApiOperation({ summary: 'Liste des sociétés (Prisma - Multi-Tenant)' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Liste des sociétés récupérée avec succès' })
  async findAll(@Query() query: SocieteQueryDto) {
    const societes = await this.societePrismaService.getAllSocietes(
      query.includeInactive || false
    )

    return {
      success: true,
      data: societes,
      meta: {
        total: societes.length,
        includeInactive: query.includeInactive || false,
      },
    }
  }

  /**
   * GET /societes-prisma/search
   * Recherche de sociétés par critères
   */
  @Get('search')
  @ApiOperation({ summary: 'Recherche de sociétés par critères (Prisma)' })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'code', required: false, type: String })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiQuery({ name: 'country', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Sociétés trouvées avec succès' })
  async search(@Query() searchDto: SearchSocieteDto) {
    const societes = await this.societePrismaService.searchSocietes(searchDto)

    return {
      success: true,
      data: societes,
      meta: {
        total: societes.length,
        filters: searchDto,
      },
    }
  }

  /**
   * GET /societes-prisma/count
   * Compter les sociétés
   */
  @Get('count')
  @ApiOperation({ summary: 'Compter les sociétés (Prisma)' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Nombre de sociétés récupéré avec succès' })
  async count(@Query('includeInactive') includeInactive?: boolean) {
    const count = await this.societePrismaService.countSocietes(includeInactive || false)

    return {
      success: true,
      data: {
        count,
        includeInactive: includeInactive || false,
      },
    }
  }

  /**
   * GET /societes-prisma/code/:code
   * Récupérer une société par code
   */
  @Get('code/:code')
  @ApiOperation({ summary: 'Récupérer une société par code (Prisma)' })
  @ApiResponse({ status: 200, description: 'Société récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Société non trouvée' })
  async findByCode(@Param('code') code: string) {
    const societe = await this.societePrismaService.getSocieteByCode(code)

    if (!societe) {
      return {
        success: false,
        message: 'Société non trouvée',
        statusCode: 404,
      }
    }

    return {
      success: true,
      data: societe,
    }
  }

  /**
   * GET /societes-prisma/:id
   * Récupérer une société par ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une société par ID (Prisma)' })
  @ApiResponse({ status: 200, description: 'Société récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Société non trouvée' })
  async findOne(@Param('id') id: string) {
    const societe = await this.societePrismaService.getSocieteById(id)

    if (!societe) {
      return {
        success: false,
        message: 'Société non trouvée',
        statusCode: 404,
      }
    }

    return {
      success: true,
      data: societe,
    }
  }

  /**
   * GET /societes-prisma/:id/relations
   * Récupérer une société avec toutes ses relations
   */
  @Get(':id/relations')
  @ApiOperation({ summary: 'Récupérer une société avec relations (Prisma)' })
  @ApiResponse({
    status: 200,
    description: 'Société avec relations récupérée avec succès',
  })
  @ApiResponse({ status: 404, description: 'Société non trouvée' })
  async findOneWithRelations(@Param('id') id: string) {
    const societe = await this.societePrismaService.getSocieteWithRelations(id)

    if (!societe) {
      return {
        success: false,
        message: 'Société non trouvée',
        statusCode: 404,
      }
    }

    return {
      success: true,
      data: societe,
      meta: {
        hasLicense: !!societe.license,
        usersCount: societe.users?.length || 0,
        sitesCount: societe.sites?.length || 0,
        rolesCount: societe.userSocieteRoles?.length || 0,
      },
    }
  }

  /**
   * POST /societes-prisma
   * Créer une nouvelle société
   */
  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle société (Prisma - Multi-Tenant)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        name: { type: 'string' },
        databaseName: { type: 'string' },
        legalName: { type: 'string' },
        siret: { type: 'string' },
        address: { type: 'string' },
        city: { type: 'string' },
        postalCode: { type: 'string' },
        country: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string', format: 'email' },
        website: { type: 'string' },
        isActive: { type: 'boolean', default: true },
      },
      required: ['code', 'name', 'databaseName'],
    },
  })
  @ApiResponse({ status: 201, description: 'Société créée avec succès' })
  @ApiResponse({ status: 409, description: 'Code société déjà existant' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createSocieteDto: CreateSocieteDto) {
    // Vérifier si le code existe déjà
    const exists = await this.societePrismaService.societeExists(createSocieteDto.code)
    if (exists) {
      return {
        success: false,
        message: 'Une société avec ce code existe déjà',
        statusCode: 409,
      }
    }

    const societe = await this.societePrismaService.createSociete(createSocieteDto)

    return {
      success: true,
      data: societe,
      message: 'Société créée avec succès',
      statusCode: 201,
    }
  }

  /**
   * PUT /societes-prisma/:id
   * Mettre à jour une société
   */
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une société (Prisma)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        name: { type: 'string' },
        databaseName: { type: 'string' },
        legalName: { type: 'string' },
        siret: { type: 'string' },
        address: { type: 'string' },
        city: { type: 'string' },
        postalCode: { type: 'string' },
        country: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string', format: 'email' },
        website: { type: 'string' },
        isActive: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Société mise à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Société non trouvée' })
  async update(@Param('id') id: string, @Body() updateSocieteDto: UpdateSocieteDto) {
    const societe = await this.societePrismaService.updateSociete(id, updateSocieteDto)

    return {
      success: true,
      data: societe,
      message: 'Société mise à jour avec succès',
    }
  }

  /**
   * POST /societes-prisma/:id/deactivate
   * Désactiver une société
   */
  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Désactiver une société (Prisma)' })
  @ApiResponse({ status: 200, description: 'Société désactivée avec succès' })
  @ApiResponse({ status: 404, description: 'Société non trouvée' })
  async deactivate(@Param('id') id: string) {
    const societe = await this.societePrismaService.deactivateSociete(id)

    return {
      success: true,
      data: societe,
      message: 'Société désactivée avec succès',
    }
  }

  /**
   * DELETE /societes-prisma/:id
   * Supprimer une société (soft delete)
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une société - soft delete (Prisma)' })
  @ApiResponse({ status: 200, description: 'Société supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Société non trouvée' })
  async remove(@Param('id') id: string) {
    const societe = await this.societePrismaService.deleteSociete(id)

    return {
      success: true,
      data: societe,
      message: 'Société supprimée avec succès (soft delete)',
    }
  }

  /**
   * DELETE /societes-prisma/:id/hard
   * Supprimer définitivement une société (hard delete)
   */
  @Delete(':id/hard')
  @ApiOperation({
    summary: 'Supprimer définitivement une société - hard delete (Prisma)',
  })
  @ApiResponse({ status: 200, description: 'Société supprimée définitivement avec succès' })
  @ApiResponse({ status: 404, description: 'Société non trouvée' })
  async hardRemove(@Param('id') id: string) {
    await this.societePrismaService.hardDeleteSociete(id)

    return {
      success: true,
      message: 'Société supprimée définitivement avec succès (hard delete)',
    }
  }
}
