import { Article } from '@erp/entities'
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import type { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectRepository } from '@nestjs/typeorm'
import type { DataSource, QueryRunner, Repository } from 'typeorm'
import { getErrorMessage } from '../../../core/common/utils/error.utils'
import { StockMovement } from '../entities/stock-movement.entity'
import {
  type IStockMovement,
  type IStockMovementFilters,
  type StockMovementPriority,
  StockMovementStatus,
  StockMovementType,
} from '../interfaces/stock-movement.interface'
import type { StockMovementRepository } from '../repositories/stock-movement.repository'

/**
 * Service de gestion des mouvements de stock
 */
@Injectable()
export class StockMovementService {
  private readonly logger = new Logger(StockMovementService.name)

  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(StockMovement)
    private readonly movementRepository: Repository<StockMovement>,
    private readonly stockMovementRepository: StockMovementRepository,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Créer un mouvement de stock
   */
  async createMovement(
    data: Partial<IStockMovement>,
    options?: {
      validateStock?: boolean
      updateArticle?: boolean
      emitEvent?: boolean
    }
  ): Promise<IStockMovement> {
    const { validateStock = true, updateArticle = true, emitEvent = true } = options || {}

    // Validation de l'article
    const article = await this.articleRepository.findOne({
      where: { id: data.articleId },
    })

    if (!article) {
      throw new NotFoundException(`Article ${data.articleId} non trouvé`)
    }

    // Validation du stock pour les sorties
    if (validateStock && data.type === StockMovementType.SORTIE) {
      const stockPhysique = article.stockPhysique ?? 0
      const quantite = data.quantite ?? 0
      const stockDisponible = stockPhysique - (article.stockReserve ?? 0)
      if (stockDisponible < quantite) {
        throw new BadRequestException(
          `Stock insuffisant. Disponible: ${stockDisponible}, Demandé: ${quantite}`
        )
      }
    }

    // Transaction pour garantir la cohérence
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // Créer le mouvement
      const reference = await this.stockMovementRepository.generateReference(data.type!)
      const stockAvant = article.stockPhysique ?? 0
      const stockApres = this.calculateNewStock(stockAvant, data.quantite ?? 0, data.type!)

      const movement = await this.stockMovementRepository.create({
        ...data,
        reference,
        statut: data.status || StockMovementStatus.EN_ATTENTE,
        stockAvant,
        stockApres,
        tenantId: (data as unknown).tenantId || article.societeId,
        creeParId: data.utilisateurId || 'SYSTEM',
        creeParNom: data.utilisateurNom || 'System',
        motif: data.motif as unknown, // Convert StockMovementReason to StockMovementMotif
      } as Partial<StockMovement>)

      // Mettre à jour l'article si demandé
      if (updateArticle && movement.statut === StockMovementStatus.COMPLETE) {
        await this.updateArticleStock(queryRunner, article, movement.quantite, movement.type)
      }

      await queryRunner.commitTransaction()

      // Émettre l'événement
      if (emitEvent) {
        this.eventEmitter.emit('stock.movement.created', {
          movement,
          articleId: article.id,
          type: movement.type,
        })
      }

      this.logger.log(
        `Mouvement de stock créé: ${movement.reference} - Article: ${article.reference} - Quantité: ${movement.quantite}`
      )

      return this.mapToInterface(movement)
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  }

