import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { BusinessService } from '../../core/base/business-service'
import {
  type BusinessContext,
  BusinessOperation,
  type ValidationResult,
} from '../../core/interfaces/business-service.interface'
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
import type { Contact } from '../entities/contact.entity'
import { Partner, PartnerStatus, PartnerType } from '../entities/partner.entity'
import type { PartnerAddress } from '../entities/partner-address.entity'
import type { PartnerGroup } from '../entities/partner-group.entity'
import type { PartnerSite } from '../entities/partner-site.entity'
import type { IPartnerRepository, PartnerAdvancedFilters } from '../repositories/partner.repository'

/**
 * Service métier pour la gestion des partenaires (clients/fournisseurs)
 */
@Injectable()
export class PartnerService extends BusinessService<Partner> {
  constructor(
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('IPartnerGroupRepository')
    private readonly groupRepository: IPartnerGroupRepository,
    @Inject('IContactRepository')
    private readonly contactRepository: IContactRepository,
    @Inject('IPartnerSiteRepository')
    private readonly siteRepository: IPartnerSiteRepository,
    @Inject('IPartnerAddressRepository')
    private readonly addressRepository: IPartnerAddressRepository
  ) {
    super(partnerRepository, 'PartnerService')
  }

  /**
   * Valider les règles métier spécifiques aux partenaires
   */
  async validateBusinessRules(
    entity: Partner,
    operation: BusinessOperation
  ): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = []
    const warnings: Array<{ field: string; message: string; code: string }> = []

    // 1. Validation de base de l'entité
    const entityErrors = entity.validate()
    errors.push(
      ...entityErrors.map((msg) => ({ field: 'general', message: msg, code: 'VALIDATION_ERROR' }))
    )

