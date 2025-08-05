import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Partner, PartnerStatus, PartnerType } from '../entities/partner.entity'
import { IPartnerRepository, PartnerRepositoryStats } from './partner.repository'
import { PartnerSearchCriteria } from '../services/partner.service'

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
    await this.repository.update(id, entity)
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

  async findBySpecification(spec: any): Promise<Partner[]> {
    // Implémentation basique - pourrait être améliorée avec le pattern Specification
    return await this.repository.find()
  }

  // Méthodes manquantes de IPartnerRepository
  async hasActiveOrders(partnerId: string): Promise<boolean> {
    // TODO: Implémenter la logique selon vos besoins métier
    return false
  }

  async hasUnpaidInvoices(partnerId: string): Promise<boolean> {
    // TODO: Implémenter la logique selon vos besoins métier
    return false
  }

  async findWithFilters(
    filters: any
  ): Promise<{ items: Partner[]; total: number; page: number; limit: number }> {
    // TODO: Implémenter la pagination avancée
    const items = await this.repository.find()
    return {
      items,
      total: items.length,
      page: 1,
      limit: 10,
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

    // Implémentation basique - peut être améliorée avec des requêtes optimisées
    return {
      totalPartenaires,
      repartitionParType: {
        [PartnerType.CLIENT]: await this.repository.count({ where: { type: PartnerType.CLIENT } }),
        [PartnerType.FOURNISSEUR]: await this.repository.count({
          where: { type: PartnerType.FOURNISSEUR },
        }),
        [PartnerType.MIXTE]: await this.repository.count({ where: { type: PartnerType.MIXTE } }),
      },
      repartitionParStatus: {
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
      },
      repartitionParCategorie: {}, // TODO: Implémenter si nécessaire
      repartitionGeographique: {
        parVille: {},
        parDepartement: {},
        parRegion: {},
      },
      tendanceCreation: [],
      moyenneAnciennete: 0,
      tauxActivite: 0,
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
