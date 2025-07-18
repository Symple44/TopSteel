// fournisseur.entity.ts - Version corrigée
import { Column, Entity, Index } from 'typeorm'
import { BaseAuditEntity } from '../../../common/base/base.entity'

@Entity('fournisseurs')
export class Fournisseur extends BaseAuditEntity {
  @Column({ type: 'varchar', length: 255 })
  @Index()
  nom!: string

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  telephone?: string

  @Column({ type: 'text', nullable: true })
  adresse?: string

  @Column({ type: 'varchar', length: 14, nullable: true })
  siret?: string

  @Column({ type: 'boolean', default: true })
  @Index()
  actif!: boolean
}
