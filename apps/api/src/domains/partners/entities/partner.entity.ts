import { Column, Entity, Index, OneToMany } from 'typeorm'
import { BusinessEntity } from '@erp/entities'

export enum PartnerType {
  CLIENT = 'CLIENT',
  FOURNISSEUR = 'FOURNISSEUR',
  MIXTE = 'MIXTE' // Client et fournisseur
}

export enum PartnerStatus {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  SUSPENDU = 'SUSPENDU',
  PROSPECT = 'PROSPECT' // Pour les clients potentiels
}

export enum PartnerCategory {
  PARTICULIER = 'PARTICULIER',
  ENTREPRISE = 'ENTREPRISE',
  ADMINISTRATION = 'ADMINISTRATION',
  ASSOCIATION = 'ASSOCIATION'
}

/**
 * Entité métier : Partenaire (Client/Fournisseur)
 * Représente un client ou fournisseur de l'entreprise
 */
@Entity('partners')
export class Partner extends BusinessEntity {
  @Column({ type: 'varchar', length: 20, unique: true })
  @Index()
  code!: string // Code unique : CLI001, FOU001, etc.

  @Column({ type: 'enum', enum: PartnerType })
  @Index()
  type!: PartnerType

  @Column({ type: 'enum', enum: PartnerStatus, default: PartnerStatus.ACTIF })
  @Index()
  status!: PartnerStatus

  @Column({ type: 'enum', enum: PartnerCategory })
  @Index()
  category!: PartnerCategory

  // Informations générales
  @Column({ type: 'varchar', length: 255 })
  @Index()
  denomination!: string // Nom ou raison sociale

  @Column({ type: 'varchar', length: 100, nullable: true })
  denominationCommerciale?: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  @Index()
  siret?: string

  @Column({ type: 'varchar', length: 15, nullable: true })
  numeroTVA?: string

  @Column({ type: 'varchar', length: 10, nullable: true })
  codeAPE?: string

  // Contact principal
  @Column({ type: 'varchar', length: 100, nullable: true })
  contactPrincipal?: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  telephone?: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  mobile?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Index()
  email?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  siteWeb?: string

  // Adresse principale
  @Column({ type: 'varchar', length: 255, nullable: true })
  adresse?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  adresseComplement?: string

  @Column({ type: 'varchar', length: 10, nullable: true })
  @Index()
  codePostal?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  ville?: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  pays?: string

  // Informations commerciales
  @Column({ type: 'varchar', length: 10, nullable: true })
  @Index()
  conditionsPaiement?: string // 30J, 60J, etc.

  @Column({ type: 'varchar', length: 10, nullable: true })
  modePaiement?: string // VIREMENT, CHEQUE, etc.

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  plafondCredit?: number

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  tauxRemise?: number // Remise habituelle en %

  @Column({ type: 'varchar', length: 100, nullable: true })
  representantCommercial?: string

  // Informations spécifiques fournisseurs
  @Column({ type: 'varchar', length: 10, nullable: true })
  delaiLivraison?: string // Ex: "7J", "2S"

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  montantMiniCommande?: number

  @Column({ type: 'boolean', default: false })
  @Index()
  fournisseurPrefere?: boolean

  // Informations comptables
  @Column({ type: 'varchar', length: 20, nullable: true })
  compteComptableClient?: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  compteComptableFournisseur?: string

  // Métadonnées
  @Column({ type: 'jsonb', default: {} })
  notes?: {
    commentaires?: string
    historiqueNotes?: Array<{
      date: string
      auteur: string
      contenu: string
    }>
    tagsPersonnalises?: string[]
  }

  @Column({ type: 'jsonb', default: {} })
  donneesTechniques?: {
    secteurActivite?: string
    effectif?: string
    chiffreAffaires?: number
    certifications?: string[]
    specifications?: Record<string, any>
  }

  // Relations (à définir selon vos besoins)
  // @OneToMany('Contact', 'partner')
  // contacts!: Contact[]

  // @OneToMany('Adresse', 'partner')
  // adresses!: Adresse[]

  // @OneToMany('Commande', 'client')
  // commandesClient!: Commande[]

  // @OneToMany('CommandeFournisseur', 'fournisseur')
  // commandesFournisseur!: CommandeFournisseur[]

