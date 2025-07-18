import { Column, Entity, Index } from 'typeorm'
import { BaseAuditEntity } from '../../../common/base/base.entity'

@Entity('tracabilites')
export class Tracabilite extends BaseAuditEntity {
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

export enum TracabiliteStatut {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  ARCHIVE = 'ARCHIVE',
}