    // 2. Règles métier spécifiques selon l'opération
    switch (operation) {
      case BusinessOperation.CREATE:
        await this.validateCreationRules(entity, errors, warnings)
        break
      case BusinessOperation.UPDATE:
        await this.validateUpdateRules(entity, errors, warnings)
        break
      case BusinessOperation.DELETE:
        await this.validateDeletionRules(entity, errors, warnings)
        break
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Construire une entité Partner
   */
  protected async buildEntity(data: Partial<Partner>): Promise<Partner> {
    const partner = new Partner()

    // Générer un code automatique si non fourni
    if (data.code) {
      partner.code = data.code
    } else {
      if (!data.type) {
        throw new Error('Type de partenaire requis pour générer un code')
      }
      partner.code = await this.generatePartnerCode(data.type)
    }

    // Informations de base obligatoires
    if (!data.type) {
      throw new Error('Type de partenaire requis')
    }
    partner.type = data.type
    partner.denomination = data.denomination || ''
    if (!data.category) {
      throw new Error('Catégorie de partenaire requise')
    }
    partner.category = data.category
    partner.status = data.status || PartnerStatus.ACTIF

    // Informations optionnelles
    partner.denominationCommerciale = data.denominationCommerciale
    partner.siret = data.siret
    partner.numeroTVA = data.numeroTVA
    partner.codeAPE = data.codeAPE

    // Contact
    partner.contactPrincipal = data.contactPrincipal
    partner.telephone = data.telephone
    partner.mobile = data.mobile
    partner.email = data.email
    partner.siteWeb = data.siteWeb

    // Adresse
    partner.adresse = data.adresse
    partner.adresseComplement = data.adresseComplement
    partner.codePostal = data.codePostal
    partner.ville = data.ville
    partner.pays = data.pays || 'France'

    // Informations commerciales
    partner.conditionsPaiement = data.conditionsPaiement
    partner.modePaiement = data.modePaiement
    partner.plafondCredit = data.plafondCredit
    partner.tauxRemise = data.tauxRemise
    partner.representantCommercial = data.representantCommercial

    // Groupe tarifaire
    if (data.groupId) {
      partner.groupId = data.groupId
    }

    // Spécifique fournisseurs
    partner.delaiLivraison = data.delaiLivraison
    partner.montantMiniCommande = data.montantMiniCommande
    partner.fournisseurPrefere = data.fournisseurPrefere || false

    // Comptabilité
    partner.compteComptableClient = data.compteComptableClient
    partner.compteComptableFournisseur = data.compteComptableFournisseur

    // Métadonnées
    partner.notes = data.notes || {}
    partner.donneesTechniques = data.donneesTechniques || {}

    return partner
  }

  /**
   * Appliquer les mises à jour
   */
  protected async applyUpdates(existing: Partner, updates: Partial<Partner>): Promise<Partner> {
    // Interdire la modification de certains champs critiques
    const protectedFields = ['code', 'type']
    protectedFields.forEach((field) => {
      if (updates[field] !== undefined && updates[field] !== existing[field]) {
        throw new Error(`Le champ ${field} ne peut pas être modifié`)
      }
    })

    // Appliquer les mises à jour autorisées
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined && !protectedFields.includes(key)) {
        existing[key] = updates[key]
      }
    })

    existing.markAsModified()
    return existing
  }

  protected getEntityName(): string {
    return 'Partenaire'
  }

  /**
   * Gestion des groupes de partenaires
   */
  async createPartnerGroup(
    data: CreatePartnerGroupDto,
    context?: BusinessContext
  ): Promise<PartnerGroup> {
    this.logger.log("Création d'un groupe de partenaires", data)
    const group = await this.groupRepository.create({
      ...data,
      societeId: context?.societeId,
    })
    return group
  }

  async updatePartnerGroup(
    groupId: string,
    data: UpdatePartnerGroupDto,
    _context?: BusinessContext
  ): Promise<PartnerGroup> {
    const group = await this.groupRepository.findById(groupId)
    if (!group) {
      throw new NotFoundException(`Groupe ${groupId} introuvable`)
    }
    Object.assign(group, data)
    return await this.groupRepository.save(group)
  }

  async getPartnerGroups(context?: BusinessContext): Promise<PartnerGroup[]> {
    return await this.groupRepository.findBySociete(context?.societeId || '')
  }

  async assignPartnerToGroup(
    partnerId: string,
    groupId: string,
    context?: BusinessContext
  ): Promise<Partner> {
    const partner = await this.findById(partnerId, context)
    if (!partner) {
      throw new NotFoundException(`Partenaire ${partnerId} introuvable`)
    }

    const group = await this.groupRepository.findById(groupId)
    if (!group) {
      throw new NotFoundException(`Groupe ${groupId} introuvable`)
    }

    partner.groupId = groupId
    partner.group = group
    return await this.repository.save(partner)
  }

  /**
   * Gestion des contacts
   */
  async createContact(
    partnerId: string,
    data: CreateContactDto,
    context?: BusinessContext
  ): Promise<Contact> {
    const partner = await this.findById(partnerId, context)
    if (!partner) {
      throw new NotFoundException(`Partenaire ${partnerId} introuvable`)
    }

    const contactData = {
      ...data,
      partnerId,
      societeId: context?.societeId,
      // Convertir les dates string en Date
      dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : undefined,
    }

    const contact = await this.contactRepository.create(contactData)
    return contact
  }

  async updateContact(
    contactId: string,
    data: UpdateContactDto,
    _context?: BusinessContext
  ): Promise<Contact> {
    const contact = await this.contactRepository.findById(contactId)
    if (!contact) {
      throw new NotFoundException(`Contact ${contactId} introuvable`)
    }
    Object.assign(contact, data)
    return await this.contactRepository.save(contact)
  }

  async getPartnerContacts(partnerId: string, _context?: BusinessContext): Promise<Contact[]> {
    return await this.contactRepository.findByPartner(partnerId)
  }

  async deleteContact(contactId: string, _context?: BusinessContext): Promise<void> {
    const contact = await this.contactRepository.findById(contactId)
    if (!contact) {
      throw new NotFoundException(`Contact ${contactId} introuvable`)
    }
    await this.contactRepository.delete(contactId)
  }

  /**
   * Gestion des sites
   */
  async createPartnerSite(
    partnerId: string,
    data: CreatePartnerSiteDto,
    context?: BusinessContext
  ): Promise<PartnerSite> {
    const partner = await this.findById(partnerId, context)
    if (!partner) {
      throw new NotFoundException(`Partenaire ${partnerId} introuvable`)
    }

    const siteData = {
      ...data,
      partnerId,
      societeId: context?.societeId,
      // Convertir les dates string en Date
      dateOuverture: data.dateOuverture ? new Date(data.dateOuverture) : undefined,
      dateFermeture: data.dateFermeture ? new Date(data.dateFermeture) : undefined,
    }

    const site = await this.siteRepository.create(siteData)
    return site
  }

  async updatePartnerSite(
    siteId: string,
    data: UpdatePartnerSiteDto,
    _context?: BusinessContext
  ): Promise<PartnerSite> {
    const site = await this.siteRepository.findById(siteId)
    if (!site) {
      throw new NotFoundException(`Site ${siteId} introuvable`)
    }
    Object.assign(site, data)
    return await this.siteRepository.save(site)
  }

  async getPartnerSites(partnerId: string, _context?: BusinessContext): Promise<PartnerSite[]> {
    return await this.siteRepository.findByPartner(partnerId)
  }

  async deletePartnerSite(siteId: string, _context?: BusinessContext): Promise<void> {
    const site = await this.siteRepository.findById(siteId)
    if (!site) {
      throw new NotFoundException(`Site ${siteId} introuvable`)
    }
    await this.siteRepository.delete(siteId)
  }

  /**
   * Gestion des adresses
   */
  async createPartnerAddress(
    partnerId: string,
    data: CreatePartnerAddressDto,
    context?: BusinessContext
  ): Promise<PartnerAddress> {
    const partner = await this.findById(partnerId, context)
    if (!partner) {
      throw new NotFoundException(`Partenaire ${partnerId} introuvable`)
    }

    const addressData = {
      ...data,
      partnerId,
      societeId: context?.societeId,
      // Convertir les dates string en Date
      dateDebut: data.dateDebut ? new Date(data.dateDebut) : undefined,
      dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
    }

    const address = await this.addressRepository.create(addressData)
    return address
  }

  async updatePartnerAddress(
    addressId: string,
    data: UpdatePartnerAddressDto,
    _context?: BusinessContext
  ): Promise<PartnerAddress> {
    const address = await this.addressRepository.findById(addressId)
    if (!address) {
      throw new NotFoundException(`Adresse ${addressId} introuvable`)
    }
    Object.assign(address, data)
    return await this.addressRepository.save(address)
  }

  async getPartnerAddresses(
    partnerId: string,
    _context?: BusinessContext
  ): Promise<PartnerAddress[]> {
    return await this.addressRepository.findByPartner(partnerId)
  }

  async deletePartnerAddress(addressId: string, _context?: BusinessContext): Promise<void> {
    const address = await this.addressRepository.findById(addressId)
    if (!address) {
      throw new NotFoundException(`Adresse ${addressId} introuvable`)
    }
    await this.addressRepository.delete(addressId)
  }

  /**
   * Méthodes métier spécifiques
   */

  /**
   * Rechercher des partenaires par critères
   */
  async searchPartners(criteria: PartnerSearchCriteria): Promise<Partner[]> {
    this.logger.log('Recherche de partenaires avec critères', criteria)
    return await this.partnerRepository.searchByCriteria(criteria)
  }

  /**
   * Obtenir tous les clients actifs
   */
  async getClientsActifs(): Promise<Partner[]> {
    return await this.partnerRepository.findByTypeAndStatus(
      [PartnerType.CLIENT, PartnerType.MIXTE],
      PartnerStatus.ACTIF
    )
  }

  /**
   * Obtenir tous les fournisseurs actifs
   */
  async getFournisseursActifs(): Promise<Partner[]> {
    return await this.partnerRepository.findByTypeAndStatus(
      [PartnerType.FOURNISSEUR, PartnerType.MIXTE],
      PartnerStatus.ACTIF
    )
  }

  /**
   * Convertir un prospect en client
   */
  async convertirProspect(partnerId: string, context?: BusinessContext): Promise<Partner> {
    const partner = await this.findById(partnerId, context)
    if (!partner) {
      throw new Error('Partenaire introuvable')
    }

    partner.convertirProspectEnClient()
    return await this.repository.save(partner)
  }

  /**
   * Suspendre un partenaire
   */
  async suspendrePartenaire(
    partnerId: string,
    raison: string,
    context?: BusinessContext
  ): Promise<Partner> {
    const partner = await this.findById(partnerId, context)
    if (!partner) {
      throw new Error('Partenaire introuvable')
    }

    partner.suspendre(raison)
    return await this.repository.save(partner)
  }

  /**
   * Obtenir les statistiques des partenaires
   */
  async getStatistiques(): Promise<PartnerStatistics> {
    const allPartners = await this.partnerRepository.findAll()

    const stats: PartnerStatistics = {
      totalPartenaires: allPartners.length,
      totalClients: allPartners.filter((p) => p.isClient()).length,
      totalFournisseurs: allPartners.filter((p) => p.isFournisseur()).length,
      totalProspects: allPartners.filter((p) => p.status === PartnerStatus.PROSPECT).length,
      partenairesActifs: allPartners.filter((p) => p.isActif()).length,
      partenairesInactifs: allPartners.filter((p) => p.status === PartnerStatus.INACTIF).length,
      partenairesSuspendus: allPartners.filter((p) => p.status === PartnerStatus.SUSPENDU).length,
      repartitionParCategorie: this.calculerRepartitionCategorie(allPartners),
      repartitionParGroupe: await this.calculerRepartitionGroupe(allPartners),
      top10ClientsAnciennete: this.getTop10ClientsAnciennete(allPartners),
    }

    return stats
  }

  /**
   * Fusionner deux partenaires (en cas de doublons)
   */
  async fusionnerPartenaires(
    partnerPrincipalId: string,
    partnerSecondaireId: string,
    context?: BusinessContext
  ): Promise<Partner> {
    const partnerPrincipal = await this.findById(partnerPrincipalId, context)
    const partnerSecondaire = await this.findById(partnerSecondaireId, context)

    if (!partnerPrincipal || !partnerSecondaire) {
      throw new Error('Un des partenaires est introuvable')
    }

    // Logique de fusion : combiner les informations
    // Prendre les informations les plus complètes
    if (!partnerPrincipal.telephone && partnerSecondaire.telephone) {
      partnerPrincipal.telephone = partnerSecondaire.telephone
    }
    if (!partnerPrincipal.email && partnerSecondaire.email) {
      partnerPrincipal.email = partnerSecondaire.email
    }
    // ... autres champs à fusionner

    // Fusionner les notes
    if (partnerSecondaire.notes?.historiqueNotes) {
      if (!partnerPrincipal.notes) partnerPrincipal.notes = {}
      if (!partnerPrincipal.notes.historiqueNotes) partnerPrincipal.notes.historiqueNotes = []

      partnerPrincipal.notes.historiqueNotes.push(...partnerSecondaire.notes.historiqueNotes)
    }

    partnerPrincipal.ajouterNote(
      'Fusion',
      `Fusion avec le partenaire ${partnerSecondaire.code} - ${partnerSecondaire.denomination}`,
      context?.userId || 'SYSTEM'
    )

    // Sauvegarder le partenaire principal
    const updatedPartner = await this.repository.save(partnerPrincipal)

    // Supprimer le partenaire secondaire (soft delete)
    await this.delete(partnerSecondaireId, context)

    return updatedPartner
  }

  /**
   * Méthodes privées
   */

  private async validateCreationRules(
    entity: Partner,
    errors: Array<{ field: string; message: string; code: string }>,
    warnings: Array<{ field: string; message: string; code: string }>
  ): Promise<void> {
    // Vérifier l'unicité du code
    const existingPartner = await this.partnerRepository.findByCode(entity.code)
    if (existingPartner) {
      errors.push({
        field: 'code',
        message: 'Ce code partenaire existe déjà',
        code: 'CODE_DUPLICATE',
      })
    }

    // Vérifier l'unicité du SIRET si fourni
    if (entity.siret) {
      const existingBySiret = await this.partnerRepository.findBySiret(entity.siret)
      if (existingBySiret) {
        warnings.push({ field: 'siret', message: 'Ce SIRET existe déjà', code: 'SIRET_DUPLICATE' })
      }
    }

    // Vérifier l'unicité de l'email si fourni
    if (entity.email) {
      const existingByEmail = await this.partnerRepository.findByEmail(entity.email)
      if (existingByEmail) {
        warnings.push({
          field: 'email',
          message: 'Cette adresse email existe déjà',
          code: 'EMAIL_DUPLICATE',
        })
      }
    }
  }

  private async validateUpdateRules(
    entity: Partner,
    _errors: Array<{ field: string; message: string; code: string }>,
    warnings: Array<{ field: string; message: string; code: string }>
  ): Promise<void> {
    // Un partenaire avec des commandes ne peut pas changer de type
    const hasOrders = await this.partnerRepository.hasActiveOrders(entity.id)
    if (hasOrders) {
      warnings.push({
        field: 'type',
        message: 'Ce partenaire a des commandes en cours',
        code: 'HAS_ORDERS',
      })
    }
  }

  private async validateDeletionRules(
    entity: Partner,
    errors: Array<{ field: string; message: string; code: string }>,
    _warnings: Array<{ field: string; message: string; code: string }>
  ): Promise<void> {
    // Interdire la suppression si le partenaire a des commandes
    const hasOrders = await this.partnerRepository.hasActiveOrders(entity.id)
    if (hasOrders) {
      errors.push({
        field: 'general',
        message: 'Impossible de supprimer un partenaire avec des commandes',
        code: 'HAS_ORDERS',
      })
    }

    // Interdire la suppression si le partenaire a des factures impayées
    const hasUnpaidInvoices = await this.partnerRepository.hasUnpaidInvoices(entity.id)
    if (hasUnpaidInvoices) {
      errors.push({
        field: 'general',
        message: 'Impossible de supprimer un partenaire avec des factures impayées',
        code: 'HAS_UNPAID_INVOICES',
      })
    }
  }

  private async generatePartnerCode(type: PartnerType): Promise<string> {
    const prefix =
      type === PartnerType.CLIENT ? 'CLI' : type === PartnerType.FOURNISSEUR ? 'FOU' : 'MIX'

    const count = await this.partnerRepository.countByType(type)
    return `${prefix}${(count + 1).toString().padStart(6, '0')}`
  }

  private calculerRepartitionCategorie(partners: Partner[]): Record<string, number> {
    const repartition = {}
    partners.forEach((p) => {
      repartition[p.category] = (repartition[p.category] || 0) + 1
    })
    return repartition
  }

  private getTop10ClientsAnciennete(
    partners: Partner[]
  ): Array<{ code: string; denomination: string; anciennete: number }> {
    return partners
      .filter((p) => p.isClient())
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, 10)
      .map((p) => ({
        code: p.code,
        denomination: p.denomination,
        anciennete: p.getAnneeAnciennete(),
      }))
  }

  private async calculerRepartitionGroupe(partners: Partner[]): Promise<Record<string, number>> {
    const repartition = {}
    const groups = await this.groupRepository.findBySociete(partners[0]?.societeId || '')

    groups.forEach((group) => {
      repartition[group.name] = partners.filter((p) => p.groupId === group.id).length
    })

    // Ajouter les partenaires sans groupe
    const sansGroupe = partners.filter((p) => !p.groupId).length
    if (sansGroupe > 0) {
      repartition['Sans groupe'] = sansGroupe
    }

    return repartition
  }

  /**
   * Méthodes utilitaires pour la gestion complète d'un partenaire
   */
  async getPartnerComplete(
    partnerId: string,
    context?: BusinessContext
  ): Promise<{
    partner: Partner
    contacts: Contact[]
    sites: PartnerSite[]
    addresses: PartnerAddress[]
    group?: PartnerGroup
  }> {
    const partner = await this.findById(partnerId, context)
    if (!partner) {
      throw new NotFoundException(`Partenaire ${partnerId} introuvable`)
    }

    const [contacts, sites, addresses] = await Promise.all([
      this.contactRepository.findByPartner(partnerId),
      this.siteRepository.findByPartner(partnerId),
      this.addressRepository.findByPartner(partnerId),
    ])

    let group: PartnerGroup | undefined
    if (partner.groupId) {
      const foundGroup = await this.groupRepository.findById(partner.groupId)
      if (foundGroup) {
        group = foundGroup
      }
    }

    return {
      partner,
      contacts,
      sites,
      addresses,
      group,
    }
  }

  /**
   * Dupliquer un partenaire avec toutes ses données associées
   */
  async duplicatePartner(
    partnerId: string,
    newCode: string,
    context?: BusinessContext
  ): Promise<Partner> {
    const { partner, contacts, sites, addresses } = await this.getPartnerComplete(
      partnerId,
      context
    )

    // Créer le nouveau partenaire
    const newPartner = await this.create(
      {
        ...partner,
        id: undefined,
        code: newCode,
        denomination: `${partner.denomination} (Copie)`,
        status: PartnerStatus.PROSPECT,
      },
      context
    )

    // Dupliquer les contacts
    for (const contact of contacts) {
      await this.contactRepository.create({
        ...contact,
        id: undefined,
        partnerId: newPartner.id,
      })
    }

    // Dupliquer les sites
    const sitesMapping: Record<string, string> = {}
    for (const site of sites) {
      const newSite = await this.siteRepository.create({
        ...site,
        id: undefined,
        partnerId: newPartner.id,
        code: `${site.code}_COPY`,
      })
      sitesMapping[site.id] = newSite.id
    }

    // Dupliquer les adresses en mettant à jour les références aux sites
    for (const address of addresses) {
      await this.addressRepository.create({
        ...address,
        id: undefined,
        partnerId: newPartner.id,
        partnerSiteId: address.partnerSiteId ? sitesMapping[address.partnerSiteId] : undefined,
      })
    }

    return newPartner
  }

  /**
   * Recherche avancée avec filtres multiples
   */
  async searchPartnersAdvanced(filters: Record<string, unknown>): Promise<{
    items: Partner[]
    total: number
    page: number
    limit: number
  }> {
    return await this.partnerRepository.findWithFilters(filters as any)
  }

  /**
   * Recherche textuelle dans les champs principaux
   */
  async searchByText(searchText: string, limit?: number): Promise<Partner[]> {
    return await this.partnerRepository.searchByText(searchText, limit)
  }

  /**
   * Recherche par localisation géographique
   */
  async searchByLocation(criteria: {
    ville?: string
    departement?: string
    region?: string
    pays?: string
  }): Promise<Partner[]> {
    const filters: PartnerAdvancedFilters = {}

    if (criteria.ville) {
      filters.searchText = criteria.ville
      filters.searchFields = ['ville']
    }

    if (criteria.departement) {
      filters.departement = criteria.departement
    }

    if (criteria.region) {
      filters.region = criteria.region
    }

    if (criteria.pays) {
      filters.pays = [criteria.pays]
    }

    const result = await this.partnerRepository.findWithFilters(filters)
    return result.items
  }

  /**
   * Obtenir les meilleurs clients par chiffre d'affaires
   */
  async getTopClients(limit: number): Promise<Array<Partner & { chiffreAffaires: number }>> {
    return await this.partnerRepository.getTopClients(limit)
  }

  /**
   * Obtenir les fournisseurs préférés
   */
  async getFournisseursPreferences(): Promise<Partner[]> {
    return await this.partnerRepository.getFournisseursPreferences()
  }

  /**
   * Obtenir les partenaires récents
   */
  async getRecentPartners(days: number, type: 'created' | 'modified'): Promise<Partner[]> {
    if (type === 'modified') {
      return await this.partnerRepository.findRecentlyModified(days)
    } else {
      const dateMin = new Date()
      dateMin.setDate(dateMin.getDate() - days)
      const dateMax = new Date()
      return await this.partnerRepository.findCreatedBetween(dateMin, dateMax)
    }
  }

  /**
   * Détecter les doublons potentiels
   */
  async detectDoublons(criteria?: {
    checkSiret?: boolean
    checkEmail?: boolean
    checkDenomination?: boolean
  }): Promise<
    Array<{
      partners: Partner[]
      matchType: string
      confidence: number
    }>
  > {
    const allPartners = await this.partnerRepository.findAll()
    const doublons: Array<{
      partners: Partner[]
      matchType: string
      confidence: number
    }> = []

    const processedIds = new Set<string>()

    for (const partner of allPartners) {
      if (processedIds.has(partner.id)) continue

      const matches = await this.partnerRepository.findPotentialDuplicates(partner)
      const filteredMatches = matches.filter((m) => m.id !== partner.id && !processedIds.has(m.id))

      if (filteredMatches.length > 0) {
        let matchType = ''
        let confidence = 0

        for (const match of filteredMatches) {
          if (criteria?.checkSiret !== false && partner.siret === match.siret && partner.siret) {
            matchType = 'SIRET'
            confidence = 100
          } else if (
            criteria?.checkEmail !== false &&
            partner.email === match.email &&
            partner.email
          ) {
            matchType = matchType ? `${matchType}, EMAIL` : 'EMAIL'
            confidence = Math.max(confidence, 90)
          } else if (
            criteria?.checkDenomination !== false &&
            partner.denomination.toLowerCase() === match.denomination.toLowerCase()
          ) {
            matchType = matchType ? `${matchType}, DENOMINATION` : 'DENOMINATION'
            confidence = Math.max(confidence, 80)
          }
        }

        if (matchType) {
          doublons.push({
            partners: [partner, ...filteredMatches],
            matchType,
            confidence,
          })

          processedIds.add(partner.id)
          filteredMatches.forEach((m) => processedIds.add(m.id))
        }
      }
    }

    return doublons.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Obtenir les statistiques détaillées
   */
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
    return await this.partnerRepository.getPartnerStats()
  }

  /**
   * Analyser la performance commerciale
   */
  async getCommercialPerformance(
    _startDate?: Date,
    _endDate?: Date
  ): Promise<{
    topPerformers: Array<Partner & { performance: number }>
    underPerformers: Array<Partner & { performance: number }>
    trends: Array<{ periode: string; valeur: number }>
  }> {
    // TODO: Implémenter selon la logique métier avec les données de commandes/factures
    const partners = await this.partnerRepository.findAll()

    // Simulation de données de performance
    const withPerformance = partners.map((p) => {
      const performance = Math.random() * 100
      return Object.assign(p, { performance }) as Partner & { performance: number }
    })

    const sorted = withPerformance.sort((a, b) => b.performance - a.performance)

    return {
      topPerformers: sorted.slice(0, 10),
      underPerformers: sorted.slice(-10).reverse(),
      trends: [], // TODO: Implémenter avec les données réelles
    }
  }

  // === GESTION DES INTERACTIONS ===

  /**
   * Créer une nouvelle interaction avec un partenaire
   */
  async createInteraction(
    partnerId: string,
    interactionData: Record<string, unknown>,
    context: BusinessContext
  ): Promise<Record<string, unknown>> {
    // TODO: Implémenter avec un repository d'interactions dédié
    const interaction = {
      id: `interaction-${Date.now()}`,
      partnerId,
      userId: context.userId,
      type: interactionData.type || 'AUTRE',
      sujet: interactionData.sujet || '',
      description: interactionData.description || '',
      dateInteraction: interactionData.dateInteraction || new Date(),
      status: 'TERMINEE',
      priority: interactionData.priority || 'NORMALE',
      direction: interactionData.direction || 'SORTANT',
      dateCreation: new Date(),
      ...interactionData,
    }

    this.logger.log(
      `Interaction créée pour le partenaire ${partnerId} par l'utilisateur ${context.userId}`
    )
    return interaction
  }

  /**
   * Obtenir les interactions d'un partenaire
   */
  async getPartnerInteractions(
    partnerId: string,
    filters: Record<string, unknown>
  ): Promise<{
    items: Record<string, unknown>[]
    total: number
    hasMore: boolean
  }> {
    // TODO: Implémenter avec un repository d'interactions dédié
    // Pour l'instant, retourner des données simulées
    const simulatedInteractions = [
      {
        id: 'int-1',
        partnerId,
        type: 'APPEL_TELEPHONIQUE',
        sujet: 'Suivi commande en cours',
        dateInteraction: new Date(Date.now() - 86400000), // Hier
        status: 'TERMINEE',
        duree: 15,
        utilisateurNom: 'Jean Dupont',
      },
      {
        id: 'int-2',
        partnerId,
        type: 'EMAIL',
        sujet: 'Demande de devis',
        dateInteraction: new Date(Date.now() - 172800000), // Avant-hier
        status: 'TERMINEE',
        utilisateurNom: 'Marie Martin',
      },
      {
        id: 'int-3',
        partnerId,
        type: 'REUNION',
        sujet: 'Présentation nouveaux produits',
        dateInteraction: new Date(Date.now() - 604800000), // Il y a une semaine
        status: 'TERMINEE',
        duree: 120,
        utilisateurNom: 'Pierre Leblanc',
      },
    ]

    const limit = (filters.limit as number) || 50
    const offset = (filters.offset as number) || 0

    return {
      items: simulatedInteractions.slice(offset, offset + limit),
      total: simulatedInteractions.length,
      hasMore: simulatedInteractions.length > offset + limit,
    }
  }

  /**
   * Mettre à jour une interaction
   */
  async updateInteraction(
    interactionId: string,
    updateData: Record<string, unknown>,
    context: BusinessContext
  ): Promise<Record<string, unknown>> {
    // TODO: Implémenter avec un repository d'interactions dédié
    this.logger.log(`Interaction ${interactionId} mise à jour par l'utilisateur ${context.userId}`)

    return {
      id: interactionId,
      ...updateData,
      dateModification: new Date(),
      modifiePar: context.userId,
    }
  }

  /**
   * Supprimer une interaction
   */
  async deleteInteraction(interactionId: string, context: BusinessContext): Promise<void> {
    // TODO: Implémenter avec un repository d'interactions dédié
    this.logger.log(`Interaction ${interactionId} supprimée par l'utilisateur ${context.userId}`)
  }

  /**
   * Rechercher des interactions
   */
  async searchInteractions(_searchCriteria: Record<string, unknown>): Promise<{
    items: Record<string, unknown>[]
    total: number
    aggregations: Record<string, unknown>
  }> {
    // TODO: Implémenter avec un repository d'interactions dédié
    return {
      items: [],
      total: 0,
      aggregations: {
        byType: {},
        byStatus: {},
        byUser: {},
      },
    }
  }

  /**
   * Statistiques des interactions par type
   */
  async getInteractionStatsByType(
    _startDate?: Date,
    _endDate?: Date,
    _groupBy: 'day' | 'week' | 'month' = 'month'
  ): Promise<{
    byType: Record<string, number>
    byPeriod: Array<{ periode: string; count: number }>
    trends: Array<{ type: string; trend: 'up' | 'down' | 'stable'; variation: number }>
  }> {
    // TODO: Implémenter avec des données réelles
    return {
      byType: {
        APPEL_TELEPHONIQUE: 45,
        EMAIL: 78,
        REUNION: 23,
        VISIOCONFERENCE: 34,
        VISITE_SITE: 12,
      },
      byPeriod: [
        { periode: '2024-01', count: 89 },
        { periode: '2024-02', count: 156 },
        { periode: '2024-03', count: 192 },
      ],
      trends: [
        { type: 'EMAIL', trend: 'up', variation: 15.2 },
        { type: 'REUNION', trend: 'down', variation: -8.5 },
        { type: 'APPEL_TELEPHONIQUE', trend: 'stable', variation: 2.1 },
      ],
    }
  }

  /**
   * Statistiques de performance des interactions
   */
  async getInteractionPerformanceStats(
    _startDate?: Date,
    _endDate?: Date
  ): Promise<{
    totalInteractions: number
    tauxReussite: number
    dureeeMoyenne: number
    satisfactionMoyenne: number
    conversionCommerciale: number
    topUsers: Array<{ userId: string; userNom: string; interactions: number; performance: number }>
  }> {
    // TODO: Implémenter avec des données réelles
    return {
      totalInteractions: 1247,
      tauxReussite: 82.5,
      dureeeMoyenne: 35.2,
      satisfactionMoyenne: 4.2,
      conversionCommerciale: 18.7,
      topUsers: [
        { userId: 'user-1', userNom: 'Jean Dupont', interactions: 156, performance: 87.5 },
        { userId: 'user-2', userNom: 'Marie Martin', interactions: 142, performance: 85.2 },
        { userId: 'user-3', userNom: 'Pierre Leblanc', interactions: 134, performance: 83.8 },
      ],
    }
  }

  // === STATISTIQUES AVANCÉES PARTENAIRES ===

  /**
   * Statistiques complètes d'un partenaire spécifique
   */
  async getCompletePartnerAnalytics(
    partnerId: string,
    options: { includePredictions?: boolean } = {}
  ): Promise<Record<string, unknown>> {
    const partner = await this.partnerRepository.findById(partnerId)
    if (!partner) {
      throw new NotFoundException(`Partenaire ${partnerId} non trouvé`)
    }

    // TODO: Implémenter avec des données réelles depuis les différents modules
    return {
      partner: {
        id: partner.id,
        code: partner.code,
        denomination: partner.denomination,
        type: partner.type,
        status: partner.status,
      },
      commercial: {
        montantAffairesTotal: 1250000,
        montantAffairesAnnee: 380000,
        nombreCommandesAnnee: 24,
        montantMoyenCommande: 15833,
        frequenceCommande: 15.2,
        derniereCommande: new Date(Date.now() - 86400000 * 12),
        evolutionAnnuelle: 12.5,
      },
      performance: {
        noteGlobale: 4.2,
        noteQualite: 4.5,
        noteDelai: 3.8,
        noteService: 4.3,
        tauxConformite: 94.2,
        nombreReclamations: 3,
        tempsResolutionMoyen: 2.5,
      },
      interactions: {
        nombreTotal: 84,
        derniereInteraction: new Date(Date.now() - 86400000 * 5),
        typesInteractions: [
          { type: 'EMAIL', nombre: 32 },
          { type: 'APPEL_TELEPHONIQUE', nombre: 24 },
          { type: 'REUNION', nombre: 8 },
        ],
      },
      risque: {
        niveau: 'FAIBLE',
        score: 85,
        facteurs: ['Excellent historique de paiement', 'Partenariat de longue durée'],
      },
      opportunites: [
        'Extension de gamme possible',
        'Augmentation des volumes',
        'Nouveaux marchés géographiques',
      ],
      predictions: options.includePredictions
        ? {
            montantAffairesProchain: 420000,
            probabiliteRenouvellement: 92,
            risqueChurn: 8,
          }
        : undefined,
    }
  }

  /**
   * Analyse de la relation commerciale
   */
  async getPartnerRelationshipAnalysis(
    partnerId: string,
    _periodMonths: number
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
    const partner = await this.partnerRepository.findById(partnerId)
    if (!partner) {
      throw new NotFoundException(`Partenaire ${partnerId} non trouvé`)
    }

    // TODO: Calculer avec des données réelles
    const creationDate = partner.createdAt || new Date()
    const durationMonths = Math.floor(
      (Date.now() - creationDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    )

    return {
      durationMonths,
      evolutionScore: 78.5,
      loyaltyIndex: 85.2,
      businessGrowth: 12.8,
      interactionFrequency: 2.3, // interactions par mois
      lastInteractionDays: 5,
      riskLevel: 'low',
      opportunities: [
        'Proposer des services additionnels',
        'Étendre la collaboration à de nouveaux projets',
        'Améliorer les délais de livraison',
      ],
      threats: ['Concurrence aggressive sur les prix', 'Réduction possible des budgets'],
      recommendations: [
        'Organiser une réunion stratégique trimestrielle',
        'Proposer un contrat cadre annuel',
        'Mettre en place un suivi KPI mensuel',
      ],
    }
  }

  /**
   * Analyse comparative avec les pairs
   */
  async getPartnerBenchmark(
    partnerId: string,
    _options: { sector?: string; size?: string } = {}
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
    const partner = await this.partnerRepository.findById(partnerId)
    if (!partner) {
      throw new NotFoundException(`Partenaire ${partnerId} non trouvé`)
    }

    // TODO: Implémenter avec des données réelles et logique de benchmarking
    return {
      ranking: 15,
      totalPeers: 127,
      percentile: 88.2,
      scoreVsPeers: {
        performance: 'above',
        business: 'above',
        reliability: 'average',
      },
      metrics: {
        averageOrderValue: {
          partner: 15833,
          peers: 12500,
          position: 'above_average',
        },
        orderFrequency: {
          partner: 24,
          peers: 18,
          position: 'above_average',
        },
        deliveryPerformance: {
          partner: 94.2,
          peers: 91.5,
          position: 'above_average',
        },
        qualityScore: {
          partner: 4.2,
          peers: 3.8,
          position: 'above_average',
        },
      },
    }
  }

  /**
   * Dashboard de performance globale
   */
  async getPartnerDashboard(_period: 'week' | 'month' | 'quarter' | 'year'): Promise<{
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
    const stats = await this.partnerRepository.getPartnerStats()

    // TODO: Calculer avec des données réelles selon la période
    return {
      kpis: {
        totalPartners: stats.totalPartenaires,
        activePartners: Math.floor(stats.totalPartenaires * (stats.tauxActivite / 100)),
        newPartnersThisPeriod: 12,
        totalRevenue: 15750000,
        averageOrderValue: 14250,
        partnerSatisfaction: 4.1,
      },
      growth: {
        partnersGrowth: 8.5,
        revenueGrowth: 15.2,
        orderGrowth: 12.8,
      },
      topPerformers: [
        {
          partnerId: 'partner-1',
          partnerName: 'MetalCorp SA',
          revenue: 2150000,
          orders: 86,
          performance: 4.8,
        },
        {
          partnerId: 'partner-2',
          partnerName: 'SteelWorks Ltd',
          revenue: 1875000,
          orders: 72,
          performance: 4.6,
        },
        {
          partnerId: 'partner-3',
          partnerName: 'Industrial Solutions',
          revenue: 1420000,
          orders: 58,
          performance: 4.4,
        },
      ],
      alerts: [
        {
          type: 'action_required',
          title: 'Contrats arrivant à échéance',
          description: '5 contrats arrivent à échéance dans les 30 prochains jours',
          priority: 'high',
        },
        {
          type: 'opportunity',
          title: 'Nouveaux marchés identifiés',
          description: '3 partenaires ont exprimé un intérêt pour de nouveaux produits',
          priority: 'medium',
        },
        {
          type: 'risk',
          title: 'Partenaires inactifs',
          description: '8 partenaires sans commande depuis plus de 6 mois',
          priority: 'medium',
        },
      ],
      trends: [
        {
          metric: "Chiffre d'affaires",
          trend: 'up',
          value: 15750000,
          change: 15.2,
        },
        {
          metric: 'Nombre de commandes',
          trend: 'up',
          value: 1247,
          change: 12.8,
        },
        {
          metric: 'Satisfaction moyenne',
          trend: 'stable',
          value: 4.1,
          change: 2.1,
        },
        {
          metric: 'Délai moyen livraison',
          trend: 'down',
          value: 12.5,
          change: -8.3,
        },
      ],
    }
  }
}

