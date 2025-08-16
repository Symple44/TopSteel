import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner, In, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Article } from '@erp/entities';
import { 
  IStockMovement, 
  IStockMovementFilters,
  StockMovementType,
  StockMovementStatus,
  StockMovementPriority
} from '../interfaces/stock-movement.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Service de gestion des mouvements de stock
 */
@Injectable()
export class StockMovementService {
  private readonly logger = new Logger(StockMovementService.name);

  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2
  ) {
    // TODO: Add StockMovement repository when entity is created
  }

  /**
   * Créer un mouvement de stock
   */
  async createMovement(
    data: Partial<IStockMovement>,
    options?: { 
      validateStock?: boolean;
      updateArticle?: boolean;
      emitEvent?: boolean;
    }
  ): Promise<IStockMovement> {
    const { validateStock = true, updateArticle = true, emitEvent = true } = options || {};

    // Validation de l'article
    const article = await this.articleRepository.findOne({
      where: { id: data.articleId }
    });

    if (!article) {
      throw new NotFoundException(`Article ${data.articleId} non trouvé`);
    }

    // Validation du stock pour les sorties
    if (validateStock && data.type === StockMovementType.SORTIE) {
      const stockDisponible = article.stockPhysique - (article.stockReserve || 0);
      if (stockDisponible < data.quantite) {
        throw new BadRequestException(
          `Stock insuffisant. Disponible: ${stockDisponible}, Demandé: ${data.quantite}`
        );
      }
    }

    // Transaction pour garantir la cohérence
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Créer le mouvement
      // TODO: Save to StockMovement table when entity is created
      const movement = {
        ...data,
        id: 'temp-' + Date.now(),
        status: data.status || StockMovementStatus.EN_ATTENTE,
        dateCreation: new Date(),
        reference: await this.generateReference(data.type),
        // Calculer le nouveau stock
        stockAvant: article.stockPhysique,
        stockApres: this.calculateNewStock(article.stockPhysique, data.quantite, data.type)
      } as IStockMovement;

      // Mettre à jour l'article si demandé
      if (updateArticle && movement.status === StockMovementStatus.COMPLETE) {
        await this.updateArticleStock(
          queryRunner,
          article,
          movement.quantite,
          movement.type
        );
      }

      await queryRunner.commitTransaction();

      // Émettre l'événement
      if (emitEvent) {
        this.eventEmitter.emit('stock.movement.created', {
          movement,
          articleId: article.id,
          type: movement.type
        });
      }

      this.logger.log(
        `Mouvement de stock créé: ${movement.reference} - Article: ${article.reference} - Quantité: ${movement.quantite}`
      );

      return movement;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Traiter un mouvement en attente
   */
  async processMovement(
    movementId: string,
    options?: {
      forceProcess?: boolean;
      skipValidation?: boolean;
    }
  ): Promise<IStockMovement> {
    // TODO: Uncomment when StockMovement entity is created
    // const movement = await this.movementRepository.findOne({
    //   where: { id: movementId }
    // });

    // if (!movement) {
    //   throw new NotFoundException(`Mouvement ${movementId} non trouvé`);
    // }
    
    // Temporary placeholder
    const movement = {} as IStockMovement;
    throw new NotFoundException(`Mouvement ${movementId} non trouvé`);

    if (movement.status !== StockMovementStatus.EN_ATTENTE && !options?.forceProcess) {
      throw new BadRequestException(`Le mouvement ${movement.reference} n'est pas en attente`);
    }

    const article = await this.articleRepository.findOne({
      where: { id: movement.articleId }
    });

    if (!article) {
      throw new NotFoundException(`Article ${movement.articleId} non trouvé`);
    }

    // Validation du stock
    if (!options?.skipValidation && movement.type === StockMovementType.SORTIE) {
      const stockDisponible = article.stockPhysique - (article.stockReserve || 0);
      if (stockDisponible < movement.quantite) {
        movement.status = StockMovementStatus.ANNULE;
        movement.notes = 'Stock insuffisant';
        // TODO: Uncomment when StockMovement entity is created
        // await this.movementRepository.save(movement);
        
        throw new BadRequestException(
          `Stock insuffisant pour le mouvement ${movement.reference}`
        );
      }
    }

    // Transaction pour le traitement
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Mettre à jour le stock de l'article
      await this.updateArticleStock(
        queryRunner,
        article,
        movement.quantite,
        movement.type
      );

      // Mettre à jour le mouvement
      movement.status = StockMovementStatus.COMPLETE;
      movement.stockApres = this.calculateNewStock(
        article.stockPhysique,
        movement.quantite,
        movement.type
      );

      await queryRunner.manager.save('StockMovement', movement);
      await queryRunner.commitTransaction();

      // Émettre l'événement
      this.eventEmitter.emit('stock.movement.processed', {
        movement,
        articleId: article.id
      });

      this.logger.log(`Mouvement ${movement.reference} traité avec succès`);

      return movement;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Annuler un mouvement
   */
  async cancelMovement(
    movementId: string,
    motif: string,
    options?: { reverseStock?: boolean }
  ): Promise<IStockMovement> {
    // TODO: Uncomment when StockMovement entity is created
    // const movement = await this.movementRepository.findOne({
    //   where: { id: movementId }
    // });
    const movement = {} as IStockMovement;

    if (!movement) {
      throw new NotFoundException(`Mouvement ${movementId} non trouvé`);
    }

    if (movement.status === StockMovementStatus.ANNULE) {
      throw new BadRequestException(`Le mouvement ${movement.reference} est déjà annulé`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Si le mouvement était complété et qu'on veut inverser le stock
      if (movement.status === StockMovementStatus.COMPLETE && options?.reverseStock) {
        const article = await this.articleRepository.findOne({
          where: { id: movement.articleId }
        });

        if (article) {
          // Inverser le mouvement
          const reverseType = movement.type === StockMovementType.ENTREE 
            ? StockMovementType.SORTIE 
            : StockMovementType.ENTREE;

          await this.updateArticleStock(
            queryRunner,
            article,
            movement.quantite,
            reverseType
          );
        }
      }

      // Mettre à jour le mouvement
      movement.status = StockMovementStatus.ANNULE;
      movement.notes = `Annulé: ${motif}`;

      await queryRunner.manager.save('StockMovement', movement);
      await queryRunner.commitTransaction();

      // Émettre l'événement
      this.eventEmitter.emit('stock.movement.cancelled', {
        movement,
        motif
      });

      this.logger.log(`Mouvement ${movement.reference} annulé: ${motif}`);

      return movement;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Rechercher les mouvements avec filtres
   */
  async findMovements(
    filters: IStockMovementFilters
  ): Promise<{
    items: IStockMovement[];
    total: number;
    page: number;
    limit: number;
  }> {
    // TODO: Implement when StockMovement entity is created
    // const query = this.movementRepository.createQueryBuilder('movement');
    // 
    // // Appliquer les filtres
    // if (filters.articleIds?.length) {
    //   query.andWhere('movement.articleId IN (:...articleIds)', { articleIds: filters.articleIds });
    // }
    //
    // if (filters.types?.length) {
    //   query.andWhere('movement.type IN (:...types)', { types: filters.types });
    // }
    //
    // if (filters.status?.length) {
    //   query.andWhere('movement.status IN (:...status)', { status: filters.status });
    // }
    //
    // if (filters.dateDebut && filters.dateFin) {
    //   query.andWhere('movement.dateCreation BETWEEN :dateDebut AND :dateFin', {
    //     dateDebut: filters.dateDebut,
    //     dateFin: filters.dateFin
    //   });
    // }
    //
    // if (filters.recherche) {
    //   query.andWhere('movement.reference ILIKE :search', {
    //     search: `%${filters.recherche}%`
    //   });
    // }
    //
    // if (filters.motifs?.length) {
    //   query.andWhere('movement.motif IN (:...motifs)', { motifs: filters.motifs });
    // }
    //
    // if (filters.priorite) {
    //   query.andWhere('movement.priorite = :priorite', { priorite: filters.priorite });
    // }
    //
    // // Tri
    // const sortField = filters.sortBy || 'dateCreation';
    // const sortOrder = filters.sortOrder || 'DESC';
    // query.orderBy(`movement.${sortField}`, sortOrder);
    //
    // // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    // const skip = (page - 1) * limit;
    //
    // query.skip(skip).take(limit);

    // Exécution
    // TODO: Uncomment when StockMovement entity is created
    // const [items, total] = await query.getManyAndCount();

    return {
      items: [],
      total: 0,
      page,
      limit
    };
  }

  /**
   * Obtenir l'historique des mouvements d'un article
   */
  async getArticleMovementHistory(
    articleId: string,
    options?: {
      limit?: number;
      includeAnnule?: boolean;
    }
  ): Promise<IStockMovement[]> {
    // TODO: Implement when StockMovement entity is created
    // const query = this.movementRepository.createQueryBuilder('movement')
    //   .where('movement.articleId = :articleId', { articleId });
    //
    // if (!options?.includeAnnule) {
    //   query.andWhere('movement.statut != :statut', { 
    //     statut: StockMovementStatus.ANNULE 
    //   });
    // }
    //
    // query.orderBy('movement.dateCreation', 'DESC');
    //
    // if (options?.limit) {
    //   query.limit(options.limit);
    // }

    // TODO: Uncomment when StockMovement entity is created
    // return await query.getMany();
    return [];
  }

  /**
   * Calculer le solde des mouvements pour une période
   */
  async calculatePeriodBalance(
    articleId: string,
    dateDebut: Date,
    dateFin: Date
  ): Promise<{
    entrees: number;
    sorties: number;
    solde: number;
    mouvements: number;
  }> {
    // TODO: Uncomment when StockMovement entity is created
    // const movements = await this.movementRepository.find({
    //   where: {
    //     articleId,
    //     dateCreation: Between(dateDebut, dateFin),
    //     status: StockMovementStatus.COMPLETE
    //   }
    // });
    const movements: IStockMovement[] = [];

    const entrees = movements
      .filter(m => m.type === StockMovementType.ENTREE)
      .reduce((sum, m) => sum + m.quantite, 0);

    const sorties = movements
      .filter(m => m.type === StockMovementType.SORTIE)
      .reduce((sum, m) => sum + m.quantite, 0);

    return {
      entrees,
      sorties,
      solde: entrees - sorties,
      mouvements: movements.length
    };
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
    const newStock = this.calculateNewStock(article.stockPhysique, quantite, type);

    await queryRunner.manager.update(
      Article,
      { id: article.id },
      { 
        stockPhysique: newStock,
        dateDerniereModification: new Date()
      }
    );

    // Vérifier les alertes de stock
    if (newStock <= (article.stockMini || 0)) {
      this.eventEmitter.emit('stock.alert.minimum', {
        articleId: article.id,
        stockActuel: newStock,
        stockMinimum: article.stockMini
      });
    }

    if (newStock <= 0) {
      this.eventEmitter.emit('stock.alert.rupture', {
        articleId: article.id
      });
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
        return stockActuel + quantite;
      
      case StockMovementType.SORTIE:
      case StockMovementType.CORRECTION_NEGATIVE:
        return Math.max(0, stockActuel - quantite);
      
      case StockMovementType.INVENTAIRE:
        return quantite; // Stock remplacé par la valeur d'inventaire
      
      default:
        return stockActuel;
    }
  }

  private async generateReference(type: StockMovementType): Promise<string> {
    const prefix = this.getMovementPrefix(type);
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Compter les mouvements du jour
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    // TODO: Uncomment when StockMovement entity is created
    // const count = await this.movementRepository.count({
    //   where: {
    //     dateCreation: Between(startOfDay, endOfDay)
    //   }
    // });
    const count = 0;

    const sequence = String(count + 1).padStart(4, '0');
    
    return `${prefix}-${year}${month}${day}-${sequence}`;
  }

  private getMovementPrefix(type: StockMovementType): string {
    const prefixes: Record<StockMovementType, string> = {
      [StockMovementType.ENTREE]: 'ENT',
      [StockMovementType.SORTIE]: 'SOR',
      [StockMovementType.TRANSFERT]: 'TRA',
      [StockMovementType.INVENTAIRE]: 'INV',
      [StockMovementType.CORRECTION_POSITIVE]: 'CRP',
      [StockMovementType.CORRECTION_NEGATIVE]: 'CRN',
      [StockMovementType.RETOUR]: 'RET',
      [StockMovementType.RESERVATION]: 'RES',
      [StockMovementType.LIBERATION]: 'LIB'
    };
    
    return prefixes[type] || 'MVT';
  }
}