import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { BaseAuditEntity } from '../../../common/base/base.entity'
import { Devis } from './devis.entity'

@Entity('lignes_devis')
export class LigneDevis extends BaseAuditEntity {
  @Column({ type: 'uuid' })
  devisId!: string

  @ManyToOne(
    () => Devis,
    (devis) => devis.lignes,
    { onDelete: 'CASCADE' }
  )
  @JoinColumn({ name: 'devisId' })
  devis!: Devis

  @Column({ type: 'varchar', length: 500 })
  designation!: string

  @Column('text', { nullable: true })
  description?: string

  @Column('decimal', { precision: 8, scale: 2 })
  quantite!: number

  @Column({ type: 'varchar', length: 10 })
  unite!: string

  @Column('decimal', { precision: 8, scale: 2 })
  prixUnitaire!: number

  @Column('decimal', { precision: 5, scale: 2, default: 20 })
  tauxTVA!: number

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  remise!: number

  @Column('decimal', { precision: 10, scale: 2 })
  totalHT!: number

  @Column({ type: 'uuid', nullable: true })
  produitId?: string

  @Column({ type: 'integer' })
  ordreLigne!: number

  @Column({ type: 'jsonb', nullable: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>
}
