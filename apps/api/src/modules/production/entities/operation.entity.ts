import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { OrdreFabrication } from './ordre-fabrication.entity'

export enum OperationStatut {
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE',
}

export enum OperationType {
  DECOUPE = 'DECOUPE',
  SOUDURE = 'SOUDURE',
  PERCAGE = 'PERCAGE',
  PLIAGE = 'PLIAGE',
  USINAGE = 'USINAGE',
  ASSEMBLAGE = 'ASSEMBLAGE',
  FINITION = 'FINITION',
  CONTROLE = 'CONTROLE',
}

@Entity('operations')
export class Operation {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  nom!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({
    type: 'enum',
    enum: OperationType,
    default: OperationType.DECOUPE,
  })
  type!: OperationType

  @Column({
    type: 'enum',
    enum: OperationStatut,
    default: OperationStatut.EN_ATTENTE,
  })
  statut!: OperationStatut

  @Column({ name: 'ordre_fabrication_id' })
  ordreFabricationId!: number

  @ManyToOne(
    () => OrdreFabrication,
    (ordre) => ordre.operations,
    { onDelete: 'CASCADE' }
  )
  @JoinColumn({ name: 'ordre_fabrication_id' })
  ordre!: OrdreFabrication

  @Column({ type: 'int', default: 1 })
  ordreExecution!: number

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  dureeEstimee?: number

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  dureeReelle?: number

  @Column({ name: 'machine_id', nullable: true })
  machineId?: number

  @Column({ name: 'technicien_id', nullable: true })
  technicienId?: number

  @Column({ type: 'timestamp', name: 'date_debut', nullable: true })
  dateDebut?: Date

  @Column({ type: 'timestamp', name: 'date_fin', nullable: true })
  dateFin?: Date

  @Column({ type: 'text', nullable: true })
  notes?: string

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
