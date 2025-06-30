import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('production')
@Index(['numero'])
@Index(['projetId'])
@Index(['statut'])
@Index(['priorite'])
export class Production {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  numero!: string;

  @Column({ nullable: true })
  projetId?: string;

  @Column({ enum: ['EN_ATTENTE', 'PLANIFIE', 'EN_COURS', 'TERMINE', 'ANNULE', 'PAUSE'], default: 'EN_ATTENTE' })
  statut!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ enum: ['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'], default: 'NORMALE' })
  priorite!: string;

  @Column({ type: 'timestamp', nullable: true })
  dateDebut?: Date;

  @Column({ type: 'timestamp', nullable: true })
  dateFin?: Date;

  @Column({ type: 'timestamp', nullable: true })
  datePlanifiee?: Date;

  @Column({ nullable: true })
  responsableId?: string;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  progression?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}