/**
 * Interfaces pour les critères de recherche et statistiques
 */
export interface PartnerSearchCriteria {
  type?: PartnerType[]
  status?: PartnerStatus[]
  category?: string[]
  groupId?: string
  denomination?: string
  ville?: string
  codePostal?: string
  email?: string
  telephone?: string
  page?: number
  limit?: number
}

export interface PartnerStatistics {
  totalPartenaires: number
  totalClients: number
  totalFournisseurs: number
  totalProspects: number
  partenairesActifs: number
  partenairesInactifs: number
  partenairesSuspendus: number
  repartitionParCategorie: Record<string, number>
  repartitionParGroupe: Record<string, number>
  top10ClientsAnciennete: Array<{ code: string; denomination: string; anciennete: number }>
}

/**
 * Interfaces des repositories
 */
export interface IPartnerGroupRepository {
  create(data: Partial<PartnerGroup>): Promise<PartnerGroup>
  findById(id: string): Promise<PartnerGroup | null>
  findBySociete(societeId: string): Promise<PartnerGroup[]>
  save(entity: PartnerGroup): Promise<PartnerGroup>
  delete(id: string): Promise<void>
}

export interface IContactRepository {
  create(data: Partial<Contact>): Promise<Contact>
  findById(id: string): Promise<Contact | null>
  findByPartner(partnerId: string): Promise<Contact[]>
  save(entity: Contact): Promise<Contact>
  delete(id: string): Promise<void>
}

export interface IPartnerSiteRepository {
  create(data: Partial<PartnerSite>): Promise<PartnerSite>
  findById(id: string): Promise<PartnerSite | null>
  findByPartner(partnerId: string): Promise<PartnerSite[]>
  save(entity: PartnerSite): Promise<PartnerSite>
  delete(id: string): Promise<void>
}

export interface IPartnerAddressRepository {
  create(data: Partial<PartnerAddress>): Promise<PartnerAddress>
  findById(id: string): Promise<PartnerAddress | null>
  findByPartner(partnerId: string): Promise<PartnerAddress[]>
  save(entity: PartnerAddress): Promise<PartnerAddress>
  delete(id: string): Promise<void>
}
