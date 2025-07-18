import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Clients } from '../../clients/entities/clients.entity'
import { User } from '../../users/entities/user.entity'

export enum ProjetStatut {
  BROUILLON = 'brouillon',
  EN_COURS = 'en_cours',
  TERMINE = 'termine',
  ANNULE = 'annule',
}

@Entity('projets')
export class Projet {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'varchar', length: 255 })
  nom!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({
    type: 'enum',
    enum: ProjetStatut,
    default: ProjetStatut.BROUILLON,
  })
  statut!: ProjetStatut

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  montantTotal?: number

  @Column({ type: 'date', nullable: true })
  dateDebut?: Date

  @Column({ type: 'date', nullable: true })
  dateFin?: Date

  @Column({ type: 'int', nullable: true })
  clientId?: number

  @Column({ type: 'int', nullable: true })
  responsableId?: number

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  @ManyToOne(() => Clients, { nullable: true })
  @JoinColumn({ name: 'clientId' })
  client?: Clients

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'responsableId' })
  responsable?: User
}
