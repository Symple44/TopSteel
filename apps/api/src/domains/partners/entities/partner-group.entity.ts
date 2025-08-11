import { BusinessEntity } from '@erp/entities'
import { Column, Entity, Index, OneToMany } from 'typeorm'
import { Partner } from './partner.entity'

export enum GroupType {
  TARIFF = 'TARIFF', // Groupe tarifaire
  COMMERCIAL = 'COMMERCIAL', // Groupe commercial
  SECTOR = 'SECTOR', // Secteur d'activité
  CUSTOM = 'CUSTOM', // Groupe personnalisé
}

export enum GroupStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Entité métier : Groupe de partenaires
 * Permet de regrouper les clients/fournisseurs pour appliquer des règles communes
 */
@Entity('partner_groups')
export class PartnerGroup extends BusinessEntity {
  @Column({ type: 'varchar', length: 20, unique: true })
  @Index()
  code!: string // Code unique : GRP001, VIP, GROSSISTE, etc.

  @Column({ type: 'varchar', length: 100 })
  @Index()
  name!: string // Nom du groupe

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'enum', enum: GroupType, default: GroupType.TARIFF })
  @Index()
  type!: GroupType

  @Column({ type: 'enum', enum: GroupStatus, default: GroupStatus.ACTIVE })
  @Index()
  status!: GroupStatus

  // Configuration tarifaire
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  defaultDiscount?: number // Remise par défaut en %

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  maxDiscount?: number // Remise maximale autorisée

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  creditLimit?: number // Plafond de crédit par défaut

  @Column({ type: 'varchar', length: 10, nullable: true })
  paymentTerms?: string // Conditions de paiement : 30J, 60J, etc.

  @Column({ type: 'integer', default: 0 })
  @Index()
  priority!: number // Priorité du groupe (pour l'ordre d'application)

  // Règles et conditions
  @Column({ type: 'jsonb', default: {} })
  rules?: {
    requiresApproval?: boolean // Commandes nécessitent validation
    minOrderAmount?: number // Montant minimum de commande
    maxOrderAmount?: number // Montant maximum de commande
    allowedPaymentMethods?: string[] // Méthodes de paiement autorisées
    allowedDeliveryModes?: string[] // Modes de livraison autorisés
    blockedProducts?: string[] // Références produits interdites
    exclusiveProducts?: string[] // Produits exclusifs à ce groupe
  }

  // Métadonnées et configuration
  @Column({ type: 'jsonb', default: {} })
  metadata?: {
    color?: string // Couleur d'affichage
    icon?: string // Icône du groupe
    tags?: string[] // Tags associés
    customFields?: Record<string, any>
    statistics?: {
      memberCount?: number
      totalRevenue?: number
      averageOrderValue?: number
      lastUpdated?: string
    }
  }

  // Relations
  @OneToMany(() => Partner, partner => partner.group)
  partners!: Partner[]

  /**
   * Validation des règles métier
   */
  validate(): string[] {
    const errors: string[] = []

    if (!this.code?.trim()) {
      errors.push('Le code du groupe est requis')
    }

    if (!this.name?.trim()) {
      errors.push('Le nom du groupe est requis')
    }

    if (this.defaultDiscount !== undefined && this.defaultDiscount !== null) {
      if (this.defaultDiscount < 0 || this.defaultDiscount > 100) {
        errors.push('La remise par défaut doit être entre 0 et 100%')
      }
    }

    if (this.maxDiscount !== undefined && this.maxDiscount !== null) {
      if (this.maxDiscount < 0 || this.maxDiscount > 100) {
        errors.push('La remise maximale doit être entre 0 et 100%')
      }
      
      if (this.defaultDiscount && this.maxDiscount < this.defaultDiscount) {
        errors.push('La remise maximale ne peut pas être inférieure à la remise par défaut')
      }
    }

    if (this.creditLimit !== undefined && this.creditLimit !== null && this.creditLimit < 0) {
      errors.push('Le plafond de crédit ne peut pas être négatif')
    }

    if (this.priority < 0) {
      errors.push('La priorité ne peut pas être négative')
    }

    return errors
  }

  /**
   * Méthodes métier
   */

  /**
   * Vérifier si le groupe est actif
   */
  isActive(): boolean {
    return this.status === GroupStatus.ACTIVE
  }

  /**
   * Activer le groupe
   */
  activate(): void {
    this.status = GroupStatus.ACTIVE
    this.markAsModified()
  }

  /**
   * Désactiver le groupe
   */
  deactivate(): void {
    this.status = GroupStatus.INACTIVE
    this.markAsModified()
  }

  /**
   * Archiver le groupe
   */
  archive(): void {
    this.status = GroupStatus.ARCHIVED
    this.markAsModified()
  }

  /**
   * Appliquer la remise du groupe à un prix
   */
  applyGroupDiscount(price: number): number {
    if (!this.defaultDiscount || this.defaultDiscount === 0) {
      return price
    }
    return price * (1 - this.defaultDiscount / 100)
  }

  /**
   * Vérifier si un montant de commande est valide pour ce groupe
   */
  isOrderAmountValid(amount: number): { valid: boolean; message?: string } {
    if (this.rules?.minOrderAmount && amount < this.rules.minOrderAmount) {
      return {
        valid: false,
        message: `Montant minimum requis: ${this.rules.minOrderAmount}€`
      }
    }

    if (this.rules?.maxOrderAmount && amount > this.rules.maxOrderAmount) {
      return {
        valid: false,
        message: `Montant maximum autorisé: ${this.rules.maxOrderAmount}€`
      }
    }

    return { valid: true }
  }

  /**
   * Vérifier si un produit est autorisé pour ce groupe
   */
  isProductAllowed(productRef: string): boolean {
    // Vérifier les produits bloqués
    if (this.rules?.blockedProducts?.includes(productRef)) {
      return false
    }

    // Si des produits exclusifs sont définis, seuls ceux-ci sont autorisés
    if (this.rules?.exclusiveProducts && this.rules.exclusiveProducts.length > 0) {
      return this.rules.exclusiveProducts.includes(productRef)
    }

    return true
  }

  /**
   * Mettre à jour les statistiques du groupe
   */
  updateStatistics(stats: Partial<{
    memberCount: number
    totalRevenue: number
    averageOrderValue: number
  }>): void {
    if (!this.metadata) {
      this.metadata = {}
    }
    if (!this.metadata.statistics) {
      this.metadata.statistics = {}
    }

    Object.assign(this.metadata.statistics, {
      ...stats,
      lastUpdated: new Date().toISOString()
    })

    this.markAsModified()
  }
}