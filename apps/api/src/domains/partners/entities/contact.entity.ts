import { BusinessEntity } from '@erp/entities'
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm'
// Type imports to avoid circular dependencies
import type { Partner } from './partner.entity'
import type { PartnerSite } from './partner-site.entity'

export enum ContactRole {
  COMMERCIAL = 'COMMERCIAL', // Contact commercial principal
  TECHNIQUE = 'TECHNIQUE', // Responsable technique
  COMPTABILITE = 'COMPTABILITE', // Service comptabilité
  DIRECTION = 'DIRECTION', // Direction
  ACHATS = 'ACHATS', // Service achats
  QUALITE = 'QUALITE', // Responsable qualité
  LOGISTIQUE = 'LOGISTIQUE', // Responsable logistique
  PRODUCTION = 'PRODUCTION', // Responsable production
  AUTRE = 'AUTRE', // Autre rôle
}

export enum ContactStatus {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  PARTI = 'PARTI', // N'est plus dans l'entreprise
}

export enum ContactPreference {
  EMAIL = 'EMAIL',
  TELEPHONE = 'TELEPHONE',
  MOBILE = 'MOBILE',
  COURRIER = 'COURRIER',
  VISITE = 'VISITE',
}

/**
 * Entité métier : Contact / Interlocuteur
 * Représente une personne de contact chez un partenaire
 */
@Entity('partner_contacts')
export class Contact extends BusinessEntity {
  @Column({ type: 'uuid' })
  @Index()
  partnerId!: string

  @ManyToOne('Partner', 'contacts', {
    onDelete: 'CASCADE',
    lazy: true,
  })
  @JoinColumn({ name: 'partnerId' })
  partner!: Partner

  @Column({ type: 'uuid', nullable: true })
  @Index()
  partnerSiteId?: string

  @ManyToOne('PartnerSite', 'contacts', { nullable: true, lazy: true })
  @JoinColumn({ name: 'partnerSiteId' })
  site?: PartnerSite // Site spécifique si le contact est lié à un site

  // Informations personnelles
  @Column({ type: 'varchar', length: 50 })
  @Index()
  prenom!: string

  @Column({ type: 'varchar', length: 50 })
  @Index()
  nom!: string

  @Column({ type: 'varchar', length: 10, nullable: true })
  civilite?: string // M., Mme, Dr., etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  fonction?: string // Poste occupé

  @Column({ type: 'enum', enum: ContactRole, default: ContactRole.AUTRE })
  @Index()
  role!: ContactRole

  @Column({ type: 'enum', enum: ContactStatus, default: ContactStatus.ACTIF })
  @Index()
  status!: ContactStatus

  // Coordonnées
  @Column({ type: 'varchar', length: 255, nullable: true })
  @Index()
  email?: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  telephoneDirect?: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  telephoneStandard?: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  mobile?: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  fax?: string

  // Préférences de contact
  @Column({ type: 'enum', enum: ContactPreference, default: ContactPreference.EMAIL })
  preferenceContact!: ContactPreference

  @Column({ type: 'boolean', default: false })
  @Index()
  isPrincipal!: boolean // Contact principal pour ce rôle

  @Column({ type: 'boolean', default: true })
  accepteEmails!: boolean // Accepte les emails commerciaux

  @Column({ type: 'boolean', default: true })
  accepteSms!: boolean // Accepte les SMS

  // Disponibilités
  @Column({ type: 'jsonb', default: {} })
  disponibilites?: {
    horaires?: {
      lundi?: { debut: string; fin: string }
      mardi?: { debut: string; fin: string }
      mercredi?: { debut: string; fin: string }
      jeudi?: { debut: string; fin: string }
      vendredi?: { debut: string; fin: string }
    }
    joursAbsence?: string[] // Dates d'absence connues
    noteDisponibilite?: string
  }

  // Informations additionnelles
  @Column({ type: 'varchar', length: 50, nullable: true })
  langue?: string // Langue préférée : FR, EN, ES, etc.

  @Column({ type: 'date', nullable: true })
  dateNaissance?: Date

  @Column({ type: 'text', nullable: true })
  notes?: string // Notes libres sur le contact

  // Métadonnées
  @Column({ type: 'jsonb', default: {} })
  metadata?: {
    linkedinUrl?: string
    assistantNom?: string
    assistantTel?: string
    photo?: string // URL de la photo
    tags?: string[]
    historiqueInteractions?: Array<{
      date: string
      type: string // APPEL, EMAIL, VISITE, etc.
      objet: string
      notes?: string
      auteur: string
    }>
    preferences?: {
      sujetsFavoris?: string[]
      produitsInterets?: string[]
      horairesAppelPreferes?: string
    }
  }

