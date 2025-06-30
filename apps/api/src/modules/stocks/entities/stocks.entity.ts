import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('stocks')
@Index(['reference'])
@Index(['designation'])
@Index(['emplacement'])
export class Stocks {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  reference!: string;

  @Column()
  designation!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column('decimal', { precision: 10, scale: 3, default: 0 })
  quantiteStock?: number;

  @Column('decimal', { precision: 10, scale: 3, default: 0 })
  quantiteMin?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  prixAchat?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  prixVente?: number;

  @Column({ nullable: true })
  emplacement?: string;

  @Column({ nullable: true })
  fournisseurId?: string;

  @Column({ nullable: true })
  categorieId?: string;

  @Column({ default: true })
  actif!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}