  /**
   * Traiter un mouvement en attente
   */
  async processMovement(
    movementId: string,
    options?: {
      forceProcess?: boolean
      skipValidation?: boolean
      userId?: string
      userName?: string
    }
  ): Promise<IStockMovement> {
    const movement = await this.stockMovementRepository.findById(movementId)

    if (!movement) {
      throw new NotFoundException(`Mouvement ${movementId} non trouvé`)
    }

    if (movement.statut !== StockMovementStatus.EN_ATTENTE && !options?.forceProcess) {
      throw new BadRequestException(`Le mouvement ${movement.reference} n'est pas en attente`)
    }

    const article = await this.articleRepository.findOne({
      where: { id: movement.articleId },
    })

    if (!article) {
      throw new NotFoundException(`Article ${movement.articleId} non trouvé`)
    }

    // Validation du stock
    if (!options?.skipValidation && movement.type === StockMovementType.SORTIE) {
      const stockDisponible = (article.stockPhysique ?? 0) - (article.stockReserve ?? 0)
      if (stockDisponible < movement.quantite) {
        movement.statut = StockMovementStatus.ANNULE
        movement.notes = 'Stock insuffisant'
        // await this.movementRepository.save(movement);

        throw new BadRequestException(`Stock insuffisant pour le mouvement ${movement.reference}`)
      }
    }

    // Transaction pour le traitement
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // Mettre à jour le stock de l'article
      await this.updateArticleStock(queryRunner, article, movement.quantite, movement.type)

      // Mettre à jour le mouvement
      movement.statut = StockMovementStatus.COMPLETE
      movement.stockApres = this.calculateNewStock(
        article.stockPhysique ?? 0,
        movement.quantite,
        movement.type
      )
      movement.dateTraitement = new Date()
      movement.traiteParId = options?.userId || 'SYSTEM'
      movement.traiteParNom = options?.userName || 'System'

      await this.stockMovementRepository.save(movement)
      await queryRunner.commitTransaction()

      // Émettre l'événement
      this.eventEmitter.emit('stock.movement.processed', {
        movement,
        articleId: article.id,
      })

      this.logger.log(`Mouvement ${movement.reference} traité avec succès`)

      return this.mapToInterface(movement)
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  }

  /**
   * Annuler un mouvement
   */
  async cancelMovement(
    movementId: string,
    motif: string,
    options?: {
      reverseStock?: boolean
      userId?: string
      userName?: string
    }
  ): Promise<IStockMovement> {
    const movement = await this.stockMovementRepository.findById(movementId)

    if (!movement) {
      throw new NotFoundException(`Mouvement ${movementId} non trouvé`)
    }

    if (movement.statut === StockMovementStatus.ANNULE) {
      throw new BadRequestException(`Le mouvement ${movement.reference} est déjà annulé`)
    }

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // Si le mouvement était complété et qu'on veut inverser le stock
      if (movement.statut === StockMovementStatus.COMPLETE && options?.reverseStock) {
        const article = await this.articleRepository.findOne({
          where: { id: movement.articleId },
        })

        if (article) {
          // Inverser le mouvement
          const reverseType =
            movement.type === StockMovementType.ENTREE
              ? StockMovementType.SORTIE
              : StockMovementType.ENTREE

          await this.updateArticleStock(queryRunner, article, movement.quantite, reverseType)
        }
      }

      // Mettre à jour le mouvement
      movement.statut = StockMovementStatus.ANNULE
      movement.motifAnnulation = motif
      movement.annuleParId = options?.userId || 'SYSTEM'
      movement.annuleParNom = options?.userName || 'System'
      movement.dateAnnulation = new Date()
      movement.notes = `Annulé: ${motif}`

      await this.stockMovementRepository.save(movement)
      await queryRunner.commitTransaction()

      // Émettre l'événement
      this.eventEmitter.emit('stock.movement.cancelled', {
        movement,
        motif,
      })

      this.logger.log(`Mouvement ${movement.reference} annulé: ${motif}`)

      return this.mapToInterface(movement)
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  }

