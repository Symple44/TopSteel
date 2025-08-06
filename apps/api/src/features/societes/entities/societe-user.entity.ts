import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm'
import { CommonEntity } from '../../../core/database/entities/base/multi-tenant.entity'
import { User } from '../../../domains/users/entities/user.entity'
import { Societe } from './societe.entity'

export enum UserSocieteRole {
  OWNER = 'OWNER', // Propriétaire de la société
  ADMIN = 'ADMIN', // Administrateur société
  MANAGER = 'MANAGER', // Manager/Responsable
  USER = 'USER', // Utilisateur standard
  VIEWER = 'VIEWER', // Lecture seule
  GUEST = 'GUEST', // Invité temporaire
}

@Entity('societe_users')
@Index(['userId', 'societeId'], { unique: true })
export class SocieteUser extends CommonEntity {
  @Column({ type: 'uuid' })
  @Index()
  userId!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User

  @Column({ type: 'uuid' })
  @Index()
  societeId!: string

  @ManyToOne(() => Societe)
  @JoinColumn({ name: 'societeId' })
  societe!: Societe

  @Column({
    type: 'enum',
    enum: UserSocieteRole,
    default: UserSocieteRole.USER,
  })
  role!: UserSocieteRole

  @Column({ type: 'boolean', default: true })
  @Index()
  actif!: boolean

  @Column({ type: 'boolean', default: false })
  isDefault!: boolean // Société par défaut pour cet utilisateur

  // Permissions spécifiques à cette société
  @Column({ type: 'jsonb', default: [] })
  permissions!: string[] // Permissions additionnelles

  @Column({ type: 'jsonb', default: [] })
  restrictedPermissions!: string[] // Permissions retirées

  // Sites autorisés (null = tous les sites)
  @Column({ type: 'uuid', array: true, nullable: true })
  allowedSiteIds?: string[]

  // Dates de validité
  @Column({ type: 'timestamp', nullable: true })
  dateDebut?: Date

  @Column({ type: 'timestamp', nullable: true })
  dateFin?: Date

  // Dernière activité
  @Column({ type: 'timestamp', nullable: true })
  lastActivityAt?: Date

  // Préférences utilisateur pour cette société
  @Column({ type: 'jsonb', default: {} })
  preferences!: {
    defaultSiteId?: string
    dashboard?: Record<string, unknown>
    notifications?: Record<string, boolean>
  }

  // Métadonnées - DISABLED: column doesn't exist in database
  // @Column({ type: 'jsonb', nullable: true })
  // metadata?: Record<string, any>
}
