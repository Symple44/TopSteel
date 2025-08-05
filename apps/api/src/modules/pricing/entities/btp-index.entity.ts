import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm'
import { TenantEntity } from '../../../core/database/entities/base/multi-tenant.entity'

export enum BTPIndexType {
  // Indices matériaux de construction
  TP01A = 'TP01A', // Travaux publics - Terrassements généraux
  TP02A = 'TP02A', // Travaux publics - Assainissement et VRD
  TP03A = 'TP03A', // Travaux publics - Construction de chaussées
  TP04A = 'TP04A', // Travaux publics - Ouvrages d'art
  TP05A = 'TP05A', // Travaux publics - Travaux souterrains
  TP06A = 'TP06A', // Travaux publics - Réseaux
  TP07A = 'TP07A', // Travaux publics - Environnement
  TP08A = 'TP08A', // Travaux publics - Travaux maritimes et fluviaux
  TP09A = 'TP09A', // Travaux publics - Fondations spéciales
  TP10A = 'TP10A', // Travaux publics - Travaux ferroviaires

  // Indices bâtiment
  BT01 = 'BT01', // Bâtiment - Gros œuvre
  BT02 = 'BT02', // Bâtiment - Clos et couvert
  BT03 = 'BT03', // Bâtiment - Second œuvre
  BT04 = 'BT04', // Bâtiment - Corps d'état techniques
  BT05 = 'BT05', // Bâtiment - Finitions
  BT06 = 'BT06', // Bâtiment - Équipements

  // Indices matières premières
  ACIER_BTP = 'ACIER_BTP', // Indice acier BTP
  BETON = 'BETON', // Indice béton
  BITUME = 'BITUME', // Indice bitume
  CARBURANT = 'CARBURANT', // Indice carburant

  // Indices salaires
  SALAIRE_TP = 'SALAIRE_TP', // Salaires travaux publics
  SALAIRE_BAT = 'SALAIRE_BAT', // Salaires bâtiment

  // Indices composite
  TP_COMPOSITE = 'TP_COMPOSITE', // Indice composite TP
  BAT_COMPOSITE = 'BAT_COMPOSITE', // Indice composite bâtiment
}

@Entity('btp_indices')
@Index(['indexType', 'month', 'year'])
export class BTPIndex extends TenantEntity {
  @Column({ type: 'enum', enum: BTPIndexType })
  @Index()
  indexType!: BTPIndexType

  @Column({ type: 'varchar', length: 100 })
  indexName!: string // Nom complet de l'indice

  @Column({ type: 'varchar', length: 10 })
  indexCode!: string // Code officiel INSEE/FFB

  @Column({ type: 'integer' })
  @Index()
  year!: number // Année

  @Column({ type: 'integer' })
  @Index()
  month!: number // Mois (1-12)

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  indexValue!: number // Valeur de l'indice

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  previousValue?: number // Valeur du mois précédent

  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  monthlyVariation?: number // Variation mensuelle en %

  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  yearlyVariation?: number // Variation annuelle en %

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  baseValue?: number // Valeur de base (base 100)

  @Column({ type: 'date' })
  publicationDate!: Date // Date de publication officielle

  @Column({ type: 'date' })
  applicationDate!: Date // Date d'application

  @Column({ type: 'boolean', default: true })
  @Index()
  isOfficial!: boolean // Indice officiel ou estimé

  @Column({ type: 'boolean', default: false })
  isProvisional!: boolean // Valeur provisoire

  // Métadonnées de l'indice
  @Column({ type: 'jsonb', default: {} })
  indexMetadata!: {
    source?: string // INSEE, FFB, etc.
    methodology?: string // Méthode de calcul
    scope?: string // Périmètre géographique
    frequency?: 'monthly' | 'quarterly' | 'yearly'
    baseYear?: number // Année de base
    weightings?: Record<string, number> // Pondérations par composant
    components?: string[] // Composants de l'indice
    seasonalAdjustment?: boolean // Ajustement saisonnier
  }

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    notes?: string
    revisions?: Array<{
      date: Date
      oldValue: number
      newValue: number
      reason: string
    }>
    alerts?: Array<{
      type: 'high_variation' | 'late_publication' | 'estimation' | 'revision'
      message: string
      severity: 'info' | 'warning' | 'error'
      date: Date
    }>
    validationStatus?: 'pending' | 'validated' | 'rejected'
    dataQuality?: number // Score de qualité 0-100
  }

  // Méthodes utilitaires
  getFormattedPeriod(): string {
    return `${this.month.toString().padStart(2, '0')}/${this.year}`
  }

  isCurrentMonth(): boolean {
    const now = new Date()
    return this.year === now.getFullYear() && this.month === now.getMonth() + 1
  }

  isOutdated(maxAgeMonths: number = 3): boolean {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    const monthsDiff = (currentYear - this.year) * 12 + (currentMonth - this.month)
    return monthsDiff > maxAgeMonths
  }

  hasSignificantVariation(threshold: number = 5): boolean {
    return (
      Math.abs(this.monthlyVariation || 0) > threshold ||
      Math.abs(this.yearlyVariation || 0) > threshold
    )
  }

  calculateCoefficient(baseIndex: number): number {
    if (baseIndex === 0) return 1
    return this.indexValue / baseIndex
  }

  addRevision(oldValue: number, newValue: number, reason: string): void {
    if (!this.metadata) this.metadata = {}
    if (!this.metadata.revisions) this.metadata.revisions = []

    this.metadata.revisions.push({
      date: new Date(),
      oldValue,
      newValue,
      reason,
    })
  }

  addAlert(
    type: 'high_variation' | 'late_publication' | 'estimation' | 'revision',
    message: string,
    severity: 'info' | 'warning' | 'error' = 'info'
  ): void {
    if (!this.metadata) this.metadata = {}
    if (!this.metadata.alerts) this.metadata.alerts = []

    this.metadata.alerts.push({
      type,
      message,
      severity,
      date: new Date(),
    })
  }

  validate(): string[] {
    const errors: string[] = []

    if (!this.indexType) {
      errors.push("Le type d'indice est requis")
    }

    if (!this.year || this.year < 1990 || this.year > new Date().getFullYear() + 1) {
      errors.push("L'année doit être comprise entre 1990 et l'année prochaine")
    }

    if (!this.month || this.month < 1 || this.month > 12) {
      errors.push('Le mois doit être compris entre 1 et 12')
    }

    if (!this.indexValue || this.indexValue <= 0) {
      errors.push("La valeur de l'indice doit être positive")
    }

    if (this.monthlyVariation !== null && this.monthlyVariation !== undefined) {
      if (Math.abs(this.monthlyVariation) > 50) {
        errors.push('La variation mensuelle semble anormale (> 50%)')
      }
    }

    if (this.yearlyVariation !== null && this.yearlyVariation !== undefined) {
      if (Math.abs(this.yearlyVariation) > 100) {
        errors.push('La variation annuelle semble anormale (> 100%)')
      }
    }

    return errors
  }
}
