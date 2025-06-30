// apps/api/src/modules/maintenance/entities/maintenance.entity.ts
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('maintenance')
@Index(['createdAt']) // ✅ CORRIGÉ : camelCase cohérent
export class Maintenance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  machineId?: string; // ✅ CORRIGÉ : camelCase cohérent

  @Column({ nullable: true })
  typeMaintenance?: string; // ✅ CORRIGÉ : camelCase cohérent

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'timestamp', nullable: true })
  dateProgrammee?: Date; // ✅ CORRIGÉ : camelCase + type Date cohérent

  @Column({ type: 'timestamp', nullable: true })
  dateRealisee?: Date; // ✅ CORRIGÉ : camelCase + type Date cohérent

  @Column({ nullable: true })
  duree?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cout?: number; // ✅ AMÉLIORÉ : type decimal pour les coûts

  @Column({ nullable: true })
  technicienId?: string; // ✅ CORRIGÉ : camelCase cohérent

  @Column({ type: 'text', nullable: true })
  piecesChangees?: string; // ✅ CORRIGÉ : camelCase cohérent

  @Column({ default: true })
  actif!: boolean;

  @CreateDateColumn()
  createdAt!: Date; // ✅ CORRIGÉ : camelCase cohérent

  @UpdateDateColumn()
  updatedAt!: Date; // ✅ CORRIGÉ : camelCase cohérent

  @Column({ nullable: true })
  createdBy?: string; // ✅ CORRIGÉ : camelCase cohérent

  @Column({ nullable: true })
  updatedBy?: string; // ✅ CORRIGÉ : camelCase cohérent

  // Métadonnées pour l'audit
  @Column('jsonb', { nullable: true })
  metadata?: Record<string, unknown>;
}