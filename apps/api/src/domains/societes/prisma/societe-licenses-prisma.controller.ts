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
import { SocieteLicensePrismaService } from './societe-license-prisma.service'
import { CombinedSecurityGuard } from '../../auth/security/guards/combined-security.guard'
import { Prisma } from '@prisma/client'

// DTOs
interface CreateLicenseDto {
  societeId: string
  type: string
  status: string
  maxUsers: number
  features: Record<string, any>
  restrictions?: Record<string, any>
  billing?: Record<string, any>
  startDate: Date | string
  endDate?: Date | string
}

interface UpdateLicenseDto {
  type?: string
  status?: string
  maxUsers?: number
  features?: Record<string, any>
  restrictions?: Record<string, any>
  billing?: Record<string, any>
  startDate?: Date | string
  endDate?: Date | string
}

/**
 * SocieteLicensesPrismaController - Phase 8.1
 *
 * Contrôleur Prisma pour la gestion des licences sociétés (Infrastructure Multi-Tenant)
 * Route: /societe-licenses-prisma
 *
 * Endpoints:
 * - GET    /societe-licenses-prisma/stats          Statistiques licences
 * - GET    /societe-licenses-prisma/status/:status Licences par statut
 * - GET    /societe-licenses-prisma/expiring       Licences qui expirent
 * - GET    /societe-licenses-prisma/:id            Détails licence
 * - GET    /societe-licenses-prisma/societe/:id    Licence d'une société
 * - POST   /societe-licenses-prisma                Créer licence
 * - PUT    /societe-licenses-prisma/:id            Mettre à jour licence
 * - POST   /societe-licenses-prisma/:id/activate   Activer licence
 * - POST   /societe-licenses-prisma/:id/suspend    Suspendre licence
 * - POST   /societe-licenses-prisma/:id/expire     Expirer licence
 * - GET    /societe-licenses-prisma/:id/valid      Vérifier validité
 * - GET    /societe-licenses-prisma/societe/:id/user-limit Vérifier limite users
 * - DELETE /societe-licenses-prisma/:id            Supprimer licence
 */
@Controller('societe-licenses-prisma')
@ApiTags('📜 Licences Sociétés (Prisma - Multi-Tenant)')
@UseGuards(CombinedSecurityGuard)
@ApiBearerAuth('JWT-auth')
export class SocieteLicensesPrismaController {
  constructor(
    private readonly societeLicensePrismaService: SocieteLicensePrismaService
  ) {}

