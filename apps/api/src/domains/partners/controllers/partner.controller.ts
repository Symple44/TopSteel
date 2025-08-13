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
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../../core/common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../auth/security/guards/jwt-auth.guard'
import type { BusinessContext } from '../../core/interfaces/business-service.interface'
import type { User } from '../../users/entities/user.entity'
import type {
  CreateContactDto,
  CreatePartnerAddressDto,
  CreatePartnerGroupDto,
  CreatePartnerSiteDto,
  UpdateContactDto,
  UpdatePartnerAddressDto,
  UpdatePartnerGroupDto,
  UpdatePartnerSiteDto,
} from '../dto'
import type { CreatePartnerDto } from '../dto/create-partner.dto'
import type { PartnerFiltersDto } from '../dto/partner-filters.dto'
import type { UpdatePartnerDto } from '../dto/update-partner.dto'
import type { Contact } from '../entities/contact.entity'
import type { Partner } from '../entities/partner.entity'
import type { PartnerAddress } from '../entities/partner-address.entity'
import type { PartnerGroup } from '../entities/partner-group.entity'
import type { PartnerSite } from '../entities/partner-site.entity'
import type { PartnerService, PartnerStatistics } from '../services/partner.service'
import type { PartnerParametersInitService } from '../services/partner-parameters-init.service'

/**
 * Contrôleur REST pour la gestion des partenaires (clients/fournisseurs)
 */
