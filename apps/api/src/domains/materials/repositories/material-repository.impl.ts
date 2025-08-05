import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import type { Repository } from 'typeorm'
import {
  Material,
  MaterialShape,
  MaterialStatus,
  MaterialType,
  StorageMethod,
} from '../entities/material.entity'
import type { MaterialSearchCriteria, MaterialStatistics } from '../services/material.service'
import type {
  IMaterialRepository,
  MaterialAdvancedFilters,
  MechanicalPropertiesFilters,
} from './material.repository'

/**
 * Implémentation concrète du repository Material avec TypeORM
 */
@Injectable()
export class MaterialRepositoryImpl implements IMaterialRepository {
  constructor(
    @InjectRepository(Material, 'tenant')
    private readonly repository: Repository<Material>
  ) {}

  async findById(id: string): Promise<Material | null> {
    return await this.repository.findOne({ where: { id } })
  }

  async findByReference(reference: string): Promise<Material | null> {
    return await this.repository.findOne({ where: { reference } })
  }

  async findByType(type: MaterialType): Promise<Material[]> {
    return await this.repository.find({ where: { type } })
  }

  async findByShape(shape: MaterialShape): Promise<Material[]> {
    return await this.repository.find({ where: { forme: shape } })
  }

  async findByStatus(status: MaterialStatus): Promise<Material[]> {
    return await this.repository.find({ where: { status } })
  }

  async findByNuance(nuance: string): Promise<Material[]> {
    return await this.repository.find({ where: { nuance } })
  }

  async findBySupplier(supplierId: string): Promise<Material[]> {
    return await this.repository
      .createQueryBuilder('material')
      .where("material.informationsApprovisionnement->>'fournisseurPrincipalId' = :supplierId", {
        supplierId,
      })
      .getMany()
  }

  async findAll(): Promise<Material[]> {
    return await this.repository.find()
  }

  async create(entity: Material): Promise<Material> {
    const savedEntity = await this.repository.save(entity)
    return savedEntity
  }

