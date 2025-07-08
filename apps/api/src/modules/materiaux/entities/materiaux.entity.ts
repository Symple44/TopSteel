import { Column, Entity, Index } from 'typeorm'
import { BaseAuditEntity } from '../../../common/base/base.entity'

@Entity('materiaux')
export class Materiaux extends BaseAuditEntity {
  @Column({ length: 255 })
  @Index()
  nom!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  stockMinimum?: number

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  stockMaximum?: number

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  seuilAlerte?: number

  @Column({ length: 100, nullable: true })
  emplacement?: string

  @Column({ type: 'date', nullable: true })
  dateLastInventaire?: Date

  @Column({ default: true })
  @Index()
  actif!: boolean

  @Column({ type: 'jsonb', nullable: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>
}

export enum MateriauxStatut {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  ARCHIVE = 'ARCHIVE',
}
