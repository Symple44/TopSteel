import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

export enum ArticleType {
  MATIERE_PREMIERE = 'MATIERE_PREMIERE',
  PRODUIT_FINI = 'PRODUIT_FINI',
  PRODUIT_SEMI_FINI = 'PRODUIT_SEMI_FINI',
  FOURNITURE = 'FOURNITURE',
  CONSOMMABLE = 'CONSOMMABLE',
  SERVICE = 'SERVICE'
}

export enum ArticleStatus {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  OBSOLETE = 'OBSOLETE',
  EN_COURS_CREATION = 'EN_COURS_CREATION'
}

export enum UniteStock {
  PIECE = 'PCS',
  KILOGRAMME = 'KG',
  GRAMME = 'G',
  METRE = 'M',
  CENTIMETRE = 'CM',
  MILLIMETRE = 'MM',
  METRE_CARRE = 'M2',
  METRE_CUBE = 'M3',
  LITRE = 'L',
  MILLILITRE = 'ML',
  TONNE = 'T',
  HEURE = 'H'
}

@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  societeId!: string

  @Column({ type: 'varchar', length: 30, unique: true })
  reference!: string

  @Column({ type: 'varchar', length: 255 })
  designation!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'enum', enum: ArticleType })
  type!: ArticleType

  @Column({ type: 'enum', enum: ArticleStatus, default: ArticleStatus.ACTIF })
  status!: ArticleStatus

  @Column({ type: 'varchar', length: 50, nullable: true })
  famille?: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  sousFamille?: string

  @Column({ type: 'enum', enum: UniteStock, default: UniteStock.PIECE })
  uniteStock!: UniteStock

  @Column({ type: 'boolean', default: true })
  gereEnStock!: boolean

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  stockPhysique?: number

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  stockReserve?: number

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  stockDisponible?: number

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
  prixVenteHT?: number

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  tauxTVA?: number

  @Column({ type: 'varchar', length: 30, nullable: true })
  codeEAN?: string

  // Ajouts pour marketplace
  @Column({ type: 'boolean', default: false })
  isMarketplaceEnabled!: boolean

  @Column({ type: 'jsonb', nullable: true })
  marketplaceSettings?: {
    basePrice?: number
    categories?: string[]
    description?: string
    images?: string[]
    seoTitle?: string
    seoDescription?: string
    tags?: string[]
  }

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date

  // Méthodes utilitaires
  calculerStockDisponible(): number {
    if (!this.gereEnStock) return 0
    return Math.max(0, (this.stockPhysique || 0) - (this.stockReserve || 0))
  }

  estEnRupture(): boolean {
    if (!this.gereEnStock) return false
    return this.calculerStockDisponible() <= 0
  }

  getPrixVenteTTC(): number {
    if (!this.prixVenteHT) return 0
    if (!this.tauxTVA) return this.prixVenteHT
    return this.prixVenteHT * (1 + this.tauxTVA / 100)
  }
}