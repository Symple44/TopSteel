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
    await this.repository.update(id, entity as unknown)
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
    // Vérifier s'il existe des mouvements de stock pour ce matériau
    const count = await this.repository.manager
      .createQueryBuilder('material_movements', 'movement')
      .where('movement.materialId = :materialId', { materialId })
      .andWhere('movement.status != :status', { status: 'ANNULE' })
      .getCount()

    return count > 0
  }

  async findWithFilters(filters: MaterialAdvancedFilters): Promise<{
    items: Material[]
    total: number
    page: number
    limit: number
  }> {
    const query = this.repository.createQueryBuilder('material')

    // Filtres de base
    if (filters.types?.length) {
      query.andWhere('material.type IN (:...types)', { types: filters.types })
    }

    if (filters.formes?.length) {
      query.andWhere('material.forme IN (:...formes)', { formes: filters.formes })
    }

    if (filters.status?.length) {
      query.andWhere('material.status IN (:...status)', { status: filters.status })
    }

    if (filters.nuances?.length) {
      query.andWhere('material.nuance IN (:...nuances)', { nuances: filters.nuances })
    }

    // Filtres de stock
    if (filters.stock) {
      if (filters.stock.min !== undefined) {
        query.andWhere('material.stockPhysique >= :stockMin', { stockMin: filters.stock.min })
      }
      if (filters.stock.max !== undefined) {
        query.andWhere('material.stockPhysique <= :stockMax', { stockMax: filters.stock.max })
      }
      if (filters.stock.disponible !== undefined) {
        query.andWhere('(material.stockPhysique - COALESCE(material.stockReserve, 0)) >= :disponible', {
          disponible: filters.stock.disponible
        })
      }
      if (filters.stock.enRupture === true) {
        query.andWhere('material.stockPhysique <= 0')
      }
      if (filters.stock.sousStockMinimum === true) {
        query.andWhere('material.stockPhysique < material.stockMini')
        query.andWhere('material.stockPhysique > 0')
      }
    }

    // Filtres de prix
    if (filters.prix) {
      if (filters.prix.min !== undefined) {
        query.andWhere('material.prixUnitaire >= :prixMin', { prixMin: filters.prix.min })
      }
      if (filters.prix.max !== undefined) {
        query.andWhere('material.prixUnitaire <= :prixMax', { prixMax: filters.prix.max })
      }
    }

    // Filtres de dimensions
    if (filters.dimensions) {
      if (filters.dimensions.longueurMin !== undefined) {
        query.andWhere("CAST(material.dimensions->>'longueur' AS FLOAT) >= :longueurMin", {
          longueurMin: filters.dimensions.longueurMin
        })
      }
      if (filters.dimensions.longueurMax !== undefined) {
        query.andWhere("CAST(material.dimensions->>'longueur' AS FLOAT) <= :longueurMax", {
          longueurMax: filters.dimensions.longueurMax
        })
      }
      if (filters.dimensions.largeurMin !== undefined) {
        query.andWhere("CAST(material.dimensions->>'largeur' AS FLOAT) >= :largeurMin", {
          largeurMin: filters.dimensions.largeurMin
        })
      }
      if (filters.dimensions.largeurMax !== undefined) {
        query.andWhere("CAST(material.dimensions->>'largeur' AS FLOAT) <= :largeurMax", {
          largeurMax: filters.dimensions.largeurMax
        })
      }
      if (filters.dimensions.epaisseurMin !== undefined) {
        query.andWhere("CAST(material.dimensions->>'epaisseur' AS FLOAT) >= :epaisseurMin", {
          epaisseurMin: filters.dimensions.epaisseurMin
        })
      }
      if (filters.dimensions.epaisseurMax !== undefined) {
        query.andWhere("CAST(material.dimensions->>'epaisseur' AS FLOAT) <= :epaisseurMax", {
          epaisseurMax: filters.dimensions.epaisseurMax
        })
      }
      if (filters.dimensions.diametreMin !== undefined) {
        query.andWhere("CAST(material.dimensions->>'diametre' AS FLOAT) >= :diametreMin", {
          diametreMin: filters.dimensions.diametreMin
        })
      }
      if (filters.dimensions.diametreMax !== undefined) {
        query.andWhere("CAST(material.dimensions->>'diametre' AS FLOAT) <= :diametreMax", {
          diametreMax: filters.dimensions.diametreMax
        })
      }
    }

    // Filtres de poids
    if (filters.poids) {
      if (filters.poids.min !== undefined) {
        query.andWhere('material.poidsUnitaire >= :poidsMin', { poidsMin: filters.poids.min })
      }
      if (filters.poids.max !== undefined) {
        query.andWhere('material.poidsUnitaire <= :poidsMax', { poidsMax: filters.poids.max })
      }
    }

    // Filtres mécaniques
    if (filters.proprietesMecaniques) {
      if (filters.proprietesMecaniques.resistanceMin !== undefined) {
        query.andWhere("CAST(material.proprietesMecaniques->>'resistanceTraction' AS FLOAT) >= :resistanceMin", {
          resistanceMin: filters.proprietesMecaniques.resistanceMin
        })
      }
      if (filters.proprietesMecaniques.resistanceMax !== undefined) {
        query.andWhere("CAST(material.proprietesMecaniques->>'resistanceTraction' AS FLOAT) <= :resistanceMax", {
          resistanceMax: filters.proprietesMecaniques.resistanceMax
        })
      }
      if (filters.proprietesMecaniques.dureteMin !== undefined) {
        query.andWhere("CAST(material.proprietesMecaniques->>'durete' AS FLOAT) >= :dureteMin", {
          dureteMin: filters.proprietesMecaniques.dureteMin
        })
      }
      if (filters.proprietesMecaniques.dureteMax !== undefined) {
        query.andWhere("CAST(material.proprietesMecaniques->>'durete' AS FLOAT) <= :dureteMax", {
          dureteMax: filters.proprietesMecaniques.dureteMax
        })
      }
      if (filters.proprietesMecaniques.limiteElastiqueMin !== undefined) {
        query.andWhere("CAST(material.proprietesMecaniques->>'limiteElastique' AS FLOAT) >= :limiteElastiqueMin", {
          limiteElastiqueMin: filters.proprietesMecaniques.limiteElastiqueMin
        })
      }
    }

    // Filtres physiques
    if (filters.proprietesPhysiques) {
      if (filters.proprietesPhysiques.densiteMin !== undefined) {
        query.andWhere('material.densite >= :densiteMin', { 
          densiteMin: filters.proprietesPhysiques.densiteMin 
        })
      }
      if (filters.proprietesPhysiques.densiteMax !== undefined) {
        query.andWhere('material.densite <= :densiteMax', { 
          densiteMax: filters.proprietesPhysiques.densiteMax 
        })
      }
      if (filters.proprietesPhysiques.temperatureFusionMin !== undefined) {
        query.andWhere("CAST(material.proprietesPhysiques->>'temperatureFusion' AS FLOAT) >= :tempFusionMin", {
          tempFusionMin: filters.proprietesPhysiques.temperatureFusionMin
        })
      }
      if (filters.proprietesPhysiques.temperatureFusionMax !== undefined) {
        query.andWhere("CAST(material.proprietesPhysiques->>'temperatureFusion' AS FLOAT) <= :tempFusionMax", {
          tempFusionMax: filters.proprietesPhysiques.temperatureFusionMax
        })
      }
    }

    // Filtres chimiques
    if (filters.proprietesChimiques) {
      if (filters.proprietesChimiques.resistanceCorrosion !== undefined) {
        query.andWhere("material.proprietesChimiques->>'resistanceCorrosion' = :resistanceCorrosion", {
          resistanceCorrosion: filters.proprietesChimiques.resistanceCorrosion
        })
      }
      if (filters.proprietesChimiques.traitementSurface?.length) {
        query.andWhere("material.proprietesChimiques->>'traitementSurface' IN (:...traitements)", {
          traitements: filters.proprietesChimiques.traitementSurface
        })
      }
    }

    // Filtres par fournisseurs
    if (filters.fournisseurs?.length) {
      query.andWhere("material.informationsApprovisionnement->>'fournisseurPrincipalId' IN (:...fournisseurs)", {
        fournisseurs: filters.fournisseurs
      })
    }

    // Filtre par certifications
    if (filters.certifications?.length) {
      query.andWhere("material.conformiteNormes->>'certifications' ?| ARRAY[:...certs]", {
        certs: filters.certifications
      })
    }

    // Filtre par stockage spécial
    if (filters.stockageSpecial === true) {
      query.andWhere(
        "material.methodeStockage IN (:...methodes)",
        { 
          methodes: [
            StorageMethod.CONTROLE_HUMIDITE,
            StorageMethod.CONTROLE_TEMPERATURE,
            StorageMethod.SUSPENDU
          ]
        }
      )
    }

    // Filtres booléens
    if (filters.dangereux !== undefined) {
      query.andWhere('material.dangereux = :dangereux', { dangereux: filters.dangereux })
    }

    if (filters.obsolete !== undefined) {
      query.andWhere('material.obsolete = :obsolete', { obsolete: filters.obsolete })
    }

    // Recherche textuelle
    if (filters.recherche) {
      query.andWhere(
        '(material.nom ILIKE :search OR material.reference ILIKE :search OR material.description ILIKE :search OR material.nuance ILIKE :search)',
        { search: `%${filters.recherche}%` }
      )
    }

    // Tri
    const sortField = filters.tri?.champ || 'reference'
    const sortOrder = filters.tri?.ordre || 'ASC'
    query.orderBy(`material.${sortField}`, sortOrder)

    // Pagination
    const page = filters.pagination?.page || 1
    const limit = filters.pagination?.limite || 20
    const skip = (page - 1) * limit

    query.skip(skip).take(limit)

    // Exécution
    const [items, total] = await query.getManyAndCount()

    return {
      items,
      total,
      page,
      limit
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
    // Requête optimisée pour récupérer toutes les statistiques en une seule fois
    const [
      totalMateriaux,
      typeStats,
      formeStats,
      statusStats,
      stockageStats,
      valeurTotaleStock,
      materialsEnRupture,
      materialsSousStockMini,
      materialsObsoletes,
      materialsDangereux,
      materialsStockageSpecial
    ] = await Promise.all([
      // Total des matériaux
      this.repository.count(),
      
      // Répartition par type
      this.repository
        .createQueryBuilder('material')
        .select('material.type', 'type')
        .addSelect('COUNT(*)', 'count')
        .groupBy('material.type')
        .getRawMany(),
      
      // Répartition par forme
      this.repository
        .createQueryBuilder('material')
        .select('material.forme', 'forme')
        .addSelect('COUNT(*)', 'count')
        .groupBy('material.forme')
        .getRawMany(),
      
      // Répartition par status
      this.repository
        .createQueryBuilder('material')
        .select('material.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('material.status')
        .getRawMany(),
      
      // Répartition par méthode de stockage
      this.repository
        .createQueryBuilder('material')
        .select('material.methodeStockage', 'methodeStockage')
        .addSelect('COUNT(*)', 'count')
        .groupBy('material.methodeStockage')
        .getRawMany(),
      
      // Valeur totale du stock
      this.calculateTotalStockValue(),
      
      // Matériaux en rupture
      this.countMaterialsEnRupture(),
      
      // Matériaux sous stock minimum
      this.countMaterialsSousStockMinimum(),
      
      // Matériaux obsolètes
      this.repository.count({ where: { obsolete: true } }),
      
      // Matériaux dangereux
      this.repository.count({ where: { dangereux: true } }),
      
      // Matériaux nécessitant un stockage spécial
      this.countMaterialsStockageSpecial()
    ])

    // Construire les objets de répartition
    const repartitionParType: Record<MaterialType, number> = {} as any
    Object.values(MaterialType).forEach(type => {
      repartitionParType[type] = 0
    })
    typeStats.forEach((stat) => {
      repartitionParType[stat.type] = parseInt(stat.count)
    })

    const repartitionParForme: Record<MaterialShape, number> = {} as any
    Object.values(MaterialShape).forEach(forme => {
      repartitionParForme[forme] = 0
    })
    formeStats.forEach((stat) => {
      repartitionParForme[stat.forme] = parseInt(stat.count)
    })

    const repartitionParStatus: Record<MaterialStatus, number> = {} as any
    Object.values(MaterialStatus).forEach(status => {
      repartitionParStatus[status] = 0
    })
    statusStats.forEach((stat) => {
      repartitionParStatus[stat.status] = parseInt(stat.count)
    })

    const repartitionParStockage: Record<StorageMethod, number> = {} as any
    Object.values(StorageMethod).forEach(method => {
      repartitionParStockage[method] = 0
    })
    stockageStats.forEach((stat) => {
      repartitionParStockage[stat.methodeStockage] = parseInt(stat.count)
    })

    return {
      totalMateriaux,
      repartitionParType,
      repartitionParForme,
      repartitionParStatus,
      repartitionParStockage,
      valeurTotaleStock,
      materialsEnRupture,
      materialsSousStockMini,
      materialsObsoletes,
      materialsDangereux,
      materialsStockageSpecial
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
    const result = await this.repository
      .createQueryBuilder('material')
      .select('material.type', 'type')
      .addSelect('SUM(material.stockPhysique)', 'quantite')
      .addSelect('SUM(material.stockPhysique * material.prixUnitaire)', 'valeur')
      .where('material.status = :status', { status: MaterialStatus.ACTIF })
      .andWhere('material.obsolete = :obsolete', { obsolete: false })
      .groupBy('material.type')
      .getRawMany()

    const valuation: Record<MaterialType, { quantite: number; valeur: number }> = {} as any

    // Initialiser avec 0 pour tous les types
    Object.values(MaterialType).forEach(type => {
      valuation[type] = { quantite: 0, valeur: 0 }
    })

    // Remplir avec les données réelles
    result.forEach((row) => {
      valuation[row.type] = {
        quantite: parseFloat(row.quantite || '0'),
        valeur: parseFloat(row.valeur || '0')
      }
    })

    return valuation
  }

  async getStockValuationByShape(): Promise<
    Record<MaterialShape, { quantite: number; valeur: number }>
  > {
    const result = await this.repository
      .createQueryBuilder('material')
      .select('material.forme', 'forme')
      .addSelect('SUM(material.stockPhysique)', 'quantite')
      .addSelect('SUM(material.stockPhysique * material.prixUnitaire)', 'valeur')
      .where('material.status = :status', { status: MaterialStatus.ACTIF })
      .andWhere('material.obsolete = :obsolete', { obsolete: false })
      .groupBy('material.forme')
      .getRawMany()

    const valuation: Record<MaterialShape, { quantite: number; valeur: number }> = {} as any

    // Initialiser avec 0 pour toutes les formes
    Object.values(MaterialShape).forEach(shape => {
      valuation[shape] = { quantite: 0, valeur: 0 }
    })

    // Remplir avec les données réelles
    result.forEach((row) => {
      valuation[row.forme] = {
        quantite: parseFloat(row.quantite || '0'),
        valeur: parseFloat(row.valeur || '0')
      }
    })

    return valuation
  }

  async getRecentStockMovements(
    materialId: string,
    limit: number = 10
  ): Promise<Record<string, unknown>[]> {
    // Note: Cette méthode devra être mise à jour quand l'entité MaterialMovement sera créée
    const movements = await this.repository.manager
      .createQueryBuilder('material_movements', 'movement')
      .where('movement.materialId = :materialId', { materialId })
      .andWhere('movement.status != :status', { status: 'ANNULE' })
      .orderBy('movement.dateCreation', 'DESC')
      .limit(limit)
      .getRawMany()

    return movements.map(movement => ({
      id: movement.movement_id,
      type: movement.movement_type,
      quantite: movement.movement_quantite,
      date: movement.movement_dateCreation,
      reference: movement.movement_reference,
      motif: movement.movement_motif,
      stockAvant: movement.movement_stockAvant,
      stockApres: movement.movement_stockApres
    }))
  }

  async getMostUsedMaterials(
    limit: number,
    periode?: { debut: Date; fin: Date }
  ): Promise<Array<Material & { quantiteUtilisee: number }>> {
    let subQuery = '(SELECT "materialId", SUM(quantite) as total_usage FROM material_movements WHERE type IN (\'SORTIE\', \'TRANSFERT\') AND status = \'COMPLETE\''
    
    if (periode) {
      subQuery += ' AND "dateCreation" BETWEEN :debut AND :fin'
    }
    
    subQuery += ' GROUP BY "materialId")'
    
    const query = this.repository
      .createQueryBuilder('material')
      .leftJoin(
        subQuery,
        'usage',
        'usage."materialId" = material.id'
      )
      .addSelect('COALESCE(usage.total_usage, 0)', 'quantiteUtilisee')
      .where('material.status = :status', { status: MaterialStatus.ACTIF })
      .orderBy('quantiteUtilisee', 'DESC')
      .limit(limit)

    if (periode) {
      query.setParameters({ debut: periode.debut, fin: periode.fin })
    }

    const results = await query.getRawAndEntities()
    
    return results.entities.map((material, index) => {
      const quantiteUtilisee = parseFloat(results.raw[index]?.quantiteUtilisee || '0')
      return Object.assign(material, { quantiteUtilisee }) as Material & { quantiteUtilisee: number }
    })
  }

  async getSlowMovingMaterials(nbJoursSansUtilisation: number): Promise<Material[]> {
    const date = new Date()
    date.setDate(date.getDate() - nbJoursSansUtilisation)

    // Trouver les matériaux sans mouvement depuis X jours
    const query = this.repository
      .createQueryBuilder('material')
      .leftJoin(
        '(SELECT DISTINCT "materialId" FROM material_movements WHERE "dateCreation" > :date AND status = \'COMPLETE\')',
        'recent_movements',
        'recent_movements."materialId" = material.id'
      )
      .where('material.status = :status', { status: MaterialStatus.ACTIF })
      .andWhere('material.stockPhysique > 0')
      .andWhere('recent_movements."materialId" IS NULL')
      .setParameter('date', date)

    return await query.getMany()
  }

  async findByStorageLocation(emplacement: string): Promise<Material[]> {
    return await this.repository.find({ where: { emplacement } })
  }

  async findCompatibleMaterials(materialId: string): Promise<Material[]> {
    // Trouver le matériau de référence
    const material = await this.repository.findOne({ where: { id: materialId } })
    if (!material) return []

    // Trouver les matériaux compatibles basés sur plusieurs critères
    const query = this.repository
      .createQueryBuilder('material')
      .where('material.id != :materialId', { materialId })
      .andWhere('material.status = :status', { status: MaterialStatus.ACTIF })
      .andWhere('material.obsolete = :obsolete', { obsolete: false })

    // Compatibilité par type et forme
    query.andWhere('(material.type = :type OR material.forme = :forme)', {
      type: material.type,
      forme: material.forme
    })

    // Exclure les matériaux avec des incompatibilités connues
    if (material.dangereux) {
      query.andWhere('material.dangereux = :dangereux', { dangereux: true })
    }

    // Méthode de stockage compatible
    if (material.methodeStockage !== StorageMethod.STANDARD) {
      query.andWhere('material.methodeStockage = :methodeStockage', {
        methodeStockage: material.methodeStockage
      })
    }

    return await query.getMany()
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
    // Trouver les matériaux des fournisseurs marqués comme préférés
    return await this.repository
      .createQueryBuilder('material')
      .where("material.informationsApprovisionnement->>'fournisseurPrefere' = 'true'")
      .andWhere('material.status = :status', { status: MaterialStatus.ACTIF })
      .andWhere('material.obsolete = :obsolete', { obsolete: false })
      .orderBy('material.reference', 'ASC')
      .getMany()
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
    const materials = await this.repository
      .createQueryBuilder('material')
      .where('material.status = :status', { status: MaterialStatus.ACTIF })
      .getMany()

    const stats = await Promise.all(
      materials.map(async (material) => {
        // Calculer les entrées
        const entrees = await this.repository.manager
          .createQueryBuilder('material_movements', 'movement')
          .select('SUM(movement.quantite)', 'total')
          .where('movement.materialId = :materialId', { materialId: material.id })
          .andWhere('movement.type IN (:...types)', { types: ['ENTREE', 'RETOUR', 'CORRECTION_POSITIVE'] })
          .andWhere('movement.dateCreation BETWEEN :debut AND :fin', { debut, fin })
          .andWhere('movement.status = :status', { status: 'COMPLETE' })
          .getRawOne()

        // Calculer les sorties
        const sorties = await this.repository.manager
          .createQueryBuilder('material_movements', 'movement')
          .select('SUM(movement.quantite)', 'total')
          .where('movement.materialId = :materialId', { materialId: material.id })
          .andWhere('movement.type IN (:...types)', { types: ['SORTIE', 'TRANSFERT', 'CORRECTION_NEGATIVE'] })
          .andWhere('movement.dateCreation BETWEEN :debut AND :fin', { debut, fin })
          .andWhere('movement.status = :status', { status: 'COMPLETE' })
          .getRawOne()

        return {
          materialId: material.id,
          reference: material.reference,
          nom: material.nom,
          quantiteEntree: parseFloat(entrees?.total || '0'),
          quantiteSortie: parseFloat(sorties?.total || '0'),
          quantiteStock: material.stockPhysique || 0,
          valeurStock: (material.stockPhysique || 0) * (material.prixUnitaire || 0)
        }
      })
    )

    // Filtrer pour ne garder que les matériaux avec des mouvements
    return stats.filter(s => s.quantiteEntree > 0 || s.quantiteSortie > 0)
  }

  // Méthodes de l'interface IBusinessRepository
  async save(entity: Material): Promise<Material> {
    return await this.repository.save(entity)
  }

  async findBySpecification(_spec: any): Promise<Material[]> {
    // Implémentation basique - pourrait être améliorée avec le pattern Specification
    return await this.repository.find()
  }

  /**
   * Méthodes privées helper
   */
  private async calculateTotalStockValue(): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('material')
      .select('SUM(material.stockPhysique * material.prixUnitaire)', 'total')
      .getRawOne()

    return parseFloat(result?.total || '0')
  }

  private async countMaterialsEnRupture(): Promise<number> {
    return await this.repository
      .createQueryBuilder('material')
      .where('material.stockPhysique <= 0')
      .andWhere('material.status = :status', { status: MaterialStatus.ACTIF })
      .getCount()
  }

  private async countMaterialsSousStockMinimum(): Promise<number> {
    return await this.repository
      .createQueryBuilder('material')
      .where('material.stockPhysique > 0')
      .where('material.stockPhysique < material.stockMini')
      .andWhere('material.status = :status', { status: MaterialStatus.ACTIF })
      .getCount()
  }

  private async countMaterialsStockageSpecial(): Promise<number> {
    return await this.repository
      .createQueryBuilder('material')
      .where('material.methodeStockage IN (:...methodes)', {
        methodes: [
          StorageMethod.CONTROLE_HUMIDITE,
          StorageMethod.CONTROLE_TEMPERATURE,
          StorageMethod.SUSPENDU
        ]
      })
      .getCount()
  }
}
