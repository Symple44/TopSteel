import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import { Partner, PartnerStatus, PartnerType } from '../entities/partner.entity'
import type { PartnerSearchCriteria } from '../services/partner.service'
import type {
  IPartnerRepository,
  PartnerAdvancedFilters,
  PartnerRepositoryStats,
} from './partner.repository'
import { PartnerSortField } from './partner.repository'

/**
 * Implémentation concrète du repository Partner avec TypeORM
 */
@Injectable()
export class PartnerRepositoryImpl implements IPartnerRepository {
  constructor(
    @InjectRepository(Partner, 'tenant')
    private readonly repository: Repository<Partner>
  ) {}

  async findById(id: string): Promise<Partner | null> {
    return await this.repository.findOne({ where: { id } })
  }

  async findByCode(code: string): Promise<Partner | null> {
    return await this.repository.findOne({ where: { code } })
  }

  async findBySiret(siret: string): Promise<Partner | null> {
    return await this.repository.findOne({ where: { siret } })
  }

  async findByEmail(email: string): Promise<Partner | null> {
    return await this.repository.findOne({ where: { email } })
  }

  async findByTypeAndStatus(types: PartnerType[], status: PartnerStatus): Promise<Partner[]> {
    return await this.repository.find({
      where: {
        type: types.length === 1 ? types[0] : undefined,
        status,
      },
    })
  }

  async findAll(): Promise<Partner[]> {
    return await this.repository.find()
  }

  async create(entity: Partner): Promise<Partner> {
    const savedEntity = await this.repository.save(entity)
    return savedEntity
  }

