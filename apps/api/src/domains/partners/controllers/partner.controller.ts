import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../../core/common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../auth/security/guards/jwt-auth.guard'
import type { User } from '../../users/entities/user.entity'
import type { BusinessContext } from '../../core/interfaces/business-service.interface'
import { CreatePartnerDto } from '../dto/create-partner.dto'
import { PartnerFiltersDto } from '../dto/partner-filters.dto'
import { UpdatePartnerDto } from '../dto/update-partner.dto'
import type { Partner } from '../entities/partner.entity'
import { PartnerService, type PartnerStatistics } from '../services/partner.service'

/**
 * Contrôleur REST pour la gestion des partenaires (clients/fournisseurs)
 */
@ApiTags('🤝 Partenaires')
@Controller('business/partners')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PartnerController {
  constructor(
    private readonly partnerService: PartnerService
  ) {}

  /**
   * Créer un nouveau partenaire
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un partenaire',
    description: 'Créer un nouveau client ou fournisseur avec validation métier'
  })
  @ApiResponse({
    status: 201,
    description: 'Partenaire créé avec succès'
  })
  async createPartner(
    @Body() createDto: CreatePartnerDto,
    @CurrentUser() user: User
  ): Promise<Partner> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'current-tenant',
      userRoles: [user.role],
      permissions: []
    }

    return await this.partnerService.create(createDto, context)
  }

  /**
   * Récupérer tous les partenaires avec filtres
   */
  @Get()
  @ApiOperation({
    summary: 'Lister les partenaires',
    description: 'Récupérer les partenaires avec filtres et pagination'
  })
  async getPartners(
    @Query() filters: PartnerFiltersDto,
    @CurrentUser() user: User
  ): Promise<Partner[]> {
    return await this.partnerService.searchPartners(filters)
  }

  /**
   * Récupérer un partenaire par ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer un partenaire',
    description: 'Récupérer les détails d\'un partenaire'
  })
  async getPartner(
    @Param('id') id: string,
    @CurrentUser() user: User
  ): Promise<Partner | null> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'current-tenant',
      userRoles: [user.role],
      permissions: []
    }

    return await this.partnerService.findById(id, context)
  }

  /**
   * Mettre à jour un partenaire
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour un partenaire',
    description: 'Modifier un partenaire existant'
  })
  async updatePartner(
    @Param('id') id: string,
    @Body() updateDto: UpdatePartnerDto,
    @CurrentUser() user: User
  ): Promise<Partner> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'current-tenant',
      userRoles: [user.role],
      permissions: []
    }

    return await this.partnerService.update(id, updateDto, context)
  }

  /**
   * Supprimer un partenaire
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un partenaire',
    description: 'Supprimer un partenaire (soft delete)'
  })
  async deletePartner(
    @Param('id') id: string,
    @CurrentUser() user: User
  ): Promise<void> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'current-tenant',
      userRoles: [user.role],
      permissions: []
    }

    await this.partnerService.delete(id, context)
  }

  /**
   * Obtenir tous les clients actifs
   */
  @Get('clients/actifs')
  @ApiOperation({
    summary: 'Lister les clients actifs',
    description: 'Récupérer tous les clients avec le statut ACTIF'
  })
  async getClientsActifs(): Promise<Partner[]> {
    return await this.partnerService.getClientsActifs()
  }

  /**
   * Obtenir tous les fournisseurs actifs
   */
  @Get('fournisseurs/actifs')
  @ApiOperation({
    summary: 'Lister les fournisseurs actifs',
    description: 'Récupérer tous les fournisseurs avec le statut ACTIF'
  })
  async getFournisseursActifs(): Promise<Partner[]> {
    return await this.partnerService.getFournisseursActifs()
  }

  /**
   * Actions métier spécifiques
   */

  /**
   * Convertir un prospect en client
   */
  @Post(':id/convertir-prospect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Convertir un prospect en client',
    description: 'Changer le statut d\'un prospect en client actif'
  })
  async convertirProspect(
    @Param('id') id: string,
    @CurrentUser() user: User
  ): Promise<Partner> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'current-tenant',
      userRoles: [user.role],
      permissions: []
    }

    return await this.partnerService.convertirProspect(id, context)
  }

  /**
   * Suspendre un partenaire
   */
  @Post(':id/suspendre')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suspendre un partenaire',
    description: 'Suspendre temporairement un partenaire'
  })
  async suspendrePartenaire(
    @Param('id') id: string,
    @Body() body: { raison: string },
    @CurrentUser() user: User
  ): Promise<Partner> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'current-tenant',
      userRoles: [user.role],
      permissions: []
    }

    return await this.partnerService.suspendrePartenaire(id, body.raison, context)
  }

  /**
   * Fusionner deux partenaires
   */
  @Post(':principalId/fusionner/:secondaireId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fusionner deux partenaires',
    description: 'Fusionner les données de deux partenaires en cas de doublon'
  })
  async fusionnerPartenaires(
    @Param('principalId') principalId: string,
    @Param('secondaireId') secondaireId: string,
    @CurrentUser() user: User
  ): Promise<Partner> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'current-tenant',
      userRoles: [user.role],
      permissions: []
    }

    return await this.partnerService.fusionnerPartenaires(principalId, secondaireId, context)
  }

  /**
   * Recherche avancée
   */
  @Post('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recherche avancée de partenaires',
    description: 'Recherche avec critères multiples et filtres avancés'
  })
  async searchAdvanced(
    @Body() searchCriteria: any,
    @CurrentUser() user: User
  ): Promise<Partner[]> {
    return await this.partnerService.searchPartners(searchCriteria)
  }

  /**
   * Statistiques des partenaires
   */
  @Get('stats/overview')
  @ApiOperation({
    summary: 'Statistiques des partenaires',
    description: 'Récupérer les statistiques globales des partenaires'
  })
  async getStatistiques(): Promise<PartnerStatistics> {
    return await this.partnerService.getStatistiques()
  }

  /**
   * Export des partenaires
   */
  @Post('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exporter les partenaires',
    description: 'Exporter la liste des partenaires selon des critères'
  })
  async exportPartners(
    @Body() exportCriteria: { format: 'CSV' | 'EXCEL' | 'PDF', filters?: any },
    @CurrentUser() user: User
  ): Promise<{ url: string, filename: string }> {
    // Implémentation de l'export selon le format demandé
    // Pour l'exemple, on retourne une URL fictive
    return {
      url: '/exports/partners/export-2024-01-15.csv',
      filename: `partners-export-${new Date().toISOString().split('T')[0]}.${exportCriteria.format.toLowerCase()}`
    }
  }

  /**
   * Import de partenaires
   */
  @Post('import')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Importer des partenaires',
    description: 'Importer une liste de partenaires depuis un fichier'
  })
  async importPartners(
    @Body() importData: { data: any[], options?: { skipErrors?: boolean, dryRun?: boolean } },
    @CurrentUser() user: User
  ): Promise<{ 
    imported: number,
    errors: number,
    warnings: string[],
    details: any[]
  }> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'current-tenant',
      userRoles: [user.role],
      permissions: []
    }

    // Implémentation de l'import
    const results = {
      imported: 0,
      errors: 0,
      warnings: [] as string[],
      details: [] as Array<{ status: string, data: any, error?: string }>
    }

    for (const partnerData of importData.data) {
      try {
        if (!importData.options?.dryRun) {
          await this.partnerService.create(partnerData, context)
        }
        results.imported++
        results.details.push({ status: 'success', data: partnerData })
      } catch (error) {
        results.errors++
        results.details.push({ 
          status: 'error', 
          data: partnerData, 
          error: (error as Error).message 
        })
        if (!importData.options?.skipErrors) {
          break
        }
      }
    }

    return results
  }

  /**
   * Validation en lot
   */
  @Post('validate-batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validation en lot',
    description: 'Valider plusieurs partenaires selon les règles métier'
  })
  async validateBatch(
    @Body() partnerIds: string[],
    @CurrentUser() user: User
  ): Promise<Array<{ id: string, valid: boolean, errors: string[] }>> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'current-tenant',
      userRoles: [user.role],
      permissions: []
    }

    const results: Array<{ id: string, valid: boolean, errors: string[] }> = []
    
    for (const partnerId of partnerIds) {
      try {
        const partner = await this.partnerService.findById(partnerId, context)
        if (partner) {
          const validation = await this.partnerService.validateBusinessRules(partner, 'VALIDATE' as any)
          results.push({
            id: partnerId,
            valid: validation.isValid,
            errors: validation.errors.map(e => e.message)
          })
        } else {
          results.push({
            id: partnerId,
            valid: false,
            errors: ['Partenaire introuvable']
          })
        }
      } catch (error) {
        results.push({
          id: partnerId,
          valid: false,
          errors: [(error as Error).message]
        })
      }
    }

    return results
  }
}