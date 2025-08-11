import { BusinessEntity } from '@erp/entities'
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm'
import { Partner } from './partner.entity'
import { PartnerSite } from './partner-site.entity'

export enum AddressType {
  FACTURATION = 'FACTURATION', // Adresse de facturation
  LIVRAISON = 'LIVRAISON', // Adresse de livraison
  SIEGE = 'SIEGE', // Siège social
  POSTALE = 'POSTALE', // Adresse postale
  AUTRE = 'AUTRE',
}

export enum AddressStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TEMPORAIRE = 'TEMPORAIRE',
}

/**
 * Entité métier : Adresse partenaire
 * Représente une adresse liée à un partenaire ou un site
 */
@Entity('partner_addresses')
export class PartnerAddress extends BusinessEntity {
  @Column({ type: 'uuid' })
  @Index()
  partnerId!: string

  @ManyToOne(() => Partner, partner => partner.addresses, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'partnerId' })
  partner!: Partner

  @Column({ type: 'uuid', nullable: true })
  @Index()
  partnerSiteId?: string

  @ManyToOne(() => PartnerSite, site => site.addresses, {
    nullable: true,
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'partnerSiteId' })
  site?: PartnerSite

  @Column({ type: 'varchar', length: 100 })
  @Index()
  libelle!: string // Libellé de l'adresse

  @Column({ type: 'enum', enum: AddressType, default: AddressType.LIVRAISON })
  @Index()
  type!: AddressType

  @Column({ type: 'enum', enum: AddressStatus, default: AddressStatus.ACTIVE })
  @Index()
  status!: AddressStatus

  @Column({ type: 'boolean', default: false })
  @Index()
  isDefault!: boolean // Adresse par défaut pour ce type

  // Adresse détaillée
  @Column({ type: 'varchar', length: 255 })
  ligne1!: string // Numéro et rue

  @Column({ type: 'varchar', length: 255, nullable: true })
  ligne2?: string // Complément d'adresse (bâtiment, étage, etc.)

  @Column({ type: 'varchar', length: 255, nullable: true })
  ligne3?: string // Lieu-dit, zone industrielle, etc.

  @Column({ type: 'varchar', length: 10 })
  @Index()
  codePostal!: string

  @Column({ type: 'varchar', length: 100 })
  @Index()
  ville!: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  region?: string

  @Column({ type: 'varchar', length: 100, default: 'France' })
  pays!: string

  @Column({ type: 'varchar', length: 2, nullable: true })
  codePays?: string // Code ISO du pays (FR, BE, etc.)

  // Coordonnées GPS
  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude?: number

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude?: number

  // Contact pour cette adresse
  @Column({ type: 'varchar', length: 100, nullable: true })
  contactNom?: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  contactTelephone?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactEmail?: string

  // Instructions spécifiques
  @Column({ type: 'text', nullable: true })
  instructionsAcces?: string // Instructions d'accès

  @Column({ type: 'text', nullable: true })
  notes?: string // Notes additionnelles

  // Périodes de validité
  @Column({ type: 'date', nullable: true })
  dateDebut?: Date // Date de début de validité

  @Column({ type: 'date', nullable: true })
  dateFin?: Date // Date de fin de validité

  // Métadonnées
  @Column({ type: 'jsonb', default: {} })
  metadata?: {
    codeInterne?: string // Code interne client
    distanceKm?: number // Distance depuis le dépôt principal
    tempsTrajetMinutes?: number // Temps de trajet estimé
    zoneTransport?: string // Zone de transport pour tarification
    restrictions?: string[] // Restrictions d'accès
    tags?: string[]
    validation?: {
      valideePar?: string
      dateValidation?: string
      source?: string // GOOGLE_MAPS, MANUEL, API_ADRESSE, etc.
    }
  }

  /**
   * Validation des règles métier
   */
  validate(): string[] {
    const errors: string[] = []

    if (!this.libelle?.trim()) {
      errors.push('Le libellé de l\'adresse est requis')
    }

    if (!this.ligne1?.trim()) {
      errors.push('La première ligne d\'adresse est requise')
    }

    if (!this.codePostal?.trim()) {
      errors.push('Le code postal est requis')
    }

    if (!this.ville?.trim()) {
      errors.push('La ville est requise')
    }

    if (!this.pays?.trim()) {
      errors.push('Le pays est requis')
    }

    if (!this.partnerId) {
      errors.push('Le partenaire associé est requis')
    }

    // Validation du code postal français
    if (this.pays === 'France' && this.codePostal) {
      if (!/^\d{5}$/.test(this.codePostal)) {
        errors.push('Le code postal français doit contenir 5 chiffres')
      }
    }

    // Validation des coordonnées GPS
    if (this.latitude !== undefined && (this.latitude < -90 || this.latitude > 90)) {
      errors.push('La latitude doit être entre -90 et 90')
    }

    if (this.longitude !== undefined && (this.longitude < -180 || this.longitude > 180)) {
      errors.push('La longitude doit être entre -180 et 180')
    }

    // Validation email
    if (this.contactEmail && !this.isValidEmail(this.contactEmail)) {
      errors.push("L'adresse email du contact n'est pas valide")
    }

    // Validation des dates
    if (this.dateDebut && this.dateFin && this.dateDebut > this.dateFin) {
      errors.push('La date de début ne peut pas être après la date de fin')
    }

    return errors
  }

  /**
   * Méthodes métier
   */

  /**
   * Vérifier si l'adresse est active
   */
  isActive(): boolean {
    if (this.status !== AddressStatus.ACTIVE) return false

    const now = new Date()
    if (this.dateDebut && now < this.dateDebut) return false
    if (this.dateFin && now > this.dateFin) return false

    return true
  }

  /**
   * Obtenir l'adresse formatée sur une ligne
   */
  getAdresseLigne(): string {
    const parts: string[] = []
    
    parts.push(this.ligne1)
    if (this.ligne2) parts.push(this.ligne2)
    if (this.ligne3) parts.push(this.ligne3)
    parts.push(`${this.codePostal} ${this.ville}`)
    if (this.region) parts.push(this.region)
    if (this.pays !== 'France') parts.push(this.pays)

    return parts.join(', ')
  }

  /**
   * Obtenir l'adresse formatée sur plusieurs lignes
   */
  getAdresseMultiLignes(): string {
    const lines: string[] = []
    
    lines.push(this.ligne1)
    if (this.ligne2) lines.push(this.ligne2)
    if (this.ligne3) lines.push(this.ligne3)
    lines.push(`${this.codePostal} ${this.ville}`)
    if (this.region) lines.push(this.region)
    if (this.pays !== 'France') lines.push(this.pays)

    return lines.join('\n')
  }

  /**
   * Obtenir l'adresse formatée pour l'impression
   */
  getAdressePourImpression(includeContact = false): string {
    const lines: string[] = []

    if (includeContact && this.contactNom) {
      lines.push(this.contactNom)
    }

    lines.push(this.ligne1)
    if (this.ligne2) lines.push(this.ligne2)
    if (this.ligne3) lines.push(this.ligne3)
    lines.push(`${this.codePostal} ${this.ville}`)
    if (this.region) lines.push(this.region)
    if (this.pays !== 'France') lines.push(this.pays.toUpperCase())

    return lines.join('\n')
  }

  /**
   * Définir comme adresse par défaut
   */
  setAsDefault(): void {
    this.isDefault = true
    this.status = AddressStatus.ACTIVE
    this.markAsModified()
  }

  /**
   * Activer l'adresse
   */
  activate(): void {
    this.status = AddressStatus.ACTIVE
    this.markAsModified()
  }

  /**
   * Désactiver l'adresse
   */
  deactivate(): void {
    this.status = AddressStatus.INACTIVE
    this.isDefault = false
    this.markAsModified()
  }

  /**
   * Marquer comme temporaire
   */
  setTemporary(dateFin: Date): void {
    this.status = AddressStatus.TEMPORAIRE
    this.dateFin = dateFin
    this.markAsModified()
  }

  /**
   * Calculer la distance depuis un point
   */
  calculateDistanceFrom(lat: number, lon: number): number | null {
    if (!this.latitude || !this.longitude) return null

    const R = 6371 // Rayon de la Terre en km
    const dLat = this.toRad(this.latitude - lat)
    const dLon = this.toRad(this.longitude - lon)
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat)) * Math.cos(this.toRad(this.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    
    return R * c // Distance en km
  }

  /**
   * Vérifier si l'adresse est dans une zone
   */
  isInZone(zone: string): boolean {
    return this.metadata?.zoneTransport === zone
  }

  /**
   * Valider l'adresse
   */
  validateAddress(validatedBy: string, source = 'MANUEL'): void {
    if (!this.metadata) {
      this.metadata = {}
    }

    this.metadata.validation = {
      valideePar: validatedBy,
      dateValidation: new Date().toISOString(),
      source
    }

    this.markAsModified()
  }

  /**
   * Méthodes privées
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private toRad(value: number): number {
    return value * Math.PI / 180
  }
}