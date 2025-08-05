import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Between, type Repository } from 'typeorm'
import { BTPIndex, BTPIndexType } from '../entities/btp-index.entity'
import {
  CoefficientType,
  SectorCoefficient,
  SectorType,
} from '../entities/sector-coefficient.entity'

export interface IndexedPricingContext {
  basePrice: number
  quantity: number
  indexType: BTPIndexType
  contractDate?: Date // Date du marché/contrat
  deliveryDate?: Date // Date de livraison prévue
  baseIndexValue?: number // Valeur d'indice de base du contrat
  indexationClause?: {
    threshold?: number // Seuil de déclenchement en %
    sharing?: number // Répartition (0-1, 1=100% au client)
    cappingMin?: number // Plafonnement minimum
    cappingMax?: number // Plafonnement maximum
  }
}

export interface IndexedPricingResult {
  basePrice: number
  indexCoefficient: number
  indexedPrice: number
  indexVariation: number
  indexVariationPercent: number
  finalPrice: number
  indexDetails: {
    indexType: BTPIndexType
    baseIndexValue: number
    currentIndexValue: number
    contractDate?: Date
    deliveryDate?: Date
    indexPeriod: string
  }
  indexationClause?: {
    threshold: number
    variation: number
    applicableVariation: number
    sharing: number
    cappedVariation: number
  }
}

@Injectable()
export class BTPIndexService {
  constructor(
    @InjectRepository(BTPIndex, 'tenant')
    private btpIndexRepository: Repository<BTPIndex>,

    @InjectRepository(SectorCoefficient, 'tenant')
    private sectorCoefficientRepository: Repository<SectorCoefficient>
  ) {}

  /**
   * Calculer un prix avec indexation BTP
   */
  async calculateIndexedPrice(
    societeId: string,
    context: IndexedPricingContext
  ): Promise<IndexedPricingResult> {
    // 1. Récupérer l'indice de référence (date de contrat ou actuel)
    const referenceDate = context.contractDate || new Date()
    const baseIndex = await this.getIndexForDate(societeId, context.indexType, referenceDate)

    // 2. Récupérer l'indice de livraison (date de livraison ou actuel)
    const deliveryDate = context.deliveryDate || new Date()
    const currentIndex = await this.getIndexForDate(societeId, context.indexType, deliveryDate)

    if (!baseIndex || !currentIndex) {
      throw new Error(`Indice ${context.indexType} non trouvé pour les dates spécifiées`)
    }

    // 3. Calculer le coefficient d'indexation
    const baseIndexValue = context.baseIndexValue || baseIndex.indexValue
    const indexCoefficient = currentIndex.indexValue / baseIndexValue
    const indexVariation = currentIndex.indexValue - baseIndexValue
    const indexVariationPercent = (indexVariation / baseIndexValue) * 100

    // 4. Appliquer la clause d'indexation si définie
    let applicableVariation = indexVariationPercent
    let cappedVariation = indexVariationPercent
    let finalCoefficient = indexCoefficient

    if (context.indexationClause) {
      const clause = context.indexationClause

      // Seuil de déclenchement
      if (clause.threshold && Math.abs(indexVariationPercent) < clause.threshold) {
        applicableVariation = 0
        finalCoefficient = 1
      } else {
        // Répartition
        if (clause.sharing && clause.sharing < 1) {
          applicableVariation = indexVariationPercent * clause.sharing
          finalCoefficient = 1 + applicableVariation / 100
        }

        // Plafonnement
        if (clause.cappingMin !== undefined && applicableVariation < clause.cappingMin) {
          cappedVariation = clause.cappingMin
          finalCoefficient = 1 + cappedVariation / 100
        }
        if (clause.cappingMax !== undefined && applicableVariation > clause.cappingMax) {
          cappedVariation = clause.cappingMax
          finalCoefficient = 1 + cappedVariation / 100
        }
      }
    }

    // 5. Calculer les prix
    const indexedPrice = context.basePrice * indexCoefficient
    const finalPrice = context.basePrice * finalCoefficient

    return {
      basePrice: context.basePrice,
      indexCoefficient,
      indexedPrice,
      indexVariation,
      indexVariationPercent,
      finalPrice,
      indexDetails: {
        indexType: context.indexType,
        baseIndexValue,
        currentIndexValue: currentIndex.indexValue,
        contractDate: context.contractDate,
        deliveryDate: context.deliveryDate,
        indexPeriod: currentIndex.getFormattedPeriod(),
      },
      indexationClause: context.indexationClause
        ? {
            threshold: context.indexationClause.threshold || 0,
            variation: indexVariationPercent,
            applicableVariation,
            sharing: context.indexationClause.sharing || 1,
            cappedVariation,
          }
        : undefined,
    }
  }