  /**
   * Validation des règles métier
   */
  validate(): string[] {
    const errors: string[] = []

    if (!this.prenom?.trim()) {
      errors.push('Le prénom est requis')
    }

    if (!this.nom?.trim()) {
      errors.push('Le nom est requis')
    }

    if (!this.partnerId) {
      errors.push('Le partenaire associé est requis')
    }

    // Au moins un moyen de contact
    if (!this.email && !this.telephoneDirect && !this.mobile && !this.telephoneStandard) {
      errors.push('Au moins un moyen de contact est requis (email, téléphone ou mobile)')
    }

    // Validation email
    if (this.email && !this.isValidEmail(this.email)) {
      errors.push("L'adresse email n'est pas valide")
    }

    // Validation téléphone
    if (this.telephoneDirect && !this.isValidPhone(this.telephoneDirect)) {
      errors.push("Le numéro de téléphone direct n'est pas valide")
    }

    if (this.mobile && !this.isValidPhone(this.mobile)) {
      errors.push("Le numéro de mobile n'est pas valide")
    }

    return errors
  }

  /**
   * Méthodes métier
   */

  /**
   * Obtenir le nom complet formaté
   */
  getNomComplet(): string {
    const parts: string[] = []
    if (this.civilite) parts.push(this.civilite)
    if (this.prenom) parts.push(this.prenom)
    if (this.nom) parts.push(this.nom.toUpperCase())
    return parts.join(' ')
  }

  /**
   * Obtenir le nom avec fonction
   */
  getNomAvecFonction(): string {
    const nom = this.getNomComplet()
    if (this.fonction) {
      return `${nom} - ${this.fonction}`
    }
    return nom
  }

  /**
   * Vérifier si le contact est actif
   */
  isActif(): boolean {
    return this.status === ContactStatus.ACTIF
  }

  /**
   * Désactiver le contact
   */
  desactiver(): void {
    this.status = ContactStatus.INACTIF
    this.markAsModified()
  }

  /**
   * Marquer comme parti
   */
  marquerCommeParti(): void {
    this.status = ContactStatus.PARTI
    this.isPrincipal = false
    this.markAsModified()
  }

  /**
   * Définir comme contact principal
   */
  definirCommePrincipal(): void {
    this.isPrincipal = true
    this.markAsModified()
  }

  /**
   * Obtenir le meilleur moyen de contact
   */
  getMeilleurContact(): { type: string; value: string } | null {
    switch (this.preferenceContact) {
      case ContactPreference.EMAIL:
        if (this.email) return { type: 'EMAIL', value: this.email }
        break
      case ContactPreference.MOBILE:
        if (this.mobile) return { type: 'MOBILE', value: this.mobile }
        break
      case ContactPreference.TELEPHONE:
        if (this.telephoneDirect) return { type: 'TELEPHONE', value: this.telephoneDirect }
        if (this.telephoneStandard) return { type: 'TELEPHONE', value: this.telephoneStandard }
        break
    }

    // Fallback : prendre le premier disponible
    if (this.email) return { type: 'EMAIL', value: this.email }
    if (this.mobile) return { type: 'MOBILE', value: this.mobile }
    if (this.telephoneDirect) return { type: 'TELEPHONE', value: this.telephoneDirect }
    if (this.telephoneStandard) return { type: 'TELEPHONE', value: this.telephoneStandard }

    return null
  }

  /**
   * Ajouter une interaction dans l'historique
   */
  ajouterInteraction(type: string, objet: string, notes: string | undefined, auteur: string): void {
    if (!this.metadata) {
      this.metadata = {}
    }
    if (!this.metadata.historiqueInteractions) {
      this.metadata.historiqueInteractions = []
    }

    this.metadata.historiqueInteractions.push({
      date: new Date().toISOString(),
      type,
      objet,
      notes,
      auteur,
    })

    // Limiter l'historique aux 100 dernières interactions
    if (this.metadata.historiqueInteractions.length > 100) {
      this.metadata.historiqueInteractions = this.metadata.historiqueInteractions.slice(-100)
    }

    this.markAsModified()
  }

  /**
   * Vérifier la disponibilité à un moment donné
   */
  isDisponible(jour: string, heure: string): boolean {
    if (!this.disponibilites?.horaires) return true

    const jourKey = jour.toLowerCase() as keyof typeof this.disponibilites.horaires
    const horaires = this.disponibilites.horaires[jourKey]

    if (!horaires) return false

    const heureMinutes = this.timeToMinutes(heure)
    const debutMinutes = this.timeToMinutes(horaires.debut)
    const finMinutes = this.timeToMinutes(horaires.fin)

    return heureMinutes >= debutMinutes && heureMinutes <= finMinutes
  }

  /**
   * Méthodes privées de validation
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private isValidPhone(phone: string): boolean {
    // Validation simplifiée : au moins 10 chiffres
    const digitsOnly = phone.replace(/\D/g, '')
    return digitsOnly.length >= 10
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + (minutes || 0)
  }
}
