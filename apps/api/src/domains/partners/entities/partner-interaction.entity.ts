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
import { Partner } from './partner.entity'

export enum InteractionType {
  APPEL_TELEPHONIQUE = 'APPEL_TELEPHONIQUE',
  EMAIL = 'EMAIL',
  REUNION = 'REUNION',
  VISIOCONFERENCE = 'VISIOCONFERENCE',
  VISITE_SITE = 'VISITE_SITE',
  COURRIER = 'COURRIER',
  SMS = 'SMS',
  RECLAMATION = 'RECLAMATION',
  PLAINTE = 'PLAINTE',
  AUTRE = 'AUTRE',
}

export enum InteractionStatus {
  PLANIFIE = 'PLANIFIE',
  EN_COURS = 'EN_COURS',
  TERMINEE = 'TERMINEE',
  ANNULEE = 'ANNULEE',
  REPORTEE = 'REPORTEE',
}

export enum InteractionPriority {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  URGENTE = 'URGENTE',
}

export enum InteractionDirection {
  ENTRANT = 'ENTRANT',
  SORTANT = 'SORTANT',
  INTERNE = 'INTERNE',
}

@Entity('partner_interactions')
@Index(['partnerId', 'dateInteraction'])
@Index(['userId', 'dateInteraction'])
@Index(['type', 'status'])
export class PartnerInteraction {
  [key: string]: any // Index signature for compatibility with Record<string, unknown>

  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid' })
  @Index()
  partnerId: string

  @ManyToOne(() => Partner, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'partnerId' })
  partner: Partner

  @Column({ type: 'uuid' })
  @Index()
  userId: string

  @Column({ type: 'varchar', length: 255 })
  utilisateurNom: string

  @Column({ type: 'uuid', nullable: true })
  societeId?: string

  @Column({
    type: 'enum',
    enum: InteractionType,
    default: InteractionType.AUTRE,
  })
  type: InteractionType

  @Column({ type: 'varchar', length: 255 })
  sujet: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'timestamp' })
  @Index()
  dateInteraction: Date

  @Column({
    type: 'enum',
    enum: InteractionStatus,
    default: InteractionStatus.TERMINEE,
  })
  status: InteractionStatus

  @Column({
    type: 'enum',
    enum: InteractionPriority,
    default: InteractionPriority.NORMALE,
  })
  priority: InteractionPriority

  @Column({
    type: 'enum',
    enum: InteractionDirection,
    default: InteractionDirection.SORTANT,
  })
  direction: InteractionDirection

  @Column({ type: 'integer', nullable: true })
  duree?: number // En minutes

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactId?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactNom?: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  lieu?: string

  @Column({ type: 'jsonb', nullable: true })
  participants?: Array<{
    id: string
    nom: string
    email?: string
    role?: string
  }>

  @Column({ type: 'jsonb', nullable: true })
  piecesJointes?: Array<{
    nom: string
    url: string
    taille: number
    type: string
  }>

  @Column({ type: 'text', nullable: true })
  resultat?: string

  @Column({ type: 'jsonb', nullable: true })
  actionsRequises?: Array<{
    description: string
    responsable: string
    dateEcheance?: Date
    statut: string
  }>

  @Column({ type: 'float', nullable: true })
  satisfactionScore?: number // 1-5

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>

  @Column({ type: 'jsonb', nullable: true })
  tags?: string[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @Column({ type: 'uuid', nullable: true })
  modifiePar?: string

  /**
   * Méthodes utilitaires
   */
  isCompleted(): boolean {
    return this.status === InteractionStatus.TERMINEE
  }

  isPending(): boolean {
    return this.status === InteractionStatus.PLANIFIE
  }

  isHighPriority(): boolean {
    return (
      this.priority === InteractionPriority.HAUTE || this.priority === InteractionPriority.URGENTE
    )
  }

  getDurationInHours(): number {
    return this.duree ? this.duree / 60 : 0
  }

  hasAttachments(): boolean {
    return (
      this.piecesJointes !== null &&
      this.piecesJointes !== undefined &&
      this.piecesJointes.length > 0
    )
  }

  hasActions(): boolean {
    return (
      this.actionsRequises !== null &&
      this.actionsRequises !== undefined &&
      this.actionsRequises.length > 0
    )
  }

  getOpenActions(): Array<unknown> {
    if (!this.actionsRequises) return []
    return this.actionsRequises.filter((action) => action.statut !== 'TERMINE')
  }
}
