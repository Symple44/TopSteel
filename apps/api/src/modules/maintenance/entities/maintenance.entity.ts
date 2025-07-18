import { Column, Entity, Index } from 'typeorm'
import { BaseAuditEntity } from '../../../common/base/base.entity'

@Entity('maintenances')
export class Maintenance extends BaseAuditEntity {
  @Column({ type: 'varchar', length: 255 })
  @Index()
  nom!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'boolean', default: true })
  @Index()
  actif!: boolean

  @Column({ type: 'jsonb', nullable: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>
}

export enum MaintenanceStatut {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  ARCHIVE = 'ARCHIVE',
}
