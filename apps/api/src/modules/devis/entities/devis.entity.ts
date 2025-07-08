import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { BaseAuditEntity } from '../../../common/base/base.entity'
import { Clients } from '../../clients/entities/clients.entity'
import { Projet } from '../../projets/entities/projet.entity'
import { User } from '../../users/entities/user.entity'
import { LigneDevis } from './ligne-devis.entity'

export enum DevisStatut {
  BROUILLON = 'BROUILLON',
  ENVOYE = 'ENVOYE',
  ACCEPTE = 'ACCEPTE',
  REFUSE = 'REFUSE',
  EXPIRE = 'EXPIRE',
}

@Entity('devis')
export class Devis extends BaseAuditEntity {
  @Column({ unique: true, length: 50 })
  reference!: string

  @Column()
  clientId!: string

  @ManyToOne(() => Clients)
  @JoinColumn({ name: 'clientId' })
  client!: Clients

  @Column({ nullable: true })
  projetId?: string

  @ManyToOne(() => Projet, { nullable: true })
  @JoinColumn({ name: 'projetId' })
  projet?: Projet

  @Column({
    type: 'enum',
    enum: DevisStatut,
    default: DevisStatut.BROUILLON,
  })
  statut!: DevisStatut

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  dateCreation!: Date

  @Column({ type: 'date', nullable: true })
  dateEnvoi?: Date

  @Column({ type: 'date', nullable: true })
  dateValidite?: Date

  @Column({ type: 'date', nullable: true })
  dateReponse?: Date

  @Column('text', { nullable: true })
  conditions?: string

  @Column('text', { nullable: true })
  notes?: string

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  sousTotal!: number

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  remiseGlobale!: number

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalHT!: number

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalTVA!: number

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalTTC!: number

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  marge!: number

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  tauxMarge!: number

  @Column({ length: 500, nullable: true })
  fichierPDF?: string

  @Column({ nullable: true })
  commercialId?: string

  @Column({ type: 'jsonb', nullable: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'commercialId' })
  commercial?: User

  @OneToMany(
    () => LigneDevis,
    (ligne) => ligne.devis,
    { cascade: true }
  )
  lignes!: LigneDevis[]

  @Column({ default: true })
  @Index()
  actif!: boolean
}