  async update(id: string, entity: Partial<Material>): Promise<Material> {
    await this.repository.update(id, entity)
    const updated = await this.findById(id)
    if (!updated) {
      throw new Error(`Material with id ${id} not found after update`)
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
  async countByType(type: MaterialType): Promise<number> {
    return await this.repository.count({ where: { type } })
  }

  async searchByCriteria(criteria: MaterialSearchCriteria): Promise<Material[]> {
    const query = this.repository.createQueryBuilder('material')

    if (criteria.type?.length) {
      query.andWhere('material.type IN (:...types)', { types: criteria.type })
    }

    if (criteria.forme?.length) {
      query.andWhere('material.forme IN (:...formes)', { formes: criteria.forme })
    }

    if (criteria.status?.length) {
      query.andWhere('material.status IN (:...statuses)', { statuses: criteria.status })
    }

    if (criteria.nuance?.length) {
      query.andWhere('material.nuance IN (:...nuances)', { nuances: criteria.nuance })
    }

    if (criteria.nom) {
      query.andWhere('material.nom ILIKE :nom', { nom: `%${criteria.nom}%` })
    }

    if (criteria.reference) {
      query.andWhere('material.reference ILIKE :reference', {
        reference: `%${criteria.reference}%`,
      })
    }

    if (criteria.marque) {
      query.andWhere('material.marque ILIKE :marque', { marque: `%${criteria.marque}%` })
    }

    if (criteria.fournisseurId) {
      query.andWhere(
        "material.informationsApprovisionnement->>'fournisseurPrincipalId' = :fournisseurId",
        { fournisseurId: criteria.fournisseurId }
      )
    }

    if (criteria.dangereux !== undefined) {
      query.andWhere('material.dangereux = :dangereux', { dangereux: criteria.dangereux })
    }

    if (criteria.obsolete !== undefined) {
      query.andWhere('material.obsolete = :obsolete', { obsolete: criteria.obsolete })
    }

    if (criteria.stockCondition) {
      switch (criteria.stockCondition) {
        case 'rupture':
          query.andWhere('(material.stockPhysique - material.stockReserve) <= 0')
          break
        case 'sous_mini':
          query.andWhere('(material.stockPhysique - material.stockReserve) < material.stockMini')
          break
        case 'normal':
          query.andWhere('(material.stockPhysique - material.stockReserve) >= material.stockMini')
          query.andWhere('(material.stockPhysique - material.stockReserve) <= material.stockMaxi')
          break
        case 'surstock':
          query.andWhere('(material.stockPhysique - material.stockReserve) > material.stockMaxi')
          break
      }
    }

    // Pagination
    if (criteria.limit) {
      query.limit(criteria.limit)
    }

    if (criteria.page && criteria.limit) {
      query.offset((criteria.page - 1) * criteria.limit)
    }

    // Tri
    if (criteria.sortBy) {
      const order = criteria.sortOrder || 'ASC'
      query.orderBy(`material.${criteria.sortBy}`, order)
    }

    return await query.getMany()
  }

  async findByStockCondition(
    condition: 'rupture' | 'sous_mini' | 'normal' | 'surstock'
  ): Promise<Material[]> {
    const query = this.repository.createQueryBuilder('material')

    switch (condition) {
      case 'rupture':
        query.where('(material.stockPhysique - material.stockReserve) <= 0')
        break
      case 'sous_mini':
        query.where('(material.stockPhysique - material.stockReserve) < material.stockMini')
        break
      case 'normal':
        query.where('(material.stockPhysique - material.stockReserve) >= material.stockMini')
        query.andWhere('(material.stockPhysique - material.stockReserve) <= material.stockMaxi')
        break
      case 'surstock':
        query.where('(material.stockPhysique - material.stockReserve) > material.stockMaxi')
        break
    }

    return await query.getMany()
  }

  async hasStockMovements(materialId: string): Promise<boolean> {
    // TODO: Implémenter selon votre logique de mouvements de stock
    return false
  }

  async findWithFilters(filters: MaterialAdvancedFilters): Promise<{
    items: Material[]
    total: number
    page: number
    limit: number
  }> {
    // TODO: Implémenter la recherche avancée avec filtres
    const items = await this.repository.find()
    return {
      items,
      total: items.length,
      page: 1,
      limit: 10,
    }
  }

  async searchByText(searchText: string, limit?: number): Promise<Material[]> {
    const query = this.repository
      .createQueryBuilder('material')
      .where(
        '(material.nom ILIKE :text OR material.reference ILIKE :text OR material.description ILIKE :text)',
        { text: `%${searchText}%` }
      )

    if (limit) {
      query.limit(limit)
    }

    return await query.getMany()
  }

  async getMaterialStats(): Promise<MaterialStatistics> {
    const totalMateriaux = await this.repository.count()

    // Implémentation basique - peut être améliorée avec des requêtes optimisées
    return {
      totalMateriaux,
      repartitionParType: {
        [MaterialType.ACIER]: await this.repository.count({ where: { type: MaterialType.ACIER } }),
        [MaterialType.INOX]: await this.repository.count({ where: { type: MaterialType.INOX } }),
        [MaterialType.ALUMINIUM]: await this.repository.count({
          where: { type: MaterialType.ALUMINIUM },
        }),
        [MaterialType.CUIVRE]: await this.repository.count({
          where: { type: MaterialType.CUIVRE },
        }),
        [MaterialType.FONTE]: await this.repository.count({ where: { type: MaterialType.FONTE } }),
        [MaterialType.BRONZE]: await this.repository.count({
          where: { type: MaterialType.BRONZE },
        }),
        [MaterialType.LAITON]: await this.repository.count({
          where: { type: MaterialType.LAITON },
        }),
        [MaterialType.PLASTIQUE]: await this.repository.count({
          where: { type: MaterialType.PLASTIQUE },
        }),
        [MaterialType.COMPOSITE]: await this.repository.count({
          where: { type: MaterialType.COMPOSITE },
        }),
        [MaterialType.AUTRE]: await this.repository.count({ where: { type: MaterialType.AUTRE } }),
      },
      repartitionParForme: {
        [MaterialShape.PLAQUE]: await this.repository.count({
          where: { forme: MaterialShape.PLAQUE },
        }),
        [MaterialShape.TUBE]: await this.repository.count({ where: { forme: MaterialShape.TUBE } }),
        [MaterialShape.BARRE]: await this.repository.count({
          where: { forme: MaterialShape.BARRE },
        }),
        [MaterialShape.PROFILE]: await this.repository.count({
          where: { forme: MaterialShape.PROFILE },
        }),
        [MaterialShape.TOLE]: await this.repository.count({ where: { forme: MaterialShape.TOLE } }),
        [MaterialShape.FIL]: await this.repository.count({ where: { forme: MaterialShape.FIL } }),
        [MaterialShape.ROND]: await this.repository.count({ where: { forme: MaterialShape.ROND } }),
        [MaterialShape.CARRE]: await this.repository.count({
          where: { forme: MaterialShape.CARRE },
        }),
        [MaterialShape.RECTANGLE]: await this.repository.count({
          where: { forme: MaterialShape.RECTANGLE },
        }),
        [MaterialShape.CORNIERE]: await this.repository.count({
          where: { forme: MaterialShape.CORNIERE },
        }),
        [MaterialShape.U]: await this.repository.count({ where: { forme: MaterialShape.U } }),
        [MaterialShape.T]: await this.repository.count({ where: { forme: MaterialShape.T } }),
        [MaterialShape.AUTRE]: await this.repository.count({
          where: { forme: MaterialShape.AUTRE },
        }),
      },
      repartitionParStatus: {
        [MaterialStatus.ACTIF]: await this.repository.count({
          where: { status: MaterialStatus.ACTIF },
        }),
        [MaterialStatus.INACTIF]: await this.repository.count({
          where: { status: MaterialStatus.INACTIF },
        }),
        [MaterialStatus.OBSOLETE]: await this.repository.count({
          where: { status: MaterialStatus.OBSOLETE },
        }),
        [MaterialStatus.EN_EVALUATION]: await this.repository.count({
          where: { status: MaterialStatus.EN_EVALUATION },
        }),
      },
      repartitionParStockage: {
        [StorageMethod.STANDARD]: await this.repository.count({
          where: { methodeStockage: StorageMethod.STANDARD },
        }),
        [StorageMethod.VERTICAL]: await this.repository.count({
          where: { methodeStockage: StorageMethod.VERTICAL },
        }),
        [StorageMethod.HORIZONTAL]: await this.repository.count({
          where: { methodeStockage: StorageMethod.HORIZONTAL },
        }),
        [StorageMethod.SUSPENDU]: await this.repository.count({
          where: { methodeStockage: StorageMethod.SUSPENDU },
        }),
        [StorageMethod.EMPILE]: await this.repository.count({
          where: { methodeStockage: StorageMethod.EMPILE },
        }),
        [StorageMethod.SEPARATEUR]: await this.repository.count({
          where: { methodeStockage: StorageMethod.SEPARATEUR },
        }),
        [StorageMethod.CONTROLE_HUMIDITE]: await this.repository.count({
          where: { methodeStockage: StorageMethod.CONTROLE_HUMIDITE },
        }),
        [StorageMethod.CONTROLE_TEMPERATURE]: await this.repository.count({
          where: { methodeStockage: StorageMethod.CONTROLE_TEMPERATURE },
        }),
      },
      valeurTotaleStock: 0, // TODO: Calculer la valeur totale
      materialsEnRupture: 0, // TODO: Calculer
      materialsSousStockMini: 0, // TODO: Calculer
      materialsObsoletes: await this.repository.count({ where: { obsolete: true } }),
      materialsDangereux: await this.repository.count({ where: { dangereux: true } }),
      materialsStockageSpecial: 0, // TODO: Calculer
    }
  }

  async findCreatedBetween(dateDebut: Date, dateFin: Date): Promise<Material[]> {
    return await this.repository
      .createQueryBuilder('material')
      .where('material.dateCreationFiche BETWEEN :dateDebut AND :dateFin', { dateDebut, dateFin })
      .getMany()
  }

  async findRecentlyModified(nbJours: number): Promise<Material[]> {
    const date = new Date()
    date.setDate(date.getDate() - nbJours)

    return await this.repository
      .createQueryBuilder('material')
      .where('material.updatedAt > :date', { date })
      .getMany()
  }

  async findByDimensions(
    longueurMin?: number,
    longueurMax?: number,
    largeurMin?: number,
    largeurMax?: number,
    epaisseurMin?: number,
    epaisseurMax?: number
  ): Promise<Material[]> {
    const query = this.repository.createQueryBuilder('material')

    if (longueurMin !== undefined) {
      query.andWhere("CAST(material.dimensions->>'longueur' AS FLOAT) >= :longueurMin", {
        longueurMin,
      })
    }
    if (longueurMax !== undefined) {
      query.andWhere("CAST(material.dimensions->>'longueur' AS FLOAT) <= :longueurMax", {
        longueurMax,
      })
    }
    if (largeurMin !== undefined) {
      query.andWhere("CAST(material.dimensions->>'largeur' AS FLOAT) >= :largeurMin", {
        largeurMin,
      })
    }
    if (largeurMax !== undefined) {
      query.andWhere("CAST(material.dimensions->>'largeur' AS FLOAT) <= :largeurMax", {
        largeurMax,
      })
    }
    if (epaisseurMin !== undefined) {
      query.andWhere("CAST(material.dimensions->>'epaisseur' AS FLOAT) >= :epaisseurMin", {
        epaisseurMin,
      })
    }
    if (epaisseurMax !== undefined) {
      query.andWhere("CAST(material.dimensions->>'epaisseur' AS FLOAT) <= :epaisseurMax", {
        epaisseurMax,
      })
    }

    return await query.getMany()
  }

  async findByPriceRange(prixMin?: number, prixMax?: number): Promise<Material[]> {
    const query = this.repository.createQueryBuilder('material')

    if (prixMin !== undefined) {
      query.andWhere('material.prixUnitaire >= :prixMin', { prixMin })
    }
    if (prixMax !== undefined) {
      query.andWhere('material.prixUnitaire <= :prixMax', { prixMax })
    }

    return await query.getMany()
  }

  async findRequiringSpecialStorage(): Promise<Material[]> {
    return await this.repository
      .createQueryBuilder('material')
      .where('material.methodeStockage != :standard', { standard: StorageMethod.STANDARD })
      .getMany()
  }

  async findHazardousMaterials(): Promise<Material[]> {
    return await this.repository.find({ where: { dangereux: true } })
  }

  async findObsoleteMaterials(): Promise<Material[]> {
    return await this.repository.find({ where: { obsolete: true } })
  }

  async findByCertifications(certifications: string[]): Promise<Material[]> {
    return await this.repository
      .createQueryBuilder('material')
      .where("material.certifications->>'normes' ?| ARRAY[:...certs]", { certs: certifications })
      .getMany()
  }

  async findByStorageMethod(storageMethod: StorageMethod): Promise<Material[]> {
    return await this.repository.find({ where: { methodeStockage: storageMethod } })
  }

  async findByMechanicalProperties(filters: MechanicalPropertiesFilters): Promise<Material[]> {
    const query = this.repository.createQueryBuilder('material')

    if (filters.limiteElastiqueMin !== undefined) {
      query.andWhere(
        "CAST(material.proprietesMecaniques->>'limiteElastique' AS FLOAT) >= :limiteElastiqueMin",
        { limiteElastiqueMin: filters.limiteElastiqueMin }
      )
    }
    if (filters.limiteElastiqueMax !== undefined) {
      query.andWhere(
        "CAST(material.proprietesMecaniques->>'limiteElastique' AS FLOAT) <= :limiteElastiqueMax",
        { limiteElastiqueMax: filters.limiteElastiqueMax }
      )
    }

    // Autres propriétés mécaniques...

    return await query.getMany()
  }

  async findByChemicalComposition(
    element: string,
    minPercentage?: number,
    maxPercentage?: number
  ): Promise<Material[]> {
    const query = this.repository.createQueryBuilder('material')

    if (minPercentage !== undefined) {
      query.andWhere(
        `CAST(material.proprietesChimiques->'composition'->>'${element}' AS FLOAT) >= :minPercentage`,
        { minPercentage }
      )
    }
    if (maxPercentage !== undefined) {
      query.andWhere(
        `CAST(material.proprietesChimiques->'composition'->>'${element}' AS FLOAT) <= :maxPercentage`,
        { maxPercentage }
      )
    }

    return await query.getMany()
  }

  async getStockValuationByType(): Promise<
    Record<MaterialType, { quantite: number; valeur: number }>
  > {
    // TODO: Implémenter avec une requête optimisée
    return {} as Record<MaterialType, { quantite: number; valeur: number }>
  }

  async getStockValuationByShape(): Promise<
    Record<MaterialShape, { quantite: number; valeur: number }>
  > {
    // TODO: Implémenter avec une requête optimisée
    return {} as Record<MaterialShape, { quantite: number; valeur: number }>
  }

  async getRecentStockMovements(materialId: string, limit: number): Promise<any[]> {
    // TODO: Implémenter selon votre système de mouvements
    return []
  }

  async getMostUsedMaterials(
    limit: number,
    periode?: { debut: Date; fin: Date }
  ): Promise<Array<Material & { quantiteUtilisee: number }>> {
    // TODO: Implémenter avec les données d'utilisation
    const materials = await this.repository.find({ take: limit })
    return materials.map((material) => {
      const result = Object.assign(material, { quantiteUtilisee: 0 })
      return result as Material & { quantiteUtilisee: number }
    })
  }

  async getSlowMovingMaterials(nbJoursSansUtilisation: number): Promise<Material[]> {
    const date = new Date()
    date.setDate(date.getDate() - nbJoursSansUtilisation)

    // TODO: Implémenter avec les données de mouvement
    return await this.repository.find()
  }

  async findByStorageLocation(emplacement: string): Promise<Material[]> {
    return await this.repository.find({ where: { emplacement } })
  }

  async findCompatibleMaterials(materialId: string): Promise<Material[]> {
    // TODO: Implémenter la logique de compatibilité
    return await this.repository.find()
  }

  async findAlternativeMaterials(obsoleteMaterialId: string): Promise<Material[]> {
    return await this.repository.find({ where: { remplacePar: obsoleteMaterialId } })
  }

  async findPotentialDuplicates(material: Material): Promise<Material[]> {
    const query = this.repository
      .createQueryBuilder('material')
      .where('material.id != :id', { id: material.id })

    if (material.nom) {
      query.orWhere('material.nom ILIKE :nom', { nom: `%${material.nom}%` })
    }

    if (material.nuance) {
      query.orWhere('material.nuance = :nuance', { nuance: material.nuance })
    }

    return await query.getMany()
  }

  async findByPreferredSuppliers(): Promise<Material[]> {
    // TODO: Implémenter avec la logique de fournisseurs préférés
    return await this.repository.find()
  }

  async findRequiringRestock(): Promise<Array<Material & { quantiteACommander: number }>> {
    const materials = await this.findByStockCondition('sous_mini')
    return materials.map((material) => {
      const result = Object.assign(material, {
        quantiteACommander: material.calculerQuantiteACommander(),
      })
      return result as Material & { quantiteACommander: number }
    })
  }

  async findByHazardClass(hazardClass: string): Promise<Material[]> {
    return await this.repository
      .createQueryBuilder('material')
      .where('material.classeDanger = :hazardClass', { hazardClass })
      .getMany()
  }

  async getUsageStatsByPeriod(
    debut: Date,
    fin: Date
  ): Promise<
    Array<{
      materialId: string
      reference: string
      nom: string
      quantiteEntree: number
      quantiteSortie: number
      quantiteStock: number
      valeurStock: number
    }>
  > {
    // TODO: Implémenter avec les données de mouvement
    return []
  }

  // Méthodes de l'interface IBusinessRepository
  async save(entity: Material): Promise<Material> {
    return await this.repository.save(entity)
  }

  async findBySpecification(spec: any): Promise<Material[]> {
    // Implémentation basique - pourrait être améliorée avec le pattern Specification
    return await this.repository.find()
  }
}
