import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('controle_qualite')
export class ControleQualite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  ordre_fabrication_id?: string;

  @Column({ nullable: true })
  type_controle?: string;

  @Column({ nullable: true })
  norme_reference?: string;

  @Column({ nullable: true })
  resultat?: string;

  @Column({ nullable: true })
  conforme?: string;

  @Column({ nullable: true })
  observateur_id?: string;

  @Column({ nullable: true })
  certificat_path?: string;

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

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;
}