  /**
   * Rechercher les mouvements avec filtres
   */
  async findMovements(filters: IStockMovementFilters): Promise<{
    items: StockMovement[]
    total: number
    page: number
    limit: number
  }> {
    return await this.stockMovementRepository.findWithFilters({
      articleIds: filters.articleIds?.[0] ? [filters.articleIds[0]] : undefined, // Use first articleId if available
      types: filters.types,
      status: filters.status,
      motifs: filters.motifs,
      priorite: filters.priorite,
      dateDebut: filters.dateDebut,
      dateFin: filters.dateFin,
      recherche: filters.recherche,
      utilisateurIds: filters.utilisateurIds?.[0] ? [filters.utilisateurIds[0]] : undefined, // Use first utilisateurId if available
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder as 'ASC' | 'DESC',
      page: filters.page || 1,
      limit: filters.limit || 20,
    })
  }

  /**
   * Obtenir l'historique des mouvements d'un article
   */
  async getArticleMovementHistory(
    articleId: string,
    options?: {
      limit?: number
      includeAnnule?: boolean
    }
  ): Promise<StockMovement[]> {
    const status = options?.includeAnnule
      ? undefined
      : [StockMovementStatus.EN_ATTENTE, StockMovementStatus.COMPLETE]

    return await this.stockMovementRepository.findByArticle(articleId, {
      limit: options?.limit,
      status,
    })
  }

  /**
   * Calculer le solde des mouvements pour une période
   */
  async calculatePeriodBalance(
    articleId: string,
    dateDebut: Date,
    dateFin: Date
  ): Promise<{
    entrees: number
    sorties: number
    solde: number
    mouvements: number
  }> {
    const movements = await this.stockMovementRepository.findByArticle(articleId, {
      dateMin: dateDebut,
      dateMax: dateFin,
      status: [StockMovementStatus.COMPLETE],
    })

    const entrees = movements
      .filter((m) => m.isEntree())
      .reduce((sum, m) => sum + Number(m.quantite), 0)

    const sorties = movements
      .filter((m) => m.isSortie())
      .reduce((sum, m) => sum + Number(m.quantite), 0)

    return {
      entrees,
      sorties,
      solde: entrees - sorties,
      mouvements: movements.length,
    }
  }

  /**
   * Obtenir les statistiques de stock pour un article
   */
  async getStockStatistics(articleId: string, period?: { start: Date; end: Date }): Promise<unknown> {
    return await this.stockMovementRepository.getStatsByArticle(articleId, period)
  }

  /**
   * Obtenir l'analyse de stock pour un article
   */
  async getStockAnalysis(articleId: string): Promise<unknown> {
    return await this.stockMovementRepository.getStockAnalysis(articleId)
  }

  /**
   * Obtenir les tendances de mouvements
   */
  async getMovementTrends(
    articleId: string,
    groupBy: 'day' | 'week' | 'month',
    period: { start: Date; end: Date }
  ): Promise<unknown> {
    return await this.stockMovementRepository.getMovementTrends(articleId, groupBy, period)
  }

  /**
   * Obtenir les mouvements en attente
   */
  async getPendingMovements(options?: {
    articleId?: string
    type?: StockMovementType[]
    priorite?: StockMovementPriority[]
    limit?: number
  }): Promise<StockMovement[]> {
    return await this.stockMovementRepository.findPendingMovements(options)
  }

  /**
   * Traiter plusieurs mouvements en batch
   */
  async processBatchMovements(
    movementIds: string[],
    options?: {
      skipValidation?: boolean
      userId?: string
      userName?: string
    }
  ): Promise<{ success: string[]; failed: string[]; errors: Record<string, string> }> {
    const result = {
      success: [] as string[],
      failed: [] as string[],
      errors: {} as Record<string, string>,
    }

    for (const movementId of movementIds) {
      try {
        await this.processMovement(movementId, options)
        result.success.push(movementId)
      } catch (error) {
        result.failed.push(movementId)
        result.errors[movementId] = getErrorMessage(error)
      }
    }

    return result
  }