@ApiTags('🤝 Partenaires')
@Controller('business/partners')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PartnerController {
  constructor(
    private readonly partnerService: PartnerService,
    private readonly partnerParametersService: PartnerParametersInitService
  ) {}

  private getContext(user: any): BusinessContext {
    return {
      userId: user.id,
      tenantId: 'current-tenant',
      societeId: user.societeId || user.currentSocieteId || 'default',
      userRoles: [user.role],
      permissions: [],
    }
  }

  /**
   * Créer un nouveau partenaire
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un partenaire',
    description: 'Créer un nouveau client ou fournisseur avec validation métier',
  })
  @ApiResponse({
    status: 201,
    description: 'Partenaire créé avec succès',
  })
  async createPartner(
    @Body() createDto: CreatePartnerDto,
    @CurrentUser() user: User
  ): Promise<Partner> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'current-tenant',
      userRoles: [user.role],
      permissions: [],
    }

    return await this.partnerService.create(createDto, context)
  }

  /**
   * Récupérer tous les partenaires avec filtres
   */
  @Get()
  @ApiOperation({
    summary: 'Lister les partenaires',
    description: 'Récupérer les partenaires avec filtres et pagination',
  })
  async getPartners(
    @Query() filters: PartnerFiltersDto,
    @CurrentUser() _user: User
  ): Promise<Partner[]> {
    return await this.partnerService.searchPartners(filters)
  }

  /**
   * Récupérer les paramètres disponibles pour les partenaires
   */
  @Get('parameters')
  @ApiOperation({
    summary: 'Obtenir les paramètres',
    description: 'Récupérer toutes les valeurs possibles pour les champs de type enum',
  })
  @ApiResponse({
    status: 200,
    description: 'Paramètres récupérés avec succès',
    schema: {
      example: {
        partner_types: ['CLIENT', 'FOURNISSEUR', 'MIXTE'],
        partner_status: ['ACTIF', 'INACTIF', 'PROSPECT', 'SUSPENDU', 'ARCHIVE'],
        partner_categories: ['METALLURGIE', 'BTP', 'INDUSTRIE', 'NEGOCE'],
        contact_roles: ['COMMERCIAL', 'TECHNIQUE', 'COMPTABILITE'],
        site_types: ['SIEGE_SOCIAL', 'USINE', 'DEPOT', 'CHANTIER'],
        payment_terms: ['COMPTANT', '30_JOURS', '60_JOURS'],
        payment_modes: ['VIREMENT', 'CHEQUE', 'CB'],
        civilites: ['M.', 'Mme', 'Mlle'],
      },
    },
  })
  async getPartnerParameters(): Promise<Record<string, string[]>> {
    return await this.partnerParametersService.getAllPartnerParameters()
  }

  /**
   * Récupérer un partenaire par ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer un partenaire',
    description: "Récupérer les détails d'un partenaire",
  })
  async getPartner(@Param('id') id: string, @CurrentUser() user: User): Promise<Partner | null> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'current-tenant',
      userRoles: [user.role],
      permissions: [],
    }

    return await this.partnerService.findById(id, context)
  }

  /**
   * Mettre à jour un partenaire
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour un partenaire',
    description: 'Modifier un partenaire existant',
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
      permissions: [],
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
    description: 'Supprimer un partenaire (soft delete)',
  })
  async deletePartner(@Param('id') id: string, @CurrentUser() user: User): Promise<void> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'current-tenant',
      userRoles: [user.role],
      permissions: [],
    }

    await this.partnerService.delete(id, context)
  }

  /**
   * Obtenir tous les clients actifs
   */
  @Get('clients/actifs')
  @ApiOperation({
    summary: 'Lister les clients actifs',
    description: 'Récupérer tous les clients avec le statut ACTIF',
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
    description: 'Récupérer tous les fournisseurs avec le statut ACTIF',
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
    description: "Changer le statut d'un prospect en client actif",
  })
  async convertirProspect(@Param('id') id: string, @CurrentUser() user: User): Promise<Partner> {
    return await this.partnerService.convertirProspect(id, this.getContext(user))
  }

  /**
   * Suspendre un partenaire
   */
  @Post(':id/suspendre')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suspendre un partenaire',
    description: 'Suspendre temporairement un partenaire',
  })
  async suspendrePartenaire(
    @Param('id') id: string,
    @Body() body: { raison: string },
    @CurrentUser() user: User
  ): Promise<Partner> {
    return await this.partnerService.suspendrePartenaire(id, body.raison, this.getContext(user))
  }

  /**
   * Fusionner deux partenaires
   */
  @Post(':principalId/fusionner/:secondaireId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fusionner deux partenaires',
    description: 'Fusionner les données de deux partenaires en cas de doublon',
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
      permissions: [],
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
    description: 'Recherche avec critères multiples et filtres avancés',
  })
  async searchAdvanced(
    @Body() searchCriteria: Record<string, unknown>,
    @CurrentUser() _user: User
  ): Promise<Partner[]> {
    return await this.partnerService.searchPartners(searchCriteria)
  }

  /**
   * Statistiques des partenaires
   */
  @Get('stats/overview')
  @ApiOperation({
    summary: 'Statistiques des partenaires',
    description: 'Récupérer les statistiques globales des partenaires',
  })
  async getStatistiques(): Promise<PartnerStatistics> {
    return await this.partnerService.getStatistiques()
  }

  /**
   * Gestion des groupes de partenaires
   */
  @Get('groups')
  @ApiOperation({
    summary: 'Lister les groupes de partenaires',
    description: 'Récupérer tous les groupes tarifaires disponibles',
  })
  async getPartnerGroups(@CurrentUser() user: User): Promise<PartnerGroup[]> {
    return await this.partnerService.getPartnerGroups(this.getContext(user))
  }

  @Post('groups')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un groupe de partenaires',
    description: 'Créer un nouveau groupe tarifaire',
  })
  async createPartnerGroup(
    @Body() createDto: CreatePartnerGroupDto,
    @CurrentUser() user: User
  ): Promise<PartnerGroup> {
    return await this.partnerService.createPartnerGroup(createDto, this.getContext(user))
  }

  @Patch('groups/:groupId')
  @ApiOperation({
    summary: 'Mettre à jour un groupe',
    description: "Modifier les paramètres d'un groupe tarifaire",
  })
  async updatePartnerGroup(
    @Param('groupId') groupId: string,
    @Body() updateDto: UpdatePartnerGroupDto,
    @CurrentUser() user: User
  ): Promise<PartnerGroup> {
    return await this.partnerService.updatePartnerGroup(groupId, updateDto, this.getContext(user))
  }

  @Post(':partnerId/assign-group/:groupId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assigner un groupe à un partenaire',
    description: 'Associer un partenaire à un groupe tarifaire',
  })
  async assignPartnerToGroup(
    @Param('partnerId') partnerId: string,
    @Param('groupId') groupId: string,
    @CurrentUser() user: User
  ): Promise<Partner> {
    return await this.partnerService.assignPartnerToGroup(partnerId, groupId, this.getContext(user))
  }

  /**
   * Gestion des contacts
   */
  @Get(':partnerId/contacts')
  @ApiOperation({
    summary: "Lister les contacts d'un partenaire",
    description: "Récupérer tous les interlocuteurs d'un partenaire",
  })
  async getPartnerContacts(
    @Param('partnerId') partnerId: string,
    @CurrentUser() user: User
  ): Promise<Contact[]> {
    return await this.partnerService.getPartnerContacts(partnerId, this.getContext(user))
  }

  @Post(':partnerId/contacts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ajouter un contact',
    description: 'Créer un nouvel interlocuteur pour un partenaire',
  })
  async createContact(
    @Param('partnerId') partnerId: string,
    @Body() createDto: CreateContactDto,
    @CurrentUser() user: User
  ): Promise<Contact> {
    return await this.partnerService.createContact(partnerId, createDto, this.getContext(user))
  }

  @Patch('contacts/:contactId')
  @ApiOperation({
    summary: 'Mettre à jour un contact',
    description: "Modifier les informations d'un interlocuteur",
  })
  async updateContact(
    @Param('contactId') contactId: string,
    @Body() updateDto: UpdateContactDto,
    @CurrentUser() user: User
  ): Promise<Contact> {
    return await this.partnerService.updateContact(contactId, updateDto, this.getContext(user))
  }

  @Delete('contacts/:contactId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un contact',
    description: 'Supprimer un interlocuteur',
  })
  async deleteContact(
    @Param('contactId') contactId: string,
    @CurrentUser() user: User
  ): Promise<void> {
    await this.partnerService.deleteContact(contactId, this.getContext(user))
  }

  /**
   * Gestion des sites
   */
  @Get(':partnerId/sites')
  @ApiOperation({
    summary: "Lister les sites d'un partenaire",
    description: "Récupérer tous les sites (dépôts, usines, chantiers) d'un partenaire",
  })
  async getPartnerSites(
    @Param('partnerId') partnerId: string,
    @CurrentUser() user: User
  ): Promise<PartnerSite[]> {
    return await this.partnerService.getPartnerSites(partnerId, this.getContext(user))
  }

  @Post(':partnerId/sites')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ajouter un site',
    description: 'Créer un nouveau site pour un partenaire',
  })
  async createPartnerSite(
    @Param('partnerId') partnerId: string,
    @Body() createDto: CreatePartnerSiteDto,
    @CurrentUser() user: User
  ): Promise<PartnerSite> {
    return await this.partnerService.createPartnerSite(partnerId, createDto, this.getContext(user))
  }

  @Patch('sites/:siteId')
  @ApiOperation({
    summary: 'Mettre à jour un site',
    description: "Modifier les informations d'un site",
  })
  async updatePartnerSite(
    @Param('siteId') siteId: string,
    @Body() updateDto: UpdatePartnerSiteDto,
    @CurrentUser() user: User
  ): Promise<PartnerSite> {
    return await this.partnerService.updatePartnerSite(siteId, updateDto, this.getContext(user))
  }

  @Delete('sites/:siteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un site',
    description: 'Supprimer un site',
  })
  async deletePartnerSite(
    @Param('siteId') siteId: string,
    @CurrentUser() user: User
  ): Promise<void> {
    await this.partnerService.deletePartnerSite(siteId, this.getContext(user))
  }

  /**
   * Gestion des adresses
   */
  @Get(':partnerId/addresses')
  @ApiOperation({
    summary: "Lister les adresses d'un partenaire",
    description: "Récupérer toutes les adresses d'un partenaire",
  })
  async getPartnerAddresses(
    @Param('partnerId') partnerId: string,
    @CurrentUser() user: User
  ): Promise<PartnerAddress[]> {
    return await this.partnerService.getPartnerAddresses(partnerId, this.getContext(user))
  }

  @Post(':partnerId/addresses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ajouter une adresse',
    description: 'Créer une nouvelle adresse pour un partenaire',
  })
  async createPartnerAddress(
    @Param('partnerId') partnerId: string,
    @Body() createDto: CreatePartnerAddressDto,
    @CurrentUser() user: User
  ): Promise<PartnerAddress> {
    return await this.partnerService.createPartnerAddress(
      partnerId,
      createDto,
      this.getContext(user)
    )
  }

  @Patch('addresses/:addressId')
  @ApiOperation({
    summary: 'Mettre à jour une adresse',
    description: "Modifier les informations d'une adresse",
  })
  async updatePartnerAddress(
    @Param('addressId') addressId: string,
    @Body() updateDto: UpdatePartnerAddressDto,
    @CurrentUser() user: User
  ): Promise<PartnerAddress> {
    return await this.partnerService.updatePartnerAddress(
      addressId,
      updateDto,
      this.getContext(user)
    )
  }

  @Delete('addresses/:addressId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer une adresse',
    description: 'Supprimer une adresse',
  })
  async deletePartnerAddress(
    @Param('addressId') addressId: string,
    @CurrentUser() user: User
  ): Promise<void> {
    await this.partnerService.deletePartnerAddress(addressId, this.getContext(user))
  }

  /**
   * Informations complètes d\'un partenaire
   */
  @Get(':partnerId/complete')
  @ApiOperation({
    summary: "Récupérer toutes les données d'un partenaire",
    description: 'Obtenir le partenaire avec ses contacts, sites, adresses et groupe',
  })
  async getPartnerComplete(
    @Param('partnerId') partnerId: string,
    @CurrentUser() user: User
  ): Promise<{
    partner: Partner
    contacts: Contact[]
    sites: PartnerSite[]
    addresses: PartnerAddress[]
    group?: PartnerGroup
  }> {
    return await this.partnerService.getPartnerComplete(partnerId, this.getContext(user))
  }

  /**
   * Dupliquer un partenaire
   */
  @Post(':partnerId/duplicate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Dupliquer un partenaire',
    description: "Créer une copie complète d'un partenaire avec ses données associées",
  })
  async duplicatePartner(
    @Param('partnerId') partnerId: string,
    @Body() body: { newCode: string },
    @CurrentUser() user: User
  ): Promise<Partner> {
    return await this.partnerService.duplicatePartner(
      partnerId,
      body.newCode,
      this.getContext(user)
    )
  }

  /**
   * Export des partenaires
   */
  @Post('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exporter les partenaires',
    description: 'Exporter la liste des partenaires selon des critères',
  })
  async exportPartners(
    @Body() exportCriteria: { format: 'CSV' | 'EXCEL' | 'PDF'; filters?: Record<string, unknown> },
    @CurrentUser() _user: User
  ): Promise<{ url: string; filename: string }> {
    // Implémentation de l'export selon le format demandé
    // Pour l'exemple, on retourne une URL fictive
    return {
      url: '/exports/partners/export-2024-01-15.csv',
      filename: `partners-export-${new Date().toISOString().split('T')[0]}.${exportCriteria.format.toLowerCase()}`,
    }
  }

  /**
   * Import de partenaires
   */
  @Post('import')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Importer des partenaires',
    description: 'Importer une liste de partenaires depuis un fichier',
  })
  async importPartners(
    @Body() importData: {
      data: Record<string, unknown>[]
      options?: { skipErrors?: boolean; dryRun?: boolean }
    },
    @CurrentUser() user: User
  ): Promise<{
    imported: number
    errors: number
    warnings: string[]
    details: Record<string, unknown>[]
  }> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'current-tenant',
      userRoles: [user.role],
      permissions: [],
    }

    // Implémentation de l'import
    const results = {
      imported: 0,
      errors: 0,
      warnings: [] as string[],
      details: [] as Array<{ status: string; data: Record<string, unknown>; error?: string }>,
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
          error: (error as Error).message,
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
    description: 'Valider plusieurs partenaires selon les règles métier',
  })
  async validateBatch(
    @Body() partnerIds: string[],
    @CurrentUser() user: User
  ): Promise<Array<{ id: string; valid: boolean; errors: string[] }>> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'current-tenant',
      userRoles: [user.role],
      permissions: [],
    }

    const results: Array<{ id: string; valid: boolean; errors: string[] }> = []

    for (const partnerId of partnerIds) {
      try {
        const partner = await this.partnerService.findById(partnerId, context)
        if (partner) {
          const validation = await this.partnerService.validateBusinessRules(
            partner,
            'VALIDATE' as any
          )
          results.push({
            id: partnerId,
            valid: validation.isValid,
            errors: validation.errors.map((e) => e.message),
          })
        } else {
          results.push({
            id: partnerId,
            valid: false,
            errors: ['Partenaire introuvable'],
          })
        }
      } catch (error) {
        results.push({
          id: partnerId,
          valid: false,
          errors: [(error as Error).message],
        })
      }
    }

    return results
  }
}
