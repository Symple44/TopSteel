import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';

@Entity('tracabilite')
@Index(['created_at'])
export class Tracabilite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column({ nullable: true })
  numero_lot?: string;

  @Column({ nullable: true })
  projet_id?: string;

  @Column({ nullable: true })
  materiau_id?: string;

  @Column({ nullable: true })
  date_reception?: string;

  @Column({ nullable: true })
  certificat_materiau?: string;

  @Column({ nullable: true })
  operations_realisees?: string;

  @Column({ nullable: true })
  controles_effectues?: string;

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