  /**
   * Méthodes privées
   */
  private async updateArticleStock(
    queryRunner: QueryRunner,
    article: Article,
    quantite: number,
    type: StockMovementType
  ): Promise<void> {
    const newStock = this.calculateNewStock(article.stockPhysique ?? 0, quantite, type)

    await queryRunner.manager.update(
      Article,
      { id: article.id },
      {
        stockPhysique: newStock,
        dateDerniereModification: new Date(),
      }
    )

    // Vérifier les alertes de stock
    if (newStock <= (article.stockMini ?? 0)) {
      this.eventEmitter.emit('stock.alert.minimum', {
        articleId: article.id,
        stockActuel: newStock,
        stockMinimum: article.stockMini ?? 0,
      })
    }

    if (newStock <= 0) {
      this.eventEmitter.emit('stock.alert.rupture', {
        articleId: article.id,
      })
    }
  }

  private calculateNewStock(
    stockActuel: number,
    quantite: number,
    type: StockMovementType
  ): number {
    switch (type) {
      case StockMovementType.ENTREE:
      case StockMovementType.RETOUR:
      case StockMovementType.CORRECTION_POSITIVE:
        return stockActuel + quantite

      case StockMovementType.SORTIE:
      case StockMovementType.CORRECTION_NEGATIVE:
        return Math.max(0, stockActuel - quantite)

      case StockMovementType.INVENTAIRE:
        return quantite // Stock remplacé par la valeur d'inventaire

      default:
        return stockActuel
    }
  }

  /**
   * Récupérer un mouvement par ID
   */
  async getById(id: string): Promise<IStockMovement> {
    const movement = await this.movementRepository.findOne({
      where: { id },
      relations: ['article'],
    })

    if (!movement) {
      throw new NotFoundException(`Mouvement ${id} non trouvé`)
    }

    return this.mapToInterface(movement)
  }

  /**
   * Lister les mouvements avec filtres
   */
  async findWithFilters(filters: IStockMovementFilters): Promise<{
    items: IStockMovement[]
    total: number
    page: number
    limit: number
  }> {
    const result = await this.stockMovementRepository.findWithFilters(filters)

    return {
      ...result,
      items: result.items.map((item) => this.mapToInterface(item)),
    }
  }

  /**
   * Lister tous les mouvements d'un article
   */
  async getAllByArticle(articleId: string): Promise<IStockMovement[]> {
    const movements = await this.movementRepository.find({
      where: { articleId },
      relations: ['article'],
      order: { dateCreation: 'DESC' },
    })

    return movements.map((movement) => this.mapToInterface(movement))
  }

  /**
   * Mapper pour convertir l'entité StockMovement vers l'interface IStockMovement
   */
  private mapToInterface(entity: StockMovement): IStockMovement {
    return {
      id: entity.id,
      reference: entity.reference,
      articleId: entity.articleId,
      articleCode: entity.article?.reference,
      articleLibelle: entity.article?.designation,
      type: entity.type,
      motif: entity.motif as unknown, // Convert StockMovementMotif to StockMovementReason
      quantite: entity.quantite,
      unite: entity.unite || '',
      stockAvant: entity.stockAvant,
      stockApres: entity.stockApres,
      prixUnitaire: entity.coutUnitaire,
      valeurTotale: entity.coutTotal,
      devise: 'EUR', // Default currency
      dateMovement: entity.dateCreation, // Map dateCreation to dateMovement
      numeroLot: entity.numeroLot,
      datePeremption: entity.datePeremption,
      emplacementSource: entity.emplacementSource,
      emplacementDestination: entity.emplacementDestination,
      documentSourceId: entity.documentId,
      typeDocumentSource: entity.documentType,
      numeroDocumentSource: entity.documentReference,
      utilisateurId: entity.creeParId, // Map creeParId to utilisateurId
      utilisateurNom: entity.creeParNom,
      status: entity.statut, // Map statut to status
      notes: entity.notes,
      metadonnees: entity.metadata,
      dateCreation: entity.dateCreation,
      dateModification: entity.dateModification,
      dateValidation: entity.dateTraitement,
      validateurId: entity.traiteParId,
      validateurNom: entity.traiteParNom,
    }
  }
}
