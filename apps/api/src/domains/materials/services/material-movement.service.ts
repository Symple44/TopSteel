import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner, Between, In } from 'typeorm';
import { Material, MaterialShape } from '../entities/material.entity';
import { MaterialMovement } from '../entities/material-movement.entity';
import { 
  IMaterialMovement, 
  IMaterialMovementFilters,
  ICreateMaterialMovement,
  MaterialMovementType,
  MaterialMovementStatus,
  MaterialMovementPriority,
  MaterialMovementReason,
  IMaterialMovementSortOptions
} from '../interfaces/material-movement.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Service de gestion des mouvements de matériaux
 */
@Injectable()
export class MaterialMovementService {
  private readonly logger = new Logger(MaterialMovementService.name);

  constructor(
    @InjectRepository(Material, 'tenant')
    private readonly materialRepository: Repository<Material>,
    @InjectRepository(MaterialMovement, 'tenant')
    private readonly movementRepository: Repository<MaterialMovement>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Créer un mouvement de matériau
   */
  async createMovement(
    data: ICreateMaterialMovement & { 
      tenantId: string; 
      utilisateurId: string; 
      utilisateurNom: string;
    },
    options?: { 
      validateStock?: boolean;
      updateMaterial?: boolean;
      emitEvent?: boolean;
      autoValidate?: boolean;
    }
  ): Promise<IMaterialMovement> {
    const { 
      validateStock = true, 
      updateMaterial = false, 
      emitEvent = true,
      autoValidate = false 
    } = options || {};

    // Validation du matériau
    const material = await this.materialRepository.findOne({
      where: { id: data.materialId }
    });

    if (!material) {
      throw new NotFoundException(`Matériau ${data.materialId} non trouvé`);
    }

    // Validation du stock pour les sorties
    if (validateStock && this.isSortie(data.type)) {
      const stockDisponible = material.stockPhysique - (material.stockReserve || 0);
      if (stockDisponible < data.quantite) {
        throw new BadRequestException(
          `Stock insuffisant. Disponible: ${stockDisponible}, Demandé: ${data.quantite}`
        );
      }
    }

    // Validation de la transformation
    if (data.transformation && this.isTransformation(data.type)) {
      await this.validateTransformation(data.transformation);
    }

    // Transaction pour garantir la cohérence
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Générer la référence
      const reference = await this.generateReference(data.type, data.tenantId);

      // Calculer les valeurs
      const valeurUnitaire = data.valeurUnitaire || material.prixUnitaire || 0;
      const valeurTotale = valeurUnitaire * data.quantite;

      // Calculer le nouveau stock
      const stockApres = this.calculateNewStock(
        material.stockPhysique,
        data.quantite,
        data.type
      );

      // Créer le mouvement
      const movement = queryRunner.manager.create(MaterialMovement, {
        ...data,
        reference,
        status: autoValidate ? MaterialMovementStatus.VALIDE : MaterialMovementStatus.BROUILLON,
        priorite: data.priorite || MaterialMovementPriority.NORMALE,
        dateMovement: data.dateMovement || new Date(),
        stockAvant: material.stockPhysique,
        stockApres,
        valeurUnitaire,
        valeurTotale,
        unite: material.unite,
        poidsTotal: this.calculatePoids(material, data.quantite),
        volumeTotal: this.calculateVolume(material, data.quantite),
        // Traçabilité depuis le matériau
        tracabilite: data.tracabilite || {
          numeroLot: undefined,
          numeroSerie: undefined,
          certificatMatiere: undefined,
          numeroCoulee: undefined,
          fournisseurOrigine: undefined
        }
      });

      const savedMovement = await queryRunner.manager.save(movement);

      // Mettre à jour le matériau si demandé et validé
      if (updateMaterial && savedMovement.status === MaterialMovementStatus.VALIDE) {
        await this.updateMaterialStock(
          queryRunner,
          material,
          savedMovement.quantite,
          savedMovement.type
        );
      }

      await queryRunner.commitTransaction();

      // Émettre l'événement
      if (emitEvent) {
        this.eventEmitter.emit('material.movement.created', {
          movement: savedMovement,
          materialId: material.id,
          type: savedMovement.type
        });
      }

      this.logger.log(
        `Mouvement de matériau créé: ${savedMovement.reference} - Matériau: ${material.reference} - Quantité: ${savedMovement.quantite}`
      );

      return savedMovement as IMaterialMovement;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Valider un mouvement
   */
  async validateMovement(
    movementId: string,
    validateurId: string,
    validateurNom: string,
    options?: {
      commentaires?: string;
      updateMaterial?: boolean;
    }
  ): Promise<IMaterialMovement> {
    const movement = await this.movementRepository.findOne({
      where: { id: movementId },
      relations: ['material']
    });

    if (!movement) {
      throw new NotFoundException(`Mouvement ${movementId} non trouvé`);
    }

    if (!movement.canBeValidated()) {
      throw new BadRequestException(
        `Le mouvement ${movement.reference} ne peut pas être validé dans son état actuel`
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Mettre à jour le mouvement
      movement.status = MaterialMovementStatus.VALIDE;
      movement.validateurId = validateurId;
      movement.validateurNom = validateurNom;
      movement.dateValidation = new Date();
      movement.commentairesValidation = options?.commentaires;

      await queryRunner.manager.save(movement);

      // Mettre à jour le stock si demandé
      if (options?.updateMaterial && movement.material) {
        await this.updateMaterialStock(
          queryRunner,
          movement.material,
          movement.quantite,
          movement.type
        );
      }

      await queryRunner.commitTransaction();

      // Émettre l'événement
      this.eventEmitter.emit('material.movement.validated', {
        movement,
        validateurId
      });

      this.logger.log(`Mouvement ${movement.reference} validé par ${validateurNom}`);

      return movement as IMaterialMovement;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Traiter un mouvement validé
   */
  async processMovement(
    movementId: string,
    options?: {
      forceProcess?: boolean;
      skipValidation?: boolean;
    }
  ): Promise<IMaterialMovement> {
    const movement = await this.movementRepository.findOne({
      where: { id: movementId },
      relations: ['material']
    });

    if (!movement) {
      throw new NotFoundException(`Mouvement ${movementId} non trouvé`);
    }

    if (!movement.canBeProcessed() && !options?.forceProcess) {
      throw new BadRequestException(
        `Le mouvement ${movement.reference} n'est pas validé ou déjà traité`
      );
    }

    if (!movement.material) {
      throw new NotFoundException(`Matériau ${movement.materialId} non trouvé`);
    }

    // Validation du stock
    if (!options?.skipValidation && this.isSortie(movement.type)) {
      const stockDisponible = movement.material.stockPhysique - (movement.material.stockReserve || 0);
      if (stockDisponible < movement.quantite) {
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
      // Mettre à jour le stock du matériau
      await this.updateMaterialStock(
        queryRunner,
        movement.material,
        movement.quantite,
        movement.type
      );

      // Mettre à jour le mouvement
      movement.status = MaterialMovementStatus.TERMINE;
      movement.stockApres = this.calculateNewStock(
        movement.material.stockPhysique,
        movement.quantite,
        movement.type
      );

      await queryRunner.manager.save(movement);
      await queryRunner.commitTransaction();

      // Émettre l'événement
      this.eventEmitter.emit('material.movement.processed', {
        movement,
        materialId: movement.material.id
      });

      this.logger.log(`Mouvement ${movement.reference} traité avec succès`);

      return movement as IMaterialMovement;
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
    options?: { 
      reverseStock?: boolean;
      utilisateurId?: string;
      utilisateurNom?: string;
    }
  ): Promise<IMaterialMovement> {
    const movement = await this.movementRepository.findOne({
      where: { id: movementId },
      relations: ['material']
    });

    if (!movement) {
      throw new NotFoundException(`Mouvement ${movementId} non trouvé`);
    }

    if (!movement.canBeCancelled()) {
      throw new BadRequestException(`Le mouvement ${movement.reference} est déjà annulé`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Si le mouvement était terminé et qu'on veut inverser le stock
      if (movement.status === MaterialMovementStatus.TERMINE && options?.reverseStock && movement.material) {
        // Inverser le mouvement
        const reverseType = this.getReverseType(movement.type);
        if (reverseType) {
          await this.updateMaterialStock(
            queryRunner,
            movement.material,
            movement.quantite,
            reverseType
          );
        }
      }

      // Mettre à jour le mouvement
      movement.status = MaterialMovementStatus.ANNULE;
      movement.notes = `Annulé: ${motif}\n${movement.notes || ''}`;
      
      // Ajouter à l'historique
      movement.historiqueModifications = movement.historiqueModifications || [];
      movement.historiqueModifications.push({
        date: new Date(),
        utilisateur: options?.utilisateurNom || 'Système',
        champ: 'status',
        ancienneValeur: movement.status,
        nouvelleValeur: MaterialMovementStatus.ANNULE
      });

      await queryRunner.manager.save(movement);
      await queryRunner.commitTransaction();

      // Émettre l'événement
      this.eventEmitter.emit('material.movement.cancelled', {
        movement,
        motif
      });

      this.logger.log(`Mouvement ${movement.reference} annulé: ${motif}`);

      return movement as IMaterialMovement;
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
    filters: IMaterialMovementFilters & { tenantId: string }
  ): Promise<{
    items: IMaterialMovement[];
    total: number;
    page: number;
    limit: number;
  }> {
    const query = this.movementRepository.createQueryBuilder('movement')
      .leftJoinAndSelect('movement.material', 'material')
      .where('movement.tenantId = :tenantId', { tenantId: filters.tenantId });

    // Appliquer les filtres
    if (filters.materialIds?.length) {
      query.andWhere('movement.materialId IN (:...materialIds)', { 
        materialIds: filters.materialIds 
      });
    }

    if (filters.types?.length) {
      query.andWhere('movement.type IN (:...types)', { types: filters.types });
    }

    if (filters.motifs?.length) {
      query.andWhere('movement.motif IN (:...motifs)', { motifs: filters.motifs });
    }

    if (filters.status?.length) {
      query.andWhere('movement.status IN (:...status)', { status: filters.status });
    }

    if (filters.priorites?.length) {
      query.andWhere('movement.priorite IN (:...priorites)', { 
        priorites: filters.priorites 
      });
    }

    if (filters.dateDebut && filters.dateFin) {
      query.andWhere('movement.dateMovement BETWEEN :dateDebut AND :dateFin', {
        dateDebut: filters.dateDebut,
        dateFin: filters.dateFin
      });
    }

    if (filters.projetIds?.length) {
      query.andWhere('movement.projetId IN (:...projetIds)', { 
        projetIds: filters.projetIds 
      });
    }

    if (filters.commandeIds?.length) {
      query.andWhere('movement.commandeId IN (:...commandeIds)', { 
        commandeIds: filters.commandeIds 
      });
    }

    if (filters.numeroLot) {
      query.andWhere('movement.numeroLot = :numeroLot', { 
        numeroLot: filters.numeroLot 
      });
    }

    if (filters.controleQualite) {
      switch (filters.controleQualite) {
        case 'EFFECTUE':
          query.andWhere("movement.controleQualite->>'effectue' = 'true'");
          break;
        case 'NON_EFFECTUE':
          query.andWhere(
            "(movement.controleQualite IS NULL OR movement.controleQualite->>'effectue' = 'false')"
          );
          break;
        case 'CONFORME':
          query.andWhere(
            "movement.controleQualite->>'effectue' = 'true' AND movement.controleQualite->>'conforme' = 'true'"
          );
          break;
        case 'NON_CONFORME':
          query.andWhere(
            "movement.controleQualite->>'effectue' = 'true' AND movement.controleQualite->>'conforme' = 'false'"
          );
          break;
      }
    }

    if (filters.avecTransformation === true) {
      query.andWhere('movement.transformation IS NOT NULL');
    } else if (filters.avecTransformation === false) {
      query.andWhere('movement.transformation IS NULL');
    }

    if (filters.recherche) {
      query.andWhere(
        '(movement.reference ILIKE :search OR movement.notes ILIKE :search OR material.nom ILIKE :search OR material.code ILIKE :search)',
        { search: `%${filters.recherche}%` }
      );
    }

    // Filtres de quantité
    if (filters.quantiteMin !== undefined) {
      query.andWhere('movement.quantite >= :quantiteMin', { 
        quantiteMin: filters.quantiteMin 
      });
    }
    if (filters.quantiteMax !== undefined) {
      query.andWhere('movement.quantite <= :quantiteMax', { 
        quantiteMax: filters.quantiteMax 
      });
    }

    // Filtres de valeur
    if (filters.valeurMin !== undefined) {
      query.andWhere('movement.valeurTotale >= :valeurMin', { 
        valeurMin: filters.valeurMin 
      });
    }
    if (filters.valeurMax !== undefined) {
      query.andWhere('movement.valeurTotale <= :valeurMax', { 
        valeurMax: filters.valeurMax 
      });
    }

    // Filtres de poids
    if (filters.poidsMin !== undefined) {
      query.andWhere('movement.poidsTotal >= :poidsMin', { 
        poidsMin: filters.poidsMin 
      });
    }
    if (filters.poidsMax !== undefined) {
      query.andWhere('movement.poidsTotal <= :poidsMax', { 
        poidsMax: filters.poidsMax 
      });
    }

    // Tri
    const sortField = filters.sortBy || 'dateCreation';
    const sortOrder = filters.sortOrder || 'DESC';
    query.orderBy(`movement.${sortField}`, sortOrder);

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    query.skip(skip).take(limit);

    // Exécution
    const [items, total] = await query.getManyAndCount();

    return {
      items: items as IMaterialMovement[],
      total,
      page,
      limit
    };
  }

  /**
   * Obtenir l'historique des mouvements d'un matériau
   */
  async getMaterialMovementHistory(
    materialId: string,
    options?: {
      limit?: number;
      includeAnnule?: boolean;
      dateDebut?: Date;
      dateFin?: Date;
    }
  ): Promise<IMaterialMovement[]> {
    const query = this.movementRepository.createQueryBuilder('movement')
      .where('movement.materialId = :materialId', { materialId });

    if (!options?.includeAnnule) {
      query.andWhere('movement.status != :status', { 
        status: MaterialMovementStatus.ANNULE 
      });
    }

    if (options?.dateDebut && options?.dateFin) {
      query.andWhere('movement.dateMovement BETWEEN :dateDebut AND :dateFin', {
        dateDebut: options.dateDebut,
        dateFin: options.dateFin
      });
    }

    query.orderBy('movement.dateMovement', 'DESC');

    if (options?.limit) {
      query.limit(options.limit);
    }

    const movements = await query.getMany();
    return movements as IMaterialMovement[];
  }

  /**
   * Calculer le solde des mouvements pour une période
   */
  async calculatePeriodBalance(
    materialId: string,
    dateDebut: Date,
    dateFin: Date
  ): Promise<{
    entrees: number;
    sorties: number;
    transformations: number;
    solde: number;
    valeurTotale: number;
    mouvements: number;
  }> {
    const movements = await this.movementRepository.find({
      where: {
        materialId,
        dateMovement: Between(dateDebut, dateFin),
        status: In([MaterialMovementStatus.TERMINE, MaterialMovementStatus.VALIDE])
      }
    });

    const entrees = movements
      .filter(m => this.isEntree(m.type))
      .reduce((sum, m) => sum + m.quantite, 0);

    const sorties = movements
      .filter(m => this.isSortie(m.type))
      .reduce((sum, m) => sum + m.quantite, 0);

    const transformations = movements
      .filter(m => this.isTransformation(m.type))
      .length;

    const valeurTotale = movements
      .reduce((sum, m) => sum + (m.valeurTotale || 0), 0);

    return {
      entrees,
      sorties,
      transformations,
      solde: entrees - sorties,
      valeurTotale,
      mouvements: movements.length
    };
  }

  /**
   * Obtenir les statistiques des mouvements
   */
  async getMovementStatistics(
    tenantId: string,
    periode?: { dateDebut: Date; dateFin: Date }
  ): Promise<{
    totalMouvements: number;
    parType: Record<MaterialMovementType, number>;
    parStatus: Record<MaterialMovementStatus, number>;
    parMotif: Record<MaterialMovementReason, number>;
    valeurTotale: number;
    mouvementsRecents: IMaterialMovement[];
  }> {
    const query = this.movementRepository.createQueryBuilder('movement')
      .where('movement.tenantId = :tenantId', { tenantId });

    if (periode) {
      query.andWhere('movement.dateMovement BETWEEN :dateDebut AND :dateFin', periode);
    }

    const movements = await query.getMany();

    // Statistiques par type
    const parType = {} as Record<MaterialMovementType, number>;
    for (const type of Object.values(MaterialMovementType)) {
      parType[type] = movements.filter(m => m.type === type).length;
    }

    // Statistiques par statut
    const parStatus = {} as Record<MaterialMovementStatus, number>;
    for (const status of Object.values(MaterialMovementStatus)) {
      parStatus[status] = movements.filter(m => m.status === status).length;
    }

    // Statistiques par motif
    const parMotif = {} as Record<MaterialMovementReason, number>;
    for (const motif of Object.values(MaterialMovementReason)) {
      parMotif[motif] = movements.filter(m => m.motif === motif).length;
    }

    // Valeur totale
    const valeurTotale = movements.reduce((sum, m) => sum + (m.valeurTotale || 0), 0);

    // Mouvements récents
    const mouvementsRecents = await this.movementRepository.find({
      where: { tenantId },
      order: { dateCreation: 'DESC' },
      take: 10,
      relations: ['material']
    });

    return {
      totalMouvements: movements.length,
      parType,
      parStatus,
      parMotif,
      valeurTotale,
      mouvementsRecents: mouvementsRecents as IMaterialMovement[]
    };
  }

  /**
   * Méthodes privées
   */
  private async updateMaterialStock(
    queryRunner: QueryRunner,
    material: Material,
    quantite: number,
    type: MaterialMovementType
  ): Promise<void> {
    const newStock = this.calculateNewStock(material.stockPhysique, quantite, type);

    await queryRunner.manager.update(
      Material,
      { id: material.id },
      { 
        stockPhysique: newStock
      }
    );

    // Vérifier les alertes de stock
    if (newStock <= (material.stockMini || 0)) {
      this.eventEmitter.emit('material.stock.alert.minimum', {
        materialId: material.id,
        stockActuel: newStock,
        stockMinimum: material.stockMini
      });
    }

    if (newStock <= 0) {
      this.eventEmitter.emit('material.stock.alert.rupture', {
        materialId: material.id
      });
    }

    if (material.stockMaxi > 0 && newStock >= material.stockMaxi) {
      this.eventEmitter.emit('material.stock.alert.maximum', {
        materialId: material.id,
        stockActuel: newStock,
        stockMaximum: material.stockMaxi
      });
    }
  }

  private calculateNewStock(
    stockActuel: number,
    quantite: number,
    type: MaterialMovementType
  ): number {
    switch (type) {
      case MaterialMovementType.ENTREE:
      case MaterialMovementType.RETOUR:
        return stockActuel + quantite;
      
      case MaterialMovementType.SORTIE:
      case MaterialMovementType.PERTE:
        return Math.max(0, stockActuel - quantite);
      
      case MaterialMovementType.INVENTAIRE:
        return quantite; // Stock remplacé par la valeur d'inventaire
      
      case MaterialMovementType.CORRECTION:
        return Math.max(0, stockActuel + quantite); // Quantité peut être négative
      
      default:
        return stockActuel;
    }
  }

  private async generateReference(type: MaterialMovementType, tenantId: string): Promise<string> {
    const prefix = this.getMovementPrefix(type);
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Compter les mouvements du jour pour ce tenant
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    const count = await this.movementRepository.count({
      where: {
        tenantId,
        dateCreation: Between(startOfDay, endOfDay)
      }
    });

    const sequence = String(count + 1).padStart(4, '0');
    
    return `MAT-${prefix}-${year}${month}${day}-${sequence}`;
  }

  private getMovementPrefix(type: MaterialMovementType): string {
    const prefixes: Record<MaterialMovementType, string> = {
      [MaterialMovementType.ENTREE]: 'ENT',
      [MaterialMovementType.SORTIE]: 'SOR',
      [MaterialMovementType.TRANSFERT]: 'TRA',
      [MaterialMovementType.CORRECTION]: 'COR',
      [MaterialMovementType.INVENTAIRE]: 'INV',
      [MaterialMovementType.TRANSFORMATION]: 'TRF',
      [MaterialMovementType.ASSEMBLAGE]: 'ASM',
      [MaterialMovementType.DESASSEMBLAGE]: 'DES',
      [MaterialMovementType.PERTE]: 'PER',
      [MaterialMovementType.RETOUR]: 'RET'
    };
    
    return prefixes[type] || 'MVT';
  }

  private getReverseType(type: MaterialMovementType): MaterialMovementType | null {
    switch (type) {
      case MaterialMovementType.ENTREE:
        return MaterialMovementType.SORTIE;
      case MaterialMovementType.SORTIE:
        return MaterialMovementType.ENTREE;
      case MaterialMovementType.RETOUR:
        return MaterialMovementType.SORTIE;
      default:
        return null;
    }
  }

  private isSortie(type: MaterialMovementType): boolean {
    return [
      MaterialMovementType.SORTIE,
      MaterialMovementType.PERTE
    ].includes(type);
  }

  private isEntree(type: MaterialMovementType): boolean {
    return [
      MaterialMovementType.ENTREE,
      MaterialMovementType.RETOUR
    ].includes(type);
  }

  private isTransformation(type: MaterialMovementType): boolean {
    return [
      MaterialMovementType.TRANSFORMATION,
      MaterialMovementType.ASSEMBLAGE,
      MaterialMovementType.DESASSEMBLAGE
    ].includes(type);
  }

  private calculatePoids(material: Material, quantite: number): number {
    // Calculer le poids selon le type de matériau
    if (material.poidsUnitaire) {
      return material.poidsUnitaire * quantite;
    }
    
    // Si c'est une tôle ou plaque
    if (material.forme === MaterialShape.TOLE || material.forme === MaterialShape.PLAQUE) {
      const dims = material.dimensions || {};
      const surface = (dims.longueur || 0) * (dims.largeur || 0) / 1000000; // m²
      const volume = surface * (dims.epaisseur || 0) / 1000; // m³
      const densite = material.densite || 7850; // kg/m³ (acier par défaut)
      return volume * densite * quantite;
    }
    
    // Si c'est un profilé ou tube
    if (material.forme === MaterialShape.PROFILE || material.forme === MaterialShape.TUBE) {
      const dims = material.dimensions || {};
      const longueurTotale = (dims.longueur || 0) * quantite / 1000; // m
      // Estimation du poids linéaire basée sur la section
      const section = dims.section || 0; // cm²
      const densite = material.densite || 7850; // kg/m³
      const poidsLineaire = section * densite / 10000; // kg/m
      return longueurTotale * poidsLineaire;
    }
    
    return 0;
  }

  private calculateVolume(material: Material, quantite: number): number {
    // Calculer le volume selon le type de matériau
    const dims = material.dimensions || {};
    
    // Si dimensions disponibles
    if (dims.longueur && dims.largeur) {
      const volume = (dims.longueur * dims.largeur * (dims.epaisseur || dims.hauteur || 1)) / 1000000000; // m³
      return volume * quantite;
    }
    
    // Si c'est un tube ou cylindre
    if (dims.diametre || (dims.diametreExterieur && dims.diametreInterieur)) {
      const rayonExt = (dims.diametreExterieur || dims.diametre || 0) / 2000; // m
      const rayonInt = (dims.diametreInterieur || 0) / 2000; // m
      const longueur = (dims.longueur || 0) / 1000; // m
      const volume = Math.PI * (rayonExt * rayonExt - rayonInt * rayonInt) * longueur;
      return volume * quantite;
    }
    
    return 0;
  }

  private async validateTransformation(transformation: any): Promise<void> {
    if (!transformation.materiauxSources?.length) {
      throw new BadRequestException('Une transformation doit avoir des matériaux sources');
    }
    
    if (!transformation.materiauxProduits?.length) {
      throw new BadRequestException('Une transformation doit avoir des matériaux produits');
    }
    
    // Vérifier que les matériaux sources existent
    for (const source of transformation.materiauxSources) {
      const material = await this.materialRepository.findOne({
        where: { id: source.materialId }
      });
      
      if (!material) {
        throw new NotFoundException(`Matériau source ${source.materialId} non trouvé`);
      }
      
      const stockDisponible = material.stockPhysique - (material.stockReserve || 0);
      if (stockDisponible < source.quantiteConsommee) {
        throw new BadRequestException(
          `Stock insuffisant pour le matériau ${material.reference}: ${stockDisponible} disponible, ${source.quantiteConsommee} requis`
        );
      }
    }
  }
}