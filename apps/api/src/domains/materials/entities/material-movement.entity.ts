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
  type IMaterialTraceabilityInfo,
  type IMaterialTransformationInfo,
  MaterialMovementPriority,
  MaterialMovementReason,
  MaterialMovementStatus,
  MaterialMovementType,
} from '../interfaces/material-movement.interface'
import { Material } from './material.entity'

/**
 * Entité pour les mouvements de matériaux
 */
@Entity('material_movements')
@Index(['materialId', 'dateCreation'])
@Index(['reference'], { unique: true })
@Index(['type', 'status'])
@Index(['dateCreation'])
@Index(['numeroLot'])
@Index(['projetId'])
@Index(['commandeId'])
export class MaterialMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string

  /** Référence unique du mouvement */
  @Column({ unique: true })
  reference: string

  /** Matériau concerné */
  @Column('uuid')
  materialId: string

  @ManyToOne(() => Material, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'materialId' })
  material?: Material

  /** Type de mouvement */
  @Column({
    type: 'enum',
    enum: MaterialMovementType,
  })
  type: MaterialMovementType

  /** Motif du mouvement */
  @Column({
    type: 'enum',
    enum: MaterialMovementReason,
  })
  motif: MaterialMovementReason

  /** Priorité du mouvement */
  @Column({
    type: 'enum',
    enum: MaterialMovementPriority,
    default: MaterialMovementPriority.NORMALE,
  })
  priorite: MaterialMovementPriority

  /** Statut du mouvement */
  @Column({
    type: 'enum',
    enum: MaterialMovementStatus,
    default: MaterialMovementStatus.BROUILLON,
  })
  status: MaterialMovementStatus

  /** Quantité du mouvement */
  @Column('decimal', { precision: 12, scale: 3 })
  quantite: number

  /** Unité de mesure */
  @Column()
  unite: string

  /** Poids total du mouvement */
  @Column('decimal', { precision: 12, scale: 3, nullable: true })
  poidsTotal?: number

  /** Volume total du mouvement */
  @Column('decimal', { precision: 12, scale: 3, nullable: true })
  volumeTotal?: number

  /** Stock avant le mouvement */
  @Column('decimal', { precision: 12, scale: 3 })
  stockAvant: number

  /** Stock après le mouvement */
  @Column('decimal', { precision: 12, scale: 3 })
  stockApres: number

  /** Valeur unitaire */
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  valeurUnitaire?: number

  /** Valeur totale */
  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  valeurTotale?: number

  /** Devise */
  @Column({ nullable: true, default: 'EUR' })
  devise?: string

  /** Date du mouvement */
  @Column('timestamp')
  dateMovement: Date

  /** Date prévue */
  @Column('timestamp', { nullable: true })
  datePrevue?: Date

  /** Emplacement source */
  @Column({ nullable: true })
  emplacementSource?: string

  /** Emplacement destination */
  @Column({ nullable: true })
  emplacementDestination?: string

  /** Zone source */
  @Column({ nullable: true })
  zoneSource?: string

  /** Zone destination */
  @Column({ nullable: true })
  zoneDestination?: string

  /** Informations de traçabilité */
  @Column('jsonb', { nullable: true })
  tracabilite?: IMaterialTraceabilityInfo

  /** Informations de transformation */
  @Column('jsonb', { nullable: true })
  transformation?: IMaterialTransformationInfo

  /** Numéro de lot */
  @Column({ nullable: true })
  numeroLot?: string

  /** Numéro de série */
  @Column({ nullable: true })
  numeroSerie?: string

  /** Certificat matière */
  @Column({ nullable: true })
  certificatMatiere?: string

  /** Numéro de coulée */
  @Column({ nullable: true })
  numeroCoulee?: string

  /** Document source */
  @Column('uuid', { nullable: true })
  documentSourceId?: string

  /** Type de document source */
  @Column({ nullable: true })
  typeDocumentSource?: string

  /** Numéro du document source */
  @Column({ nullable: true })
  numeroDocumentSource?: string

  /** Ordre de fabrication */
  @Column('uuid', { nullable: true })
  ordreFabricationId?: string

  /** Commande */
  @Column('uuid', { nullable: true })
  commandeId?: string

  /** Projet */
  @Column('uuid', { nullable: true })
  projetId?: string

  /** Utilisateur ayant créé le mouvement */
  @Column('uuid')
  utilisateurId: string

  /** Nom de l'utilisateur */
  @Column()
  utilisateurNom: string

  /** Validateur */
  @Column('uuid', { nullable: true })
  validateurId?: string

  /** Nom du validateur */
  @Column({ nullable: true })
  validateurNom?: string

  /** Date de validation */
  @Column('timestamp', { nullable: true })
  dateValidation?: Date

  /** Commentaires de validation */
  @Column('text', { nullable: true })
  commentairesValidation?: string

  /** Contrôle qualité */
  @Column('jsonb', { nullable: true })
  controleQualite?: {
    effectue: boolean
    conforme?: boolean
    controleur?: string
    dateControle?: Date
    commentaires?: string
    mesures?: Record<string, number>
    defauts?: string[]
  }

  /** Conditions de stockage */
  @Column('jsonb', { nullable: true })
  conditionsStockage?: {
    temperature?: number
    humidite?: number
    atmosphere?: string
    protection?: string[]
    precautions?: string[]
  }

  /** Informations de transport */
  @Column('jsonb', { nullable: true })
  transport?: {
    transporteurId?: string
    transporteurNom?: string
    numeroLivraison?: string
    dateExpedition?: Date
    dateLivraisonPrevue?: Date
    dateLivraisonReelle?: Date
    conditionsTransport?: string
    emballage?: string
  }

  /** Coûts associés */
  @Column('jsonb', { nullable: true })
  couts?: {
    coutMateriau?: number
    coutMain?: number
    coutMachine?: number
    coutTransport?: number
    coutStockage?: number
    coutTotal?: number
    devise?: string
  }

  /** Documents attachés */
  @Column('jsonb', { nullable: true })
  documents?: {
    photos?: string[]
    bonLivraison?: string
    certificats?: string[]
    rapportControle?: string
    autresDocuments?: string[]
  }

  /** Notes internes */
  @Column('text', { nullable: true })
  notes?: string

  /** Métadonnées JSON */
  @Column('jsonb', { nullable: true })
  metadonnees?: Record<string, unknown>

  /** Historique des modifications */
  @Column('jsonb', { nullable: true })
  historiqueModifications?: {
    date: Date
    utilisateur: string
    champ: string
    ancienneValeur: unknown
    nouvelleValeur: unknown
  }[]

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

  /** Vérifier si le mouvement peut être validé */
  canBeValidated(): boolean {
    return [
      MaterialMovementStatus.BROUILLON,
      MaterialMovementStatus.EN_ATTENTE_VALIDATION,
    ].includes(this.status)
  }

  /** Vérifier si le mouvement peut être annulé */
  canBeCancelled(): boolean {
    return this.status !== MaterialMovementStatus.ANNULE
  }

  /** Vérifier si le mouvement peut être traité */
  canBeProcessed(): boolean {
    return this.status === MaterialMovementStatus.VALIDE
  }

  /** Vérifier si le mouvement est une entrée */
  isEntree(): boolean {
    return [MaterialMovementType.ENTREE, MaterialMovementType.RETOUR].includes(this.type)
  }

  /** Vérifier si le mouvement est une sortie */
  isSortie(): boolean {
    return [MaterialMovementType.SORTIE, MaterialMovementType.PERTE].includes(this.type)
  }

  /** Vérifier si le mouvement est une transformation */
  isTransformation(): boolean {
    return [
      MaterialMovementType.TRANSFORMATION,
      MaterialMovementType.ASSEMBLAGE,
      MaterialMovementType.DESASSEMBLAGE,
    ].includes(this.type)
  }

  /** Calculer l'impact sur le stock */
  getStockImpact(): number {
    if (this.isEntree()) {
      return this.quantite
    } else if (this.isSortie()) {
      return -this.quantite
    } else if (this.type === MaterialMovementType.INVENTAIRE) {
      return this.stockApres - this.stockAvant
    } else if (this.type === MaterialMovementType.CORRECTION) {
      return this.quantite // Peut être positif ou négatif
    }
    return 0
  }

  /** Obtenir le statut de conformité */
  getConformiteStatus(): 'CONFORME' | 'NON_CONFORME' | 'NON_CONTROLE' {
    if (!this.controleQualite?.effectue) {
      return 'NON_CONTROLE'
    }
    return this.controleQualite.conforme ? 'CONFORME' : 'NON_CONFORME'
  }

  /** Calculer le coût total */
  calculateCoutTotal(): number {
    if (!this.couts) return 0

    return (
      (this.couts.coutMateriau || 0) +
      (this.couts.coutMain || 0) +
      (this.couts.coutMachine || 0) +
      (this.couts.coutTransport || 0) +
      (this.couts.coutStockage || 0)
    )
  }
}
