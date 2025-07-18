// apps/api/src/modules/machines/entities/machine.entity.ts
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('machines')
export class Machine {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  nom?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  typeMachine?: string // ← camelCase cohérent

  @Column({ type: 'varchar', length: 100, nullable: true })
  marque?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  modele?: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  puissance?: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  capaciteMax?: string // ← camelCase cohérent

  @Column({ type: 'varchar', length: 50, nullable: true })
  statut?: string

  @Column({ type: 'date', nullable: true })
  dateMiseService?: Date // ← Type Date cohérent

  @Column({ type: 'date', nullable: true })
  prochaineMaintenance?: Date // ← Type Date cohérent

  @Column({ type: 'boolean', default: true })
  actif!: boolean

  @CreateDateColumn()
  createdAt!: Date // ← camelCase cohérent

  @UpdateDateColumn()
  updatedAt!: Date // ← camelCase cohérent

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string // ← camelCase cohérent

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string // ← camelCase cohérent

  // Métadonnées pour l'audit
  @Column('jsonb', { nullable: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>
}
