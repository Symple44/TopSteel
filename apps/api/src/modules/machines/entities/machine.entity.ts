// apps/api/src/modules/machines/entities/machine.entity.ts
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('machines')
@Index(['createdAt']) // ← camelCase cohérent
export class Machine {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  nom?: string;

  @Column({ nullable: true })
  typeMachine?: string; // ← camelCase cohérent

  @Column({ nullable: true })
  marque?: string;

  @Column({ nullable: true })
  modele?: string;

  @Column({ nullable: true })
  puissance?: string;

  @Column({ nullable: true })
  capaciteMax?: string; // ← camelCase cohérent

  @Column({ nullable: true })
  statut?: string;

  @Column({ type: 'date', nullable: true })
  dateMiseService?: Date; // ← Type Date cohérent

  @Column({ type: 'date', nullable: true })
  prochaineMaintenance?: Date; // ← Type Date cohérent

  @Column({ default: true })
  actif!: boolean;

  @CreateDateColumn()
  createdAt!: Date; // ← camelCase cohérent

  @UpdateDateColumn()
  updatedAt!: Date; // ← camelCase cohérent

  @Column({ nullable: true })
  createdBy?: string; // ← camelCase cohérent

  @Column({ nullable: true })
  updatedBy?: string; // ← camelCase cohérent

  // Métadonnées pour l'audit
  @Column('jsonb', { nullable: true })
  metadata?: Record<string, unknown>;
}