  /**
   * Obtenir l'indice pour une date donnée
   */
  async getIndexForDate(
    societeId: string,
    indexType: BTPIndexType,
    date: Date
  ): Promise<BTPIndex | null> {
    const year = date.getFullYear()
    const month = date.getMonth() + 1

    // Chercher l'indice exact
    let index = await this.btpIndexRepository.findOne({
      where: {
        societeId,
        indexType,
        year,
        month,
        isOfficial: true,
      },
      order: { publicationDate: 'DESC' },
    })

    // Si pas trouvé, chercher le mois précédent
    if (!index) {
      const prevMonth = month === 1 ? 12 : month - 1
      const prevYear = month === 1 ? year - 1 : year

      index = await this.btpIndexRepository.findOne({
        where: {
          societeId,
          indexType,
          year: prevYear,
          month: prevMonth,
          isOfficial: true,
        },
        order: { publicationDate: 'DESC' },
      })
    }

    return index
  }

  /**
   * Obtenir le dernier indice publié
   */
  async getLatestIndex(societeId: string, indexType: BTPIndexType): Promise<BTPIndex | null> {
    return await this.btpIndexRepository.findOne({
      where: {
        societeId,
        indexType,
        isOfficial: true,
      },
      order: {
        year: 'DESC',
        month: 'DESC',
        publicationDate: 'DESC',
      },
    })
  }

  /**
   * Créer ou mettre à jour un indice
   */
  async createOrUpdateIndex(data: {
    societeId: string
    indexType: BTPIndexType
    indexName: string
    indexCode: string
    year: number
    month: number
    indexValue: number
    publicationDate: Date
    applicationDate: Date
    isOfficial?: boolean
    isProvisional?: boolean
    indexMetadata?: any
    metadata?: any
  }): Promise<BTPIndex> {
    // Vérifier si l'indice existe déjà
    const existing = await this.btpIndexRepository.findOne({
      where: {
        societeId: data.societeId,
        indexType: data.indexType,
        year: data.year,
        month: data.month,
      },
    })

    let index: BTPIndex

    if (existing) {
      // Mettre à jour
      const oldValue = existing.indexValue
      Object.assign(existing, data)

      // Ajouter une révision si la valeur change
      if (oldValue !== data.indexValue) {
        existing.addRevision(oldValue, data.indexValue, 'Mise à jour officielle')
      }

      index = await this.btpIndexRepository.save(existing)
    } else {
      // Créer nouveau
      index = this.btpIndexRepository.create(data)
      index = await this.btpIndexRepository.save(index)
    }

    // Calculer les variations
    await this.calculateVariations(index)

    return index
  }

  /**
   * Calculer les variations mensuelles et annuelles
   */
  private async calculateVariations(index: BTPIndex): Promise<void> {
    // Variation mensuelle
    const prevMonthIndex = await this.btpIndexRepository.findOne({
      where: {
        societeId: index.societeId,
        indexType: index.indexType,
        year: index.month === 1 ? index.year - 1 : index.year,
        month: index.month === 1 ? 12 : index.month - 1,
        isOfficial: true,
      },
    })

    if (prevMonthIndex) {
      index.previousValue = prevMonthIndex.indexValue
      index.monthlyVariation =
        ((index.indexValue - prevMonthIndex.indexValue) / prevMonthIndex.indexValue) * 100
    }

    // Variation annuelle
    const prevYearIndex = await this.btpIndexRepository.findOne({
      where: {
        societeId: index.societeId,
        indexType: index.indexType,
        year: index.year - 1,
        month: index.month,
        isOfficial: true,
      },
    })

    if (prevYearIndex) {
      index.yearlyVariation =
        ((index.indexValue - prevYearIndex.indexValue) / prevYearIndex.indexValue) * 100
    }

    // Alertes automatiques
    if (index.hasSignificantVariation(5)) {
      index.addAlert(
        'high_variation',
        `Variation importante détectée: ${index.monthlyVariation?.toFixed(2)}% (mensuelle), ${index.yearlyVariation?.toFixed(2)}% (annuelle)`,
        'warning'
      )
    }

    await this.btpIndexRepository.save(index)
  }

