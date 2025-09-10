import {
  BadRequestException,
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
import type {
  BusinessContext,
  BusinessOperation,
} from '../../core/interfaces/business-service.interface'
import type { ExtendedUser } from '../../../types/entities/user.types'
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

  private getContext(user: ExtendedUser): BusinessContext {
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
    @CurrentUser() user: ExtendedUser
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
    @CurrentUser() _user: ExtendedUser
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
  async getPartner(@Param('id') id: string, @CurrentUser() user: ExtendedUser): Promise<Partner | null> {
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
    @CurrentUser() user: ExtendedUser
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
  async deletePartner(@Param('id') id: string, @CurrentUser() user: ExtendedUser): Promise<void> {
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
  async convertirProspect(@Param('id') id: string, @CurrentUser() user: ExtendedUser): Promise<Partner> {
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
    @CurrentUser() user: ExtendedUser
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
    @CurrentUser() user: ExtendedUser
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
    @CurrentUser() _user: ExtendedUser
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
  async getPartnerGroups(@CurrentUser() user: ExtendedUser): Promise<PartnerGroup[]> {
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
    @CurrentUser() user: ExtendedUser
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
    @CurrentUser() user: ExtendedUser
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
    @CurrentUser() user: ExtendedUser
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
    @CurrentUser() user: ExtendedUser
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
    @CurrentUser() user: ExtendedUser
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
    @CurrentUser() user: ExtendedUser
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
    @CurrentUser() user: ExtendedUser
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
    @CurrentUser() user: ExtendedUser
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
    @CurrentUser() user: ExtendedUser
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
    @CurrentUser() user: ExtendedUser
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
    @CurrentUser() user: ExtendedUser
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
    @CurrentUser() user: ExtendedUser
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
    @CurrentUser() user: ExtendedUser
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
    @CurrentUser() user: ExtendedUser
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
    @CurrentUser() user: ExtendedUser
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
    @CurrentUser() user: ExtendedUser
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
    @CurrentUser() user: ExtendedUser
  ): Promise<Partner> {
    return await this.partnerService.duplicatePartner(
      partnerId,
      body.newCode,
      this.getContext(user)
    )
  }

  /**
   * Recherche avancée avec filtres multiples
   */
  @Post('search/advanced')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recherche avancée de partenaires',
    description: 'Recherche avec critères multiples, filtres géographiques et commerciaux',
  })
  async searchPartnersAdvanced(
    @Body() filters: Record<string, unknown>,
    @CurrentUser() _user: ExtendedUser
  ): Promise<{
    items: Partner[]
    total: number
    page: number
    limit: number
  }> {
    return await this.partnerService.searchPartnersAdvanced(filters)
  }

  /**
   * Recherche textuelle rapide
   */
  @Get('search/text')
  @ApiOperation({
    summary: 'Recherche textuelle',
    description: 'Recherche dans les champs principaux (dénomination, code, email, ville)',
  })
  async searchByText(
    @Query('q') searchText: string,
    @Query('limit') limit?: number
  ): Promise<Partner[]> {
    if (!searchText || searchText.trim().length < 2) {
      throw new BadRequestException('Le texte de recherche doit contenir au moins 2 caractères')
    }
    return await this.partnerService.searchByText(searchText, limit)
  }

  /**
   * Obtenir les partenaires par localisation
   */
  @Get('search/geo')
  @ApiOperation({
    summary: 'Recherche géographique',
    description: 'Rechercher les partenaires par ville, département ou région',
  })
  async searchByLocation(
    @Query('ville') ville?: string,
    @Query('departement') departement?: string,
    @Query('region') region?: string,
    @Query('pays') pays?: string
  ): Promise<Partner[]> {
    return await this.partnerService.searchByLocation({ ville, departement, region, pays })
  }

  /**
   * Obtenir les top clients
   */
  @Get('analytics/top-clients')
  @ApiOperation({
    summary: 'Top clients',
    description: "Obtenir les meilleurs clients par chiffre d'affaires",
  })
  async getTopClients(
    @Query('limit') limit: number = 10
  ): Promise<Array<Partner & { chiffreAffaires: number }>> {
    return await this.partnerService.getTopClients(limit)
  }

  /**
   * Obtenir les fournisseurs préférés
   */
  @Get('analytics/fournisseurs-preferes')
  @ApiOperation({
    summary: 'Fournisseurs préférés',
    description: 'Obtenir la liste des fournisseurs marqués comme préférés',
  })
  async getFournisseursPreferences(): Promise<Partner[]> {
    return await this.partnerService.getFournisseursPreferences()
  }

  /**
   * Obtenir les partenaires créés récemment
   */
  @Get('analytics/recent')
  @ApiOperation({
    summary: 'Partenaires récents',
    description: 'Obtenir les partenaires créés ou modifiés récemment',
  })
  async getRecentPartners(
    @Query('days') days: number = 30,
    @Query('type') type: 'created' | 'modified' = 'created'
  ): Promise<Partner[]> {
    return await this.partnerService.getRecentPartners(days, type)
  }

  /**
   * Détection de doublons
   */
  @Post('analytics/doublons')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Détecter les doublons',
    description: 'Analyser la base pour détecter les partenaires potentiellement en double',
  })
  async detectDoublons(
    @Body() criteria?: { checkSiret?: boolean; checkEmail?: boolean; checkDenomination?: boolean }
  ): Promise<
    Array<{
      partners: Partner[]
      matchType: string
      confidence: number
    }>
  > {
    return await this.partnerService.detectDoublons(criteria)
  }

  /**
   * Statistiques détaillées
   */
  @Get('analytics/statistics')
  @ApiOperation({
    summary: 'Statistiques détaillées',
    description: 'Obtenir des statistiques complètes sur les partenaires',
  })
  async getDetailedStatistics(): Promise<{
    totalPartenaires: number
    repartitionParType: Record<string, number>
    repartitionParStatus: Record<string, number>
    repartitionParCategorie: Record<string, number>
    repartitionGeographique: {
      parVille: Record<string, number>
      parDepartement: Record<string, number>
      parRegion: Record<string, number>
    }
    tendanceCreation: Array<{ periode: string; nombreCreations: number }>
    moyenneAnciennete: number
    tauxActivite: number
  }> {
    return await this.partnerService.getDetailedStatistics()
  }

  /**
   * Analyse de la performance commerciale
   */
  @Get('analytics/performance')
  @ApiOperation({
    summary: 'Performance commerciale',
    description: 'Analyser la performance commerciale par partenaire',
  })
  async getCommercialPerformance(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<{
    topPerformers: Array<Partner & { performance: number }>
    underPerformers: Array<Partner & { performance: number }>
    trends: Array<{ periode: string; valeur: number }>
  }> {
    const start = startDate ? new Date(startDate) : undefined
    const end = endDate ? new Date(endDate) : undefined
    return await this.partnerService.getCommercialPerformance(start, end)
  }

  // === GESTION DES INTERACTIONS ===

  /**
   * Créer une nouvelle interaction avec un partenaire
   */
  @Post(':partnerId/interactions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer une interaction',
    description: 'Enregistrer une nouvelle interaction avec un partenaire',
  })
  async createInteraction(
    @Param('partnerId') partnerId: string,
    @Body() createDto: Record<string, unknown>,
    @CurrentUser() user: ExtendedUser
  ): Promise<Record<string, unknown>> {
    const context = this.getContext(user)
    return await this.partnerService.createInteraction(partnerId, createDto, context)
  }

  /**
   * Obtenir les interactions d'un partenaire
   */
  @Get(':partnerId/interactions')
  @ApiOperation({
    summary: 'Historique des interactions',
    description: 'Récupérer toutes les interactions avec un partenaire',
  })
  async getPartnerInteractions(
    @Param('partnerId') partnerId: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<{
    items: Record<string, unknown>[]
    total: number
    hasMore: boolean
  }> {
    const filters = {
      limit,
      offset,
      type,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    }
    return await this.partnerService.getPartnerInteractions(partnerId, filters)
  }

  /**
   * Mettre à jour une interaction
   */
  @Patch('interactions/:interactionId')
  @ApiOperation({
    summary: 'Mettre à jour une interaction',
    description: "Modifier les informations d'une interaction existante",
  })
  async updateInteraction(
    @Param('interactionId') interactionId: string,
    @Body() updateDto: Record<string, unknown>,
    @CurrentUser() user: ExtendedUser
  ): Promise<Record<string, unknown>> {
    const context = this.getContext(user)
    return await this.partnerService.updateInteraction(interactionId, updateDto, context)
  }

  /**
   * Supprimer une interaction
   */
  @Delete('interactions/:interactionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer une interaction',
    description: 'Supprimer une interaction (soft delete)',
  })
  async deleteInteraction(
    @Param('interactionId') interactionId: string,
    @CurrentUser() user: ExtendedUser
  ): Promise<void> {
    const context = this.getContext(user)
    await this.partnerService.deleteInteraction(interactionId, context)
  }

  /**
   * Rechercher des interactions
   */
  @Post('interactions/search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rechercher des interactions',
    description: 'Recherche avancée dans les interactions partenaires',
  })
  async searchInteractions(@Body() searchCriteria: Record<string, unknown>): Promise<{
    items: Record<string, unknown>[]
    total: number
    aggregations: Record<string, unknown>
  }> {
    return await this.partnerService.searchInteractions(searchCriteria)
  }

  /**
   * Statistiques des interactions par type
   */
  @Get('interactions/stats/by-type')
  @ApiOperation({
    summary: "Statistiques par type d'interaction",
    description: 'Répartition des interactions par type sur une période',
  })
  async getInteractionStatsByType(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy: 'day' | 'week' | 'month' = 'month'
  ): Promise<{
    byType: Record<string, number>
    byPeriod: Array<{ periode: string; count: number }>
    trends: Array<{ type: string; trend: 'up' | 'down' | 'stable'; variation: number }>
  }> {
    const start = startDate ? new Date(startDate) : undefined
    const end = endDate ? new Date(endDate) : undefined
    return await this.partnerService.getInteractionStatsByType(start, end, groupBy)
  }

  /**
   * Statistiques de performance des interactions
   */
  @Get('interactions/stats/performance')
  @ApiOperation({
    summary: 'Performance des interactions',
    description: "Analyser l'efficacité et les résultats des interactions",
  })
  async getInteractionPerformanceStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<{
    totalInteractions: number
    tauxReussite: number
    dureeeMoyenne: number
    satisfactionMoyenne: number
    conversionCommerciale: number
    topUsers: Array<{ userId: string; userNom: string; interactions: number; performance: number }>
  }> {
    const start = startDate ? new Date(startDate) : undefined
    const end = endDate ? new Date(endDate) : undefined
    return await this.partnerService.getInteractionPerformanceStats(start, end)
  }

  // === STATISTIQUES AVANCÉES PARTENAIRES ===

  /**
   * Statistiques complètes d'un partenaire spécifique
   */
  @Get(':partnerId/analytics/complete')
  @ApiOperation({
    summary: "Statistiques complètes d'un partenaire",
    description: "Analyse complète d'un partenaire avec toutes ses métriques",
  })
  async getCompletePartnerAnalytics(
    @Param('partnerId') partnerId: string,
    @Query('includePredictions') includePredictions: boolean = false
  ): Promise<Record<string, unknown>> {
    return await this.partnerService.getCompletePartnerAnalytics(partnerId, { includePredictions })
  }

  /**
   * Analyse de la relation commerciale
   */
  @Get(':partnerId/analytics/relationship')
  @ApiOperation({
    summary: 'Analyse de la relation commerciale',
    description: "Analyser l'évolution et la qualité de la relation commerciale",
  })
  async getPartnerRelationshipAnalysis(
    @Param('partnerId') partnerId: string,
    @Query('period') period: number = 12 // mois
  ): Promise<{
    durationMonths: number
    evolutionScore: number
    loyaltyIndex: number
    businessGrowth: number
    interactionFrequency: number
    lastInteractionDays: number
    riskLevel: 'low' | 'medium' | 'high'
    opportunities: string[]
    threats: string[]
    recommendations: string[]
  }> {
    return await this.partnerService.getPartnerRelationshipAnalysis(partnerId, period)
  }

  /**
   * Analyse comparative avec les pairs
   */
  @Get(':partnerId/analytics/benchmark')
  @ApiOperation({
    summary: 'Analyse comparative',
    description: 'Comparer un partenaire avec ses pairs du même secteur',
  })
  async getPartnerBenchmark(
    @Param('partnerId') partnerId: string,
    @Query('sector') sector?: string,
    @Query('size') size?: string
  ): Promise<{
    ranking: number
    totalPeers: number
    percentile: number
    scoreVsPeers: {
      performance: 'above' | 'average' | 'below'
      business: 'above' | 'average' | 'below'
      reliability: 'above' | 'average' | 'below'
    }
    metrics: {
      averageOrderValue: { partner: number; peers: number; position: string }
      orderFrequency: { partner: number; peers: number; position: string }
      deliveryPerformance: { partner: number; peers: number; position: string }
      qualityScore: { partner: number; peers: number; position: string }
    }
  }> {
    return await this.partnerService.getPartnerBenchmark(partnerId, { sector, size })
  }

  /**
   * Dashboard de performance globale
   */
  @Get('analytics/dashboard')
  @ApiOperation({
    summary: 'Dashboard de performance',
    description: "Vue d'ensemble des performances partenaires avec KPIs",
  })
  async getPartnerDashboard(
    @Query('period') period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<{
    kpis: {
      totalPartners: number
      activePartners: number
      newPartnersThisPeriod: number
      totalRevenue: number
      averageOrderValue: number
      partnerSatisfaction: number
    }
    growth: {
      partnersGrowth: number
      revenueGrowth: number
      orderGrowth: number
    }
    topPerformers: Array<{
      partnerId: string
      partnerName: string
      revenue: number
      orders: number
      performance: number
    }>
    alerts: Array<{
      type: 'risk' | 'opportunity' | 'action_required'
      title: string
      description: string
      partnerId?: string
      priority: 'low' | 'medium' | 'high'
    }>
    trends: Array<{
      metric: string
      trend: 'up' | 'down' | 'stable'
      value: number
      change: number
    }>
  }> {
    return await this.partnerService.getPartnerDashboard(period)
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
    @CurrentUser() _user: ExtendedUser
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
    @CurrentUser() user: ExtendedUser
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
    @CurrentUser() user: ExtendedUser
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
            'VALIDATE' as BusinessOperation
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
