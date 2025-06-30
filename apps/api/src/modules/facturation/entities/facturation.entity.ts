import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('facturation')
@Index(['numero'])
@Index(['clientId'])
@Index(['projetId'])
@Index(['statut'])
export class Facturation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  numero!: string;

  @Column({ nullable: true })
  projetId?: string;

  @Column({ nullable: true })
  clientId?: string;

  @Column({ type: 'timestamp', nullable: true })
  dateFacturation?: Date;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0 })
  montantHT?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0 })
  montantTTC?: number;

  @Column({ enum: ['BROUILLON', 'ENVOYEE', 'PAYEE', 'ANNULEE'], default: 'BROUILLON' })
  statut?: string;

  @Column({ type: 'timestamp', nullable: true })
  dateEcheance?: Date;

  @Column({ nullable: true })
  devisId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}