  /**
   * Obtenir l'historique d'un indice
   */
  async getIndexHistory(
    societeId: string,
    indexType: BTPIndexType,
    fromDate: Date,
    toDate: Date
  ): Promise<BTPIndex[]> {
    return await this.btpIndexRepository.find({
      where: {
        societeId,
        indexType,
        isOfficial: true,
        publicationDate: Between(fromDate, toDate),
      },
      order: {
        year: 'ASC',
        month: 'ASC',
      },
    })
  }

  /**
   * Créer des indices BTP par défaut pour test
   */
  async createDefaultBTPIndices(societeId: string): Promise<BTPIndex[]> {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1

    const defaultIndices = [
      {
        indexType: BTPIndexType.ACIER_BTP,
        indexName: 'Indice BTP - Acier',
        indexCode: 'ACIER_BTP',
        indexValue: 125.4,
        indexMetadata: {
          source: 'INSEE',
          methodology: 'Prix de marché acier construction',
          baseYear: 2015,
          frequency: 'monthly' as const,
        },
      },
      {
        indexType: BTPIndexType.BT01,
        indexName: 'Indice BT01 - Gros œuvre',
        indexCode: 'BT01',
        indexValue: 118.75,
        indexMetadata: {
          source: 'FFB',
          methodology: 'Coûts gros œuvre bâtiment',
          baseYear: 2015,
          frequency: 'monthly' as const,
        },
      },
      {
        indexType: BTPIndexType.TP01A,
        indexName: 'Indice TP01A - Terrassements',
        indexCode: 'TP01A',
        indexValue: 122.3,
        indexMetadata: {
          source: 'INSEE',
          methodology: 'Coûts terrassements généraux',
          baseYear: 2015,
          frequency: 'monthly' as const,
        },
      },
    ]

    const createdIndices: BTPIndex[] = []

    for (const indexData of defaultIndices) {
      const index = await this.createOrUpdateIndex({
        societeId,
        ...indexData,
        year: currentYear,
        month: currentMonth,
        publicationDate: new Date(),
        applicationDate: new Date(),
        isOfficial: true,
        isProvisional: false,
      })

      createdIndices.push(index)
    }

    return createdIndices
  }

  /**
   * Obtenir tous les types d'indices disponibles
   */
  getAvailableIndexTypes(): Array<{ value: BTPIndexType; label: string; category: string }> {
    return [
      // Indices matériaux
      { value: BTPIndexType.ACIER_BTP, label: 'Acier BTP', category: 'Matériaux' },
      { value: BTPIndexType.BETON, label: 'Béton', category: 'Matériaux' },
      { value: BTPIndexType.BITUME, label: 'Bitume', category: 'Matériaux' },
      { value: BTPIndexType.CARBURANT, label: 'Carburant', category: 'Matériaux' },

      // Indices bâtiment
      { value: BTPIndexType.BT01, label: 'BT01 - Gros œuvre', category: 'Bâtiment' },
      { value: BTPIndexType.BT02, label: 'BT02 - Clos et couvert', category: 'Bâtiment' },
      { value: BTPIndexType.BT03, label: 'BT03 - Second œuvre', category: 'Bâtiment' },
      { value: BTPIndexType.BT04, label: "BT04 - Corps d'état techniques", category: 'Bâtiment' },
      { value: BTPIndexType.BT05, label: 'BT05 - Finitions', category: 'Bâtiment' },
      { value: BTPIndexType.BT06, label: 'BT06 - Équipements', category: 'Bâtiment' },

      // Indices travaux publics
      {
        value: BTPIndexType.TP01A,
        label: 'TP01A - Terrassements généraux',
        category: 'Travaux Publics',
      },
      {
        value: BTPIndexType.TP02A,
        label: 'TP02A - Assainissement et VRD',
        category: 'Travaux Publics',
      },
      {
        value: BTPIndexType.TP03A,
        label: 'TP03A - Construction de chaussées',
        category: 'Travaux Publics',
      },
      { value: BTPIndexType.TP04A, label: "TP04A - Ouvrages d'art", category: 'Travaux Publics' },
    ]
  }
}