  async update(id: string, entity: Partial<Partner>): Promise<Partner> {
    await this.repository.update(id, entity as unknown)
    const updated = await this.findById(id)
    if (!updated) {
      throw new Error(`Partner with id ${id} not found after update`)
    }
    return updated
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id)
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } })
    return count > 0
  }

  async count(): Promise<number> {
    return await this.repository.count()
  }

  // Méthodes additionnelles spécifiques au business
  async countByType(type: PartnerType): Promise<number> {
    return await this.repository.count({ where: { type } })
  }

  async searchByCriteria(criteria: PartnerSearchCriteria): Promise<Partner[]> {
    const query = this.repository.createQueryBuilder('partner')

    if (criteria.type?.length) {
      query.andWhere('partner.type IN (:...types)', { types: criteria.type })
    }

    if (criteria.status?.length) {
      query.andWhere('partner.status IN (:...statuses)', { statuses: criteria.status })
    }

    if (criteria.category?.length) {
      query.andWhere('partner.category IN (:...categories)', { categories: criteria.category })
    }

    if (criteria.denomination) {
      query.andWhere('partner.denomination ILIKE :denomination', {
        denomination: `%${criteria.denomination}%`,
      })
    }

    if (criteria.email) {
      query.andWhere('partner.email ILIKE :email', { email: `%${criteria.email}%` })
    }

    if (criteria.ville) {
      query.andWhere('partner.ville ILIKE :ville', { ville: `%${criteria.ville}%` })
    }

    if (criteria.codePostal) {
      query.andWhere('partner.codePostal = :codePostal', { codePostal: criteria.codePostal })
    }

    // Pagination
    if (criteria.limit) {
      query.limit(criteria.limit)
    }

    if (criteria.page && criteria.limit) {
      query.offset((criteria.page - 1) * criteria.limit)
    }

    return await query.getMany()
  }

  async findActivePartners(): Promise<Partner[]> {
    return await this.repository.find({
      where: { status: PartnerStatus.ACTIF },
    })
  }

  // Méthodes de l'interface IBusinessRepository
  async save(entity: Partner): Promise<Partner> {
    return await this.repository.save(entity)
  }

  async findBySpecification(_spec: any): Promise<Partner[]> {
    // Implémentation basique - pourrait être améliorée avec le pattern Specification
    return await this.repository.find()
  }

  // Méthodes manquantes de IPartnerRepository
  async hasActiveOrders(_partnerId: string): Promise<boolean> {
    // TODO: Implémenter la logique selon vos besoins métier
    return false
  }

  async hasUnpaidInvoices(_partnerId: string): Promise<boolean> {
    // TODO: Implémenter la logique selon vos besoins métier
    return false
  }

  async findWithFilters(
    filters: PartnerAdvancedFilters
  ): Promise<{ items: Partner[]; total: number; page: number; limit: number }> {
    const query = this.repository.createQueryBuilder('partner')

    // Filtres de base
    if (filters.type?.length) {
      query.andWhere('partner.type IN (:...types)', { types: filters.type })
    }

    if (filters.status?.length) {
      query.andWhere('partner.status IN (:...statuses)', { statuses: filters.status })
    }

    if (filters.category?.length) {
      query.andWhere('partner.category IN (:...categories)', { categories: filters.category })
    }

    // Filtres géographiques
    if (filters.ville) {
      query.andWhere('partner.ville ILIKE :ville', { ville: `%${filters.ville}%` })
    }

    if (filters.codePostal) {
      query.andWhere('partner.codePostal = :codePostal', { codePostal: filters.codePostal })
    }

    if (filters.region) {
      query.andWhere('partner.codePostal LIKE :region', { region: `${filters.region}%` })
    }

    if (filters.departement) {
      query.andWhere('SUBSTRING(partner.codePostal, 1, 2) = :departement', {
        departement: filters.departement,
      })
    }

    if (filters.pays?.length) {
      query.andWhere('partner.pays IN (:...pays)', { pays: filters.pays })
    }

    // Filtres commerciaux
    if (filters.chiffreAffairesMin !== undefined) {
      query.andWhere('partner.chiffreAffaires >= :caMin', { caMin: filters.chiffreAffairesMin })
    }

    if (filters.chiffreAffairesMax !== undefined) {
      query.andWhere('partner.chiffreAffaires <= :caMax', { caMax: filters.chiffreAffairesMax })
    }

    if (filters.dateCreationMin) {
      query.andWhere('partner.createdAt >= :dateMin', { dateMin: filters.dateCreationMin })
    }

    if (filters.dateCreationMax) {
      query.andWhere('partner.createdAt <= :dateMax', { dateMax: filters.dateCreationMax })
    }

    if (filters.ancienneteMin !== undefined) {
      const dateMin = new Date()
      dateMin.setFullYear(dateMin.getFullYear() - filters.ancienneteMin)
      query.andWhere('partner.createdAt <= :ancienneteMin', { ancienneteMin: dateMin })
    }

    if (filters.ancienneteMax !== undefined) {
      const dateMax = new Date()
      dateMax.setFullYear(dateMax.getFullYear() - filters.ancienneteMax)
      query.andWhere('partner.createdAt >= :ancienneteMax', { ancienneteMax: dateMax })
    }

    // Filtres spéciaux
    if (filters.hasOrders !== undefined) {
      // TODO: Joindre avec la table des commandes quand elle existera
      // query.andWhere('EXISTS (SELECT 1 FROM orders WHERE orders.partnerId = partner.id)')
    }

    if (filters.hasUnpaidInvoices !== undefined) {
      // TODO: Joindre avec la table des factures quand elle existera
      // query.andWhere('EXISTS (SELECT 1 FROM invoices WHERE invoices.partnerId = partner.id AND invoices.status = :unpaid)', { unpaid: 'UNPAID' })
    }

    if (filters.isPreferredSupplier === true) {
      query.andWhere('partner.fournisseurPrefere = true')
    }

    if (filters.hasContactEmail === true) {
      query.andWhere('partner.email IS NOT NULL')
      query.andWhere("partner.email != ''")
    }

    if (filters.hasContactPhone === true) {
      query.andWhere('(partner.telephone IS NOT NULL OR partner.mobile IS NOT NULL)')
    }

    // Recherche textuelle
    if (filters.searchText) {
      const searchFields = filters.searchFields || ['denomination', 'code', 'email', 'ville']
      const searchConditions = searchFields
        .map((field) => `partner.${field} ILIKE :search`)
        .join(' OR ')
      query.andWhere(`(${searchConditions})`, { search: `%${filters.searchText}%` })
    }

    // Tri
    const sortField = filters.sortBy || PartnerSortField.CODE
    const sortOrder = filters.sortOrder || 'ASC'
    query.orderBy(`partner.${sortField}`, sortOrder)

    // Pagination
    const page = filters.page || 1
    const limit = filters.limit || 20
    const skip = (page - 1) * limit

    query.skip(skip).take(limit)

    // Exécution
    const [items, total] = await query.getManyAndCount()

    return {
      items,
      total,
      page,
      limit,
    }
  }

  // Méthodes manquantes de IPartnerRepository
  async findByVille(ville: string): Promise<Partner[]> {
    return await this.repository.find({ where: { ville } })
  }

  async findByRegion(codePostalPrefix: string): Promise<Partner[]> {
    return await this.repository
      .createQueryBuilder('partner')
      .where('partner.codePostal LIKE :prefix', { prefix: `${codePostalPrefix}%` })
      .getMany()
  }

  async searchByText(searchText: string, limit?: number): Promise<Partner[]> {
    const query = this.repository
      .createQueryBuilder('partner')
      .where(
        '(partner.denomination ILIKE :text OR partner.code ILIKE :text OR partner.email ILIKE :text)',
        { text: `%${searchText}%` }
      )

    if (limit) {
      query.limit(limit)
    }

    return await query.getMany()
  }

  async getPartnerStats(): Promise<PartnerRepositoryStats> {
    const totalPartenaires = await this.repository.count()

    // Répartition par type
    const repartitionParType = {
      [PartnerType.CLIENT]: await this.repository.count({ where: { type: PartnerType.CLIENT } }),
      [PartnerType.FOURNISSEUR]: await this.repository.count({
        where: { type: PartnerType.FOURNISSEUR },
      }),
      [PartnerType.MIXTE]: await this.repository.count({ where: { type: PartnerType.MIXTE } }),
    }

    // Répartition par statut
    const repartitionParStatus = {
      [PartnerStatus.ACTIF]: await this.repository.count({
        where: { status: PartnerStatus.ACTIF },
      }),
      [PartnerStatus.INACTIF]: await this.repository.count({
        where: { status: PartnerStatus.INACTIF },
      }),
      [PartnerStatus.SUSPENDU]: await this.repository.count({
        where: { status: PartnerStatus.SUSPENDU },
      }),
      [PartnerStatus.PROSPECT]: await this.repository.count({
        where: { status: PartnerStatus.PROSPECT },
      }),
    }

    // Répartition par catégorie
    const categoriesResult = await this.repository
      .createQueryBuilder('partner')
      .select('partner.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('partner.category')
      .getRawMany()

    const repartitionParCategorie: Record<string, number> = {}
    categoriesResult.forEach((item) => {
      if (item.category) {
        repartitionParCategorie[item.category] = parseInt(item.count)
      }
    })

    // Répartition géographique par ville
    const villesResult = await this.repository
      .createQueryBuilder('partner')
      .select('partner.ville', 'ville')
      .addSelect('COUNT(*)', 'count')
      .where('partner.ville IS NOT NULL')
      .groupBy('partner.ville')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany()

    const parVille: Record<string, number> = {}
    villesResult.forEach((item) => {
      if (item.ville) {
        parVille[item.ville] = parseInt(item.count)
      }
    })

    // Répartition géographique par département
    const departementsResult = await this.repository
      .createQueryBuilder('partner')
      .select('SUBSTRING(partner.codePostal, 1, 2)', 'departement')
      .addSelect('COUNT(*)', 'count')
      .where('partner.codePostal IS NOT NULL')
      .groupBy('SUBSTRING(partner.codePostal, 1, 2)')
      .orderBy('count', 'DESC')
      .getRawMany()

    const parDepartement: Record<string, number> = {}
    departementsResult.forEach((item) => {
      if (item.departement) {
        parDepartement[item.departement] = parseInt(item.count)
      }
    })

    // Tendance de création sur les 12 derniers mois
    const tendanceResult = await this.repository
      .createQueryBuilder('partner')
      .select("TO_CHAR(partner.createdAt, 'YYYY-MM')", 'periode')
      .addSelect('COUNT(*)', 'count')
      .where('partner.createdAt >= :date', {
        date: new Date(new Date().setMonth(new Date().getMonth() - 12)),
      })
      .groupBy("TO_CHAR(partner.createdAt, 'YYYY-MM')")
      .orderBy('periode', 'ASC')
      .getRawMany()

    const tendanceCreation = tendanceResult.map((item) => ({
      periode: item.periode,
      nombreCreations: parseInt(item.count),
    }))

    // Calcul de l'ancienneté moyenne
    const ancienneteResult = await this.repository
      .createQueryBuilder('partner')
      .select('AVG(EXTRACT(YEAR FROM AGE(NOW(), partner.createdAt)))', 'moyenne')
      .getRawOne()

    const moyenneAnciennete = parseFloat(ancienneteResult?.moyenne || '0')

    // Taux d'activité
    const partnersActifs = await this.repository.count({
      where: { status: PartnerStatus.ACTIF },
    })
    const tauxActivite = totalPartenaires > 0 ? (partnersActifs / totalPartenaires) * 100 : 0

    return {
      totalPartenaires,
      repartitionParType,
      repartitionParStatus,
      repartitionParCategorie,
      repartitionGeographique: {
        parVille,
        parDepartement,
        parRegion: {}, // TODO: Implémenter si nécessaire
      },
      tendanceCreation,
      moyenneAnciennete,
      tauxActivite,
    }
  }

  async findCreatedBetween(dateDebut: Date, dateFin: Date): Promise<Partner[]> {
    return await this.repository
      .createQueryBuilder('partner')
      .where('partner.createdAt BETWEEN :dateDebut AND :dateFin', { dateDebut, dateFin })
      .getMany()
  }

  async findRecentlyModified(nbJours: number): Promise<Partner[]> {
    const date = new Date()
    date.setDate(date.getDate() - nbJours)

    return await this.repository
      .createQueryBuilder('partner')
      .where('partner.updatedAt > :date', { date })
      .getMany()
  }

  async findPotentialDuplicates(partner: Partner): Promise<Partner[]> {
    const query = this.repository.createQueryBuilder('partner')

    if (partner.siret) {
      query.orWhere('partner.siret = :siret', { siret: partner.siret })
    }

    if (partner.email) {
      query.orWhere('partner.email = :email', { email: partner.email })
    }

    if (partner.denomination) {
      query.orWhere('partner.denomination ILIKE :denomination', {
        denomination: `%${partner.denomination}%`,
      })
    }

    return await query.getMany()
  }

  async getFournisseursPreferences(): Promise<Partner[]> {
    return await this.repository.find({
      where: {
        type: PartnerType.FOURNISSEUR,
        fournisseurPrefere: true,
        status: PartnerStatus.ACTIF,
      },
    })
  }

  async getTopClients(limit: number): Promise<Array<Partner & { chiffreAffaires: number }>> {
    // TODO: Implémenter avec les données de chiffre d'affaires réelles
    const partners = await this.repository.find({
      where: { type: PartnerType.CLIENT },
      take: limit,
    })

    return partners.map((partner) => {
      const result = Object.assign(partner, { chiffreAffaires: 0 })
      return result as Partner & { chiffreAffaires: number }
    })
  }
}
