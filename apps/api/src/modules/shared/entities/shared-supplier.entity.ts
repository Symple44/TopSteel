import { Column, Entity, Index } from 'typeorm'
import { BaseAuditEntity } from '../../../database/entities/base/multi-tenant.entity'

export enum SupplierType {
  FABRICANT = 'FABRICANT',
  DISTRIBUTEUR = 'DISTRIBUTEUR',
  GROSSISTE = 'GROSSISTE',
  IMPORTATEUR = 'IMPORTATEUR',
  TRANSFORMATEUR = 'TRANSFORMATEUR',
  AUTRE = 'AUTRE'
}

export enum SupplierCategory {
  MATERIAUX = 'MATERIAUX',
  OUTILLAGE = 'OUTILLAGE',
  CONSOMMABLES = 'CONSOMMABLES',
  SERVICES = 'SERVICES',
  TRANSPORT = 'TRANSPORT',
  SOUS_TRAITANCE = 'SOUS_TRAITANCE',
  AUTRE = 'AUTRE'
}

/**
 * Fournisseurs communs partagés entre sociétés
 * Stocké dans la base SHARED
 */
@Entity('shared_suppliers')
@Index(['code', 'type'])
export class SharedSupplier extends BaseAuditEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  code!: string // Code unique du fournisseur

  @Column({ type: 'varchar', length: 255 })
  @Index()
  raisonSociale!: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  nomCommercial?: string

  @Column({
    type: 'enum',
    enum: SupplierType
  })
  @Index()
  type!: SupplierType

  @Column({
    type: 'enum',
    enum: SupplierCategory,
    array: true
  })
  categories!: SupplierCategory[]

  // Informations légales
  @Column({ type: 'varchar', length: 20, nullable: true })
  @Index()
  siret?: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  numeroTva?: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  rcsPays?: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  formeJuridique?: string

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  capitalSocial?: number

  // Coordonnées principales
  @Column({ type: 'jsonb', default: {} })
  coordonnees!: {
    adresse?: string
    codePostal?: string
    ville?: string
    pays?: string
    telephone?: string
    fax?: string
    email?: string
    siteWeb?: string
  }

  // Contacts
  @Column({ type: 'jsonb', default: [] })
  contacts!: Array<{
    nom?: string
    prenom?: string
    fonction?: string
    telephone?: string
    mobile?: string
    email?: string
    principal?: boolean
  }>

  // Données commerciales générales
  @Column({ type: 'jsonb', default: {} })
  donneesCommerciales!: {
    delaiPaiement?: number // jours
    modePaiement?: string[]
    devise?: string
    incoterm?: string
    langues?: string[]
    horairesOuverture?: Record<string, string>
  }

  // Spécialités et produits
  @Column({ type: 'simple-array', nullable: true })
  specialites?: string[]

  @Column({ type: 'jsonb', nullable: true })
  catalogueProduits?: {
    familles?: string[]
    marques?: string[]
    certifications?: string[]
  }

  // Zones de livraison
  @Column({ type: 'jsonb', default: {} })
  zonesLivraison!: {
    pays?: string[]
    regions?: string[]
    departements?: string[]
    delaiMoyen?: number // jours
    franco?: number // montant minimum pour franco
  }

  // Certifications et qualifications
  @Column({ type: 'jsonb', default: {} })
  certifications!: {
    iso?: string[]
    qualite?: string[]
    environnement?: string[]
    securite?: string[]
    autres?: string[]
  }

  // Évaluation générale (sans détails par société)
  @Column({ type: 'jsonb', default: {} })
  evaluation!: {
    noteGlobale?: number // sur 5
    nombreEvaluations?: number
    fiabilite?: number
    qualite?: number
    delais?: number
    serviceClient?: number
  }

  // Métadonnées
  @Column({ type: 'simple-array', nullable: true })
  tags?: string[]

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>
}