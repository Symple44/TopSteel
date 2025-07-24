import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm'
import { CommonEntity } from '../../../database/entities/base/multi-tenant.entity'
import { Societe } from './societe.entity'

export enum SiteType {
  PRODUCTION = 'PRODUCTION',
  WAREHOUSE = 'WAREHOUSE',
  OFFICE = 'OFFICE',
  MIXED = 'MIXED'
}

@Entity('sites')
export class Site extends CommonEntity {
  @Column({ type: 'uuid' })
  @Index()
  societeId!: string

  @ManyToOne(() => Societe, societe => societe.sites)
  @JoinColumn({ name: 'societe_id' })
  societe!: Societe

  @Column({ type: 'varchar', length: 255 })
  @Index()
  nom!: string

  @Column({ type: 'varchar', length: 50 })
  @Index()
  code!: string // Code unique du site dans la société

  @Column({
    type: 'enum',
    enum: SiteType,
    default: SiteType.PRODUCTION
  })
  type!: SiteType

  @Column({ type: 'boolean', default: false })
  isPrincipal!: boolean // Site principal de la société

  @Column({ type: 'boolean', default: true })
  @Index()
  actif!: boolean

  // Adresse du site
  @Column({ type: 'text', nullable: true })
  adresse?: string

  @Column({ type: 'varchar', length: 10, nullable: true })
  codePostal?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  ville?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  pays?: string

  // Contact
  @Column({ type: 'varchar', length: 100, nullable: true })
  responsable?: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  telephone?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string

  // Capacités et ressources
  @Column({ type: 'integer', default: 0 })
  nombreEmployes!: number

  @Column({ type: 'integer', default: 0 })
  nombreMachines!: number

  @Column({ type: 'float', nullable: true })
  surfaceM2?: number

  // Configuration spécifique au site
  @Column({ type: 'jsonb', default: {} })
  configuration!: {
    horaires?: {
      lundi?: { debut: string; fin: string }
      mardi?: { debut: string; fin: string }
      mercredi?: { debut: string; fin: string }
      jeudi?: { debut: string; fin: string }
      vendredi?: { debut: string; fin: string }
      samedi?: { debut: string; fin: string }
      dimanche?: { debut: string; fin: string }
    }
    joursFerier?: string[]
    capaciteProduction?: Record<string, any>
  }

  // Métadonnées
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>
}