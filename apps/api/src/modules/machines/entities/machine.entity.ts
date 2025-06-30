import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('machines')
@Index(['created_at'])
export class Machine {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column({ nullable: true })
  nom?: string;

  @Column({ nullable: true })
  type_machine?: string;

  @Column({ nullable: true })
  marque?: string;

  @Column({ nullable: true })
  modele?: string;

  @Column({ nullable: true })
  puissance?: string;

  @Column({ nullable: true })
  capacite_max?: string;

  @Column({ nullable: true })
  statut?: string;

  @Column({ nullable: true })
  date_mise_service?: string;

  @Column({ nullable: true })
  prochaine_maintenance?: string;

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
  metadata?: Record<string, unknown>;
}

