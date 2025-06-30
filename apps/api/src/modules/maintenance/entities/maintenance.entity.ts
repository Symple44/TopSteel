import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('maintenance')
@Index(['created_at'])
export class Maintenance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column({ nullable: true })
  machine_id?: string;

  @Column({ nullable: true })
  type_maintenance?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  date_programmee?: string;

  @Column({ nullable: true })
  date_realisee?: string;

  @Column({ nullable: true })
  duree?: string;

  @Column({ nullable: true })
  cout?: string;

  @Column({ nullable: true })
  technicien_id?: string;

  @Column({ nullable: true })
  pieces_changees?: string;

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

