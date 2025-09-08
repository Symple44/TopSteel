import { Article } from '@erp/entities'
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import {
  StockMovementMotif,
  StockMovementPriority,
  StockMovementStatus,
  StockMovementType,
} from '../interfaces/stock-movement.interface'

/**
 * Entité pour les mouvements de stock
 */
@Entity('stock_movements')
@Index(['articleId', 'dateCreation'])
@Index(['reference'], { unique: true })
@Index(['type', 'statut'])
@Index(['dateCreation'])
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string

  /** Référence unique du mouvement */
  @Column({ unique: true })
  reference: string

  /** Article concerné */
  @Column('uuid')
  articleId: string

  @ManyToOne(() => Article, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'articleId' })
  article?: Article

  /** Type de mouvement */
  @Column({
    type: 'enum',
    enum: StockMovementType,
  })
  type: StockMovementType

  /** Quantité du mouvement */
  @Column('decimal', { precision: 10, scale: 3 })
  quantite: number

  /** Unité de mesure */
  @Column({ nullable: true })
  unite?: string

  /** Stock avant le mouvement */
  @Column('decimal', { precision: 10, scale: 3 })
  stockAvant: number

  /** Stock après le mouvement */
  @Column('decimal', { precision: 10, scale: 3 })
  stockApres: number

  /** Motif du mouvement */
  @Column({
    type: 'enum',
    enum: StockMovementMotif,
    nullable: true,
  })
  motif?: StockMovementMotif

  /** Description détaillée */
  @Column('text', { nullable: true })
  description?: string

  /** Document associé (commande, facture, etc.) */
  @Column({ nullable: true })
  documentReference?: string

  /** Type de document */
  @Column({ nullable: true })
  documentType?: string

  /** ID du document */
  @Column('uuid', { nullable: true })
  documentId?: string

  /** Emplacement source */
  @Column({ nullable: true })
  emplacementSource?: string

  /** Emplacement destination */
  @Column({ nullable: true })
  emplacementDestination?: string

  /** Numéro de lot */
  @Column({ nullable: true })
  numeroLot?: string

  /** Numéro de série */
  @Column({ nullable: true })
  numeroSerie?: string

  /** Date de péremption */
  @Column('date', { nullable: true })
  datePeremption?: Date

  /** Statut du mouvement */
  @Column({
    type: 'enum',
    enum: StockMovementStatus,
    default: StockMovementStatus.EN_ATTENTE,
  })
  statut: StockMovementStatus

  /** Priorité du mouvement */
  @Column({
    type: 'enum',
    enum: StockMovementPriority,
    default: StockMovementPriority.NORMALE,
  })
  priorite: StockMovementPriority

  /** Utilisateur ayant créé le mouvement */
  @Column('uuid')
  creeParId: string

  /** Nom de l'utilisateur */
  @Column()
  creeParNom: string

  /** Utilisateur ayant traité le mouvement */
  @Column('uuid', { nullable: true })
  traiteParId?: string

  /** Nom de l'utilisateur ayant traité */
  @Column({ nullable: true })
  traiteParNom?: string

  /** Date de traitement */
  @Column('timestamp', { nullable: true })
  dateTraitement?: Date

  /** Utilisateur ayant annulé le mouvement */
  @Column('uuid', { nullable: true })
  annuleParId?: string

  /** Nom de l'utilisateur ayant annulé */
  @Column({ nullable: true })
  annuleParNom?: string

  /** Date d'annulation */
  @Column('timestamp', { nullable: true })
  dateAnnulation?: Date

  /** Motif d'annulation */
  @Column('text', { nullable: true })
  motifAnnulation?: string

  /** Coût unitaire */
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  coutUnitaire?: number

  /** Coût total du mouvement */
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  coutTotal?: number

  /** Notes internes */
  @Column('text', { nullable: true })
  notes?: string

  /** Métadonnées JSON */
  @Column('jsonb', { nullable: true })
  metadata?: Record<string, unknown>

  /** Date de création */
  @CreateDateColumn()
  dateCreation: Date

  /** Date de dernière modification */
  @UpdateDateColumn()
  dateModification: Date

  /** Tenant ID pour multi-tenancy */
  @Column('uuid')
  @Index()
  tenantId: string

  /**
   * Méthodes utilitaires
   */

  /** Vérifier si le mouvement peut être annulé */
  canBeCancelled(): boolean {
    return this.statut !== StockMovementStatus.ANNULE
  }

  /** Vérifier si le mouvement peut être traité */
  canBeProcessed(): boolean {
    return this.statut === StockMovementStatus.EN_ATTENTE
  }

  /** Vérifier si le mouvement est une entrée */
  isEntree(): boolean {
    return [
      StockMovementType.ENTREE,
      StockMovementType.RETOUR,
      StockMovementType.CORRECTION_POSITIVE,
    ].includes(this.type)
  }

  /** Vérifier si le mouvement est une sortie */
  isSortie(): boolean {
    return [StockMovementType.SORTIE, StockMovementType.CORRECTION_NEGATIVE].includes(this.type)
  }

  /** Calculer l'impact sur le stock */
  getStockImpact(): number {
    if (this.isEntree()) {
      return this.quantite
    } else if (this.isSortie()) {
      return -this.quantite
    } else if (this.type === StockMovementType.INVENTAIRE) {
      return this.stockApres - this.stockAvant
    }
    return 0
  }
}