  /**
   * GET /societe-licenses-prisma/stats
   * Statistiques des licences par statut
   */
  @Get('stats')
  @ApiOperation({ summary: 'Statistiques des licences par statut (Prisma)' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  async getStats() {
    const stats = await this.societeLicensePrismaService.countByStatus()

    return {
      success: true,
      data: stats,
      meta: {
        total: Object.values(stats).reduce((sum, count) => sum + count, 0),
      },
    }
  }

  /**
   * GET /societe-licenses-prisma/status/:status
   * Récupérer les licences par statut
   */
  @Get('status/:status')
  @ApiOperation({ summary: 'Récupérer les licences par statut (Prisma)' })
  @ApiResponse({ status: 200, description: 'Licences récupérées avec succès' })
  async findByStatus(@Param('status') status: string) {
    const licenses =
      await this.societeLicensePrismaService.getLicensesByStatus(status)

    return {
      success: true,
      data: licenses,
      meta: {
        total: licenses.length,
        status,
      },
    }
  }

  /**
   * GET /societe-licenses-prisma/expiring
   * Récupérer les licences qui expirent bientôt
   */
  @Get('expiring')
  @ApiOperation({ summary: 'Récupérer les licences qui expirent bientôt (Prisma)' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Jours avant expiration (défaut: 30)' })
  @ApiResponse({ status: 200, description: 'Licences récupérées avec succès' })
  async findExpiring(@Query('days') days?: string) {
    const daysBeforeExpiry = days ? parseInt(days, 10) : 30

    const licenses =
      await this.societeLicensePrismaService.getExpiringLicenses(daysBeforeExpiry)

    return {
      success: true,
      data: licenses,
      meta: {
        total: licenses.length,
        daysBeforeExpiry,
      },
    }
  }

  /**
   * GET /societe-licenses-prisma/:id
   * Récupérer une licence par ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une licence par ID (Prisma)' })
  @ApiResponse({ status: 200, description: 'Licence récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Licence non trouvée' })
  async findOne(@Param('id') id: string) {
    const license = await this.societeLicensePrismaService.getLicenseById(id)

    if (!license) {
      return {
        success: false,
        message: 'Licence non trouvée',
        statusCode: 404,
      }
    }

    return {
      success: true,
      data: license,
    }
  }

  /**
   * GET /societe-licenses-prisma/societe/:societeId
   * Récupérer la licence d'une société
   */
  @Get('societe/:societeId')
  @ApiOperation({ summary: 'Récupérer la licence d\'une société (Prisma)' })
  @ApiResponse({ status: 200, description: 'Licence récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Licence non trouvée' })
  async findBySociete(@Param('societeId') societeId: string) {
    const license =
      await this.societeLicensePrismaService.getLicenseBySocieteId(societeId)

    if (!license) {
      return {
        success: false,
        message: 'Licence non trouvée pour cette société',
        statusCode: 404,
      }
    }

    return {
      success: true,
      data: license,
    }
  }

  /**
   * POST /societe-licenses-prisma
   * Créer une nouvelle licence
   */
  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle licence (Prisma)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        societeId: { type: 'string' },
        type: { type: 'string', example: 'enterprise' },
        status: { type: 'string', example: 'active' },
        maxUsers: { type: 'number', example: 100 },
        features: { type: 'object', example: { modules: ['admin', 'users'], storage: '100GB' } },
        restrictions: { type: 'object' },
        billing: { type: 'object' },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
      },
      required: ['societeId', 'type', 'status', 'maxUsers', 'features', 'startDate'],
    },
  })
  @ApiResponse({ status: 201, description: 'Licence créée avec succès' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createLicenseDto: CreateLicenseDto) {
    const data = {
      ...createLicenseDto,
      startDate: new Date(createLicenseDto.startDate),
      endDate: createLicenseDto.endDate ? new Date(createLicenseDto.endDate) : undefined,
    }

    const license = await this.societeLicensePrismaService.createLicense(data)

    return {
      success: true,
      data: license,
      message: 'Licence créée avec succès',
      statusCode: 201,
    }
  }

  /**
   * PUT /societe-licenses-prisma/:id
   * Mettre à jour une licence
   */
  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une licence (Prisma)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        status: { type: 'string' },
        maxUsers: { type: 'number' },
        features: { type: 'object' },
        restrictions: { type: 'object' },
        billing: { type: 'object' },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Licence mise à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Licence non trouvée' })
  async update(@Param('id') id: string, @Body() updateLicenseDto: UpdateLicenseDto) {
    const data: any = { ...updateLicenseDto }

    if (updateLicenseDto.startDate) {
      data.startDate = new Date(updateLicenseDto.startDate)
    }
    if (updateLicenseDto.endDate) {
      data.endDate = new Date(updateLicenseDto.endDate)
    }

    const license = await this.societeLicensePrismaService.updateLicense(id, data)

    return {
      success: true,
      data: license,
      message: 'Licence mise à jour avec succès',
    }
  }

  /**
   * POST /societe-licenses-prisma/:id/activate
   * Activer une licence
   */
  @Post(':id/activate')
  @ApiOperation({ summary: 'Activer une licence (Prisma)' })
  @ApiResponse({ status: 200, description: 'Licence activée avec succès' })
  @ApiResponse({ status: 404, description: 'Licence non trouvée' })
  async activate(@Param('id') id: string) {
    const license = await this.societeLicensePrismaService.activateLicense(id)

    return {
      success: true,
      data: license,
      message: 'Licence activée avec succès',
    }
  }

  /**
   * POST /societe-licenses-prisma/:id/suspend
   * Suspendre une licence
   */
  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspendre une licence (Prisma)' })
  @ApiResponse({ status: 200, description: 'Licence suspendue avec succès' })
  @ApiResponse({ status: 404, description: 'Licence non trouvée' })
  async suspend(@Param('id') id: string) {
    const license = await this.societeLicensePrismaService.suspendLicense(id)

    return {
      success: true,
      data: license,
      message: 'Licence suspendue avec succès',
    }
  }

  /**
   * POST /societe-licenses-prisma/:id/expire
   * Expirer une licence
   */
  @Post(':id/expire')
  @ApiOperation({ summary: 'Expirer une licence (Prisma)' })
  @ApiResponse({ status: 200, description: 'Licence expirée avec succès' })
  @ApiResponse({ status: 404, description: 'Licence non trouvée' })
  async expire(@Param('id') id: string) {
    const license = await this.societeLicensePrismaService.expireLicense(id)

    return {
      success: true,
      data: license,
      message: 'Licence expirée avec succès',
    }
  }

  /**
   * GET /societe-licenses-prisma/:id/valid
   * Vérifier si une licence est valide
   */
  @Get(':id/valid')
  @ApiOperation({ summary: 'Vérifier si une licence est valide (Prisma)' })
  @ApiResponse({ status: 200, description: 'Validité vérifiée avec succès' })
  async checkValidity(@Param('id') societeId: string) {
    const isValid = await this.societeLicensePrismaService.isLicenseValid(societeId)

    return {
      success: true,
      data: {
        societeId,
        isValid,
      },
    }
  }

  /**
   * GET /societe-licenses-prisma/societe/:societeId/user-limit
   * Vérifier si la limite d'utilisateurs est atteinte
   */
  @Get('societe/:societeId/user-limit')
  @ApiOperation({ summary: 'Vérifier si la limite d\'utilisateurs est atteinte (Prisma)' })
  @ApiResponse({ status: 200, description: 'Limite vérifiée avec succès' })
  async checkUserLimit(@Param('societeId') societeId: string) {
    const isLimitReached =
      await this.societeLicensePrismaService.isUserLimitReached(societeId)

    return {
      success: true,
      data: {
        societeId,
        isLimitReached,
        canAddUsers: !isLimitReached,
      },
    }
  }

  /**
   * DELETE /societe-licenses-prisma/:id
   * Supprimer une licence
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une licence (Prisma)' })
  @ApiResponse({ status: 200, description: 'Licence supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Licence non trouvée' })
  async remove(@Param('id') id: string) {
    await this.societeLicensePrismaService.deleteLicense(id)

    return {
      success: true,
      message: 'Licence supprimée avec succès',
    }
  }
}
