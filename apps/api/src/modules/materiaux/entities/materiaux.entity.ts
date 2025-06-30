import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('materiaux')
@Index(['created_at'])
export class Materiau {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column({ nullable: true })
  reference?: string;

  @Column({ nullable: true })
  designation?: string;

  @Column({ nullable: true })
  type_acier?: string;

  @Column({ nullable: true })
  nuance?: string;

  @Column({ nullable: true })
  epaisseur?: string;

  @Column({ nullable: true })
  largeur?: string;

  @Column({ nullable: true })
  longueur?: string;

  @Column({ nullable: true })
  poids_unitaire?: string;

  @Column({ nullable: true })
  prix_kg?: string;

  @Column({ nullable: true })
  stock_mini?: string;

  @Column({ nullable: true })
  fournisseur_principal?: string;

  @Column({ default: true })
  actif!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @Column({ nullable: true })
  created_by?: string;

  @Column({ nullable: true })
  updated_by?: string;

  // Métadonnées pour l'audit
  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;
}