  /**
   * Validation des règles métier
   */
  validate(): string[] {
    const errors: string[] = []

    // Validations obligatoires
    if (!this.code?.trim()) {
      errors.push('Le code partenaire est requis')
    }

    if (!this.denomination?.trim()) {
      errors.push('La dénomination est requise')
    }

    if (!this.type) {
      errors.push('Le type de partenaire est requis')
    }

    if (!this.category) {
      errors.push('La catégorie de partenaire est requise')
    }

    // Validations conditionnelles
    if (this.category === PartnerCategory.ENTREPRISE) {
      if (!this.siret && !this.numeroTVA) {
        errors.push('Pour une entreprise, le SIRET ou le numéro de TVA est requis')
      }
    }

    // Validations de format
    if (this.email && !this.isValidEmail(this.email)) {
      errors.push('L\'adresse email n\'est pas valide')
    }

    if (this.siret && !this.isValidSiret(this.siret)) {
      errors.push('Le numéro SIRET n\'est pas valide')
    }

    if (this.numeroTVA && !this.isValidTVA(this.numeroTVA)) {
      errors.push('Le numéro de TVA n\'est pas valide')
    }

    // Validations métier
    if (this.plafondCredit && this.plafondCredit < 0) {
      errors.push('Le plafond de crédit ne peut pas être négatif')
    }

    if (this.tauxRemise && (this.tauxRemise < 0 || this.tauxRemise > 100)) {
      errors.push('Le taux de remise doit être entre 0 et 100%')
    }

    if (this.montantMiniCommande && this.montantMiniCommande < 0) {
      errors.push('Le montant minimum de commande ne peut pas être négatif')
    }

    return errors
  }

  /**
   * Méthodes métier
   */

  /**
   * Vérifier si le partenaire est un client
   */
  isClient(): boolean {
    return this.type === PartnerType.CLIENT || this.type === PartnerType.MIXTE
  }

  /**
   * Vérifier si le partenaire est un fournisseur
   */
  isFournisseur(): boolean {
    return this.type === PartnerType.FOURNISSEUR || this.type === PartnerType.MIXTE
  }

  /**
   * Vérifier si le partenaire est actif
   */
  isActif(): boolean {
    return this.status === PartnerStatus.ACTIF
  }

  /**
   * Activer le partenaire
   */
  activer(): void {
    this.status = PartnerStatus.ACTIF
    this.markAsModified()
  }

  /**
   * Désactiver le partenaire
   */
  desactiver(): void {
    this.status = PartnerStatus.INACTIF
    this.markAsModified()
  }

  /**
   * Suspendre le partenaire
   */
  suspendre(raison?: string): void {
    this.status = PartnerStatus.SUSPENDU
    if (raison) {
      this.ajouterNote('Suspension', raison, 'SYSTEM')
    }
    this.markAsModified()
  }

  /**
   * Convertir un prospect en client
   */
  convertirProspectEnClient(): void {
    if (this.status !== PartnerStatus.PROSPECT) {
      throw new Error('Seul un prospect peut être converti en client')
    }

    this.status = PartnerStatus.ACTIF
    if (this.type !== PartnerType.MIXTE) {
      this.type = PartnerType.CLIENT
    }
    this.ajouterNote('Conversion', 'Prospect converti en client', 'SYSTEM')
    this.markAsModified()
  }

  /**
   * Ajouter une note
   */
  ajouterNote(titre: string, contenu: string, auteur: string): void {
    if (!this.notes) {
      this.notes = { historiqueNotes: [] }
    }
    if (!this.notes.historiqueNotes) {
      this.notes.historiqueNotes = []
    }

    this.notes.historiqueNotes.push({
      date: new Date().toISOString(),
      auteur,
      contenu: `${titre}: ${contenu}`
    })
    this.markAsModified()
  }

  /**
   * Obtenir l'adresse complète formatée
   */
  getAdresseComplete(): string {
    const parts: string[] = []
    if (this.adresse) parts.push(this.adresse)
    if (this.adresseComplement) parts.push(this.adresseComplement)
    if (this.codePostal || this.ville) {
      const ligne = [this.codePostal, this.ville].filter(Boolean).join(' ')
      parts.push(ligne)
    }
    if (this.pays) parts.push(this.pays)
    return parts.join('\n')
  }

  /**
   * Calculer l'ancienneté (en années)
   */
  getAnneeAnciennete(): number {
    if (!this.createdAt) return 0
    const maintenant = new Date()
    const diffTime = maintenant.getTime() - this.createdAt.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365))
  }

  /**
   * Méthodes de validation privées
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private isValidSiret(siret: string): boolean {
    // Validation simplifiée du SIRET (14 chiffres)
    return /^\d{14}$/.test(siret.replace(/\s/g, ''))
  }

  private isValidTVA(tva: string): boolean {
    // Validation simplifiée du numéro de TVA français
    return /^FR\d{11}$/.test(tva.replace(/\s/g, ''))
  }
}