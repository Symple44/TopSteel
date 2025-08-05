import { Inject, Injectable } from '@nestjs/common'
import { BusinessService } from '../../core/base/business-service'
import {
  type BusinessContext,
  BusinessOperation,
  type ValidationResult,
} from '../../core/interfaces/business-service.interface'
import { Partner, PartnerStatus, PartnerType } from '../entities/partner.entity'
import type { IPartnerRepository } from '../repositories/partner.repository'

/**
 * Service métier pour la gestion des partenaires (clients/fournisseurs)
 */
@Injectable()
export class PartnerService extends BusinessService<Partner> {
  constructor(
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository
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
      partner.code = await this.generatePartnerCode(data.type!)
    }

    // Informations de base obligatoires
    partner.type = data.type!
    partner.denomination = data.denomination || ''
    partner.category = data.category!
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
}

/**
 * Interfaces pour les critères de recherche et statistiques
 */
export interface PartnerSearchCriteria {
  type?: PartnerType[]
  status?: PartnerStatus[]
  category?: string[]
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
  top10ClientsAnciennete: Array<{ code: string; denomination: string; anciennete: number }>
}
