import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';

@Entity('planning')
@Index(['created_at'])
export class Planning {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ nullable: true })
  date_debut?: string;

  @Column({ nullable: true })
  date_fin?: string;

  @Column({ nullable: true })
  machine_id?: string;

  @Column({ nullable: true })
  operateur_id?: string;

  @Column({ nullable: true })
  ordre_fabrication_id?: string;

  @Column({ nullable: true })
  statut?: string;

  @Column({ nullable: true })
  temps_estime?: string;

  @Column({ nullable: true })
  temps_reel?: string;

  @Column({ default: true })
  actif: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true })
  created_by?: string;

  @Column({ nullable: true })
  updated_by?: string;

  // Métadonnées pour l'audit
  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;
}