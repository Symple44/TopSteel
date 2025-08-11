import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { BusinessService } from '../../core/base/business-service'
import {
  type BusinessContext,
  BusinessOperation,
  type ValidationResult,
} from '../../core/interfaces/business-service.interface'
import { Partner, PartnerStatus, PartnerType } from '../entities/partner.entity'
import { PartnerGroup } from '../entities/partner-group.entity'
import { Contact } from '../entities/contact.entity'
import { PartnerSite } from '../entities/partner-site.entity'
import { PartnerAddress } from '../entities/partner-address.entity'
import type {
  CreateContactDto,
  UpdateContactDto,
  CreatePartnerSiteDto,
  UpdatePartnerSiteDto,
  CreatePartnerAddressDto,
  UpdatePartnerAddressDto,
  CreatePartnerGroupDto,
  UpdatePartnerGroupDto,
} from '../dto'
import type { IPartnerRepository } from '../repositories/partner.repository'

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
  async createPartnerGroup(data: CreatePartnerGroupDto, context?: BusinessContext): Promise<PartnerGroup> {
    this.logger.log('Création d\'un groupe de partenaires', data)
    const group = await this.groupRepository.create({
      ...data,
      societeId: context?.societeId,
    })
    return group
  }

  async updatePartnerGroup(
    groupId: string,
    data: UpdatePartnerGroupDto,
    context?: BusinessContext
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
    context?: BusinessContext
  ): Promise<Contact> {
    const contact = await this.contactRepository.findById(contactId)
    if (!contact) {
      throw new NotFoundException(`Contact ${contactId} introuvable`)
    }
    Object.assign(contact, data)
    return await this.contactRepository.save(contact)
  }

  async getPartnerContacts(
    partnerId: string,
    context?: BusinessContext
  ): Promise<Contact[]> {
    return await this.contactRepository.findByPartner(partnerId)
  }

  async deleteContact(
    contactId: string,
    context?: BusinessContext
  ): Promise<void> {
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
    context?: BusinessContext
  ): Promise<PartnerSite> {
    const site = await this.siteRepository.findById(siteId)
    if (!site) {
      throw new NotFoundException(`Site ${siteId} introuvable`)
    }
    Object.assign(site, data)
    return await this.siteRepository.save(site)
  }

  async getPartnerSites(
    partnerId: string,
    context?: BusinessContext
  ): Promise<PartnerSite[]> {
    return await this.siteRepository.findByPartner(partnerId)
  }

  async deletePartnerSite(
    siteId: string,
    context?: BusinessContext
  ): Promise<void> {
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
    context?: BusinessContext
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
    context?: BusinessContext
  ): Promise<PartnerAddress[]> {
    return await this.addressRepository.findByPartner(partnerId)
  }

  async deletePartnerAddress(
    addressId: string,
    context?: BusinessContext
  ): Promise<void> {
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
