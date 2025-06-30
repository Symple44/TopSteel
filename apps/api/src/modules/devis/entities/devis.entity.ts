import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('devis')
@Index(['numero'])
@Index(['clientId'])
@Index(['projetId'])
export class Devis {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  numero!: string;

  @Column({ nullable: true })
  projetId?: string;

  @Column({ nullable: true })
  clientId?: string;

  @Column({ type: 'timestamp', nullable: true })
  dateValidite?: Date;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0 })
  totalHT?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0 })
  totalTTC?: number;

  @Column({ enum: ['BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE', 'EXPIRE'], default: 'BROUILLON' })
  statut?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}