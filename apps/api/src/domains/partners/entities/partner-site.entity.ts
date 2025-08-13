import { BusinessEntity } from '@erp/entities'
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { Contact } from './contact.entity'
import { Partner } from './partner.entity'
import { PartnerAddress } from './partner-address.entity'

export enum SiteType {
  SIEGE_SOCIAL = 'SIEGE_SOCIAL', // Siège social
  USINE = 'USINE', // Usine de production
  DEPOT = 'DEPOT', // Dépôt/Entrepôt
  CHANTIER = 'CHANTIER', // Chantier temporaire
  BUREAU = 'BUREAU', // Bureau/Agence
  MAGASIN = 'MAGASIN', // Magasin de vente
  POINT_LIVRAISON = 'POINT_LIVRAISON', // Point de livraison simple
  AUTRE = 'AUTRE',
}

export enum SiteStatus {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  TEMPORAIRE = 'TEMPORAIRE', // Pour les chantiers temporaires
  FERME = 'FERME',
}

export enum AccessibiliteType {
  FACILE = 'FACILE', // Accès facile pour tous véhicules
  MOYEN = 'MOYEN', // Quelques contraintes
  DIFFICILE = 'DIFFICILE', // Accès difficile
  RESTREINT = 'RESTREINT', // Accès restreint (autorisation nécessaire)
}

/**
 * Entité métier : Site partenaire
 * Représente un lieu physique lié à un partenaire (usine, dépôt, chantier, etc.)
 */
@Entity('partner_sites')
export class PartnerSite extends BusinessEntity {
  @Column({ type: 'uuid' })
  @Index()
  partnerId!: string

  @ManyToOne(
    () => Partner,
    (partner) => partner.sites,
    {
      onDelete: 'CASCADE',
    }
  )
  @JoinColumn({ name: 'partnerId' })
  partner!: Partner

  @Column({ type: 'varchar', length: 20, unique: true })
  @Index()
  code!: string // Code unique : SITE001, DEP-PARIS, etc.

  @Column({ type: 'varchar', length: 100 })
  @Index()
  nom!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'enum', enum: SiteType, default: SiteType.DEPOT })
  @Index()
  type!: SiteType

  @Column({ type: 'enum', enum: SiteStatus, default: SiteStatus.ACTIF })
  @Index()
  status!: SiteStatus

  @Column({ type: 'boolean', default: false })
  @Index()
  isPrincipal!: boolean // Site principal du partenaire

  @Column({ type: 'boolean', default: true })
  accepteLivraisons!: boolean // Accepte les livraisons

  @Column({ type: 'boolean', default: false })
  accepteEnlevements!: boolean // Accepte les enlèvements

  // Localisation
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

  @Column({ type: 'varchar', length: 100, nullable: true })
  region?: string

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude?: number

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude?: number

  // Contact du site
  @Column({ type: 'varchar', length: 100, nullable: true })
  responsable?: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  telephone?: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string

  // Capacités et contraintes logistiques
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  surfaceM2?: number // Surface en m²

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  capaciteStockageTonnes?: number // Capacité de stockage en tonnes

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  hauteurMaxM?: number // Hauteur maximale en mètres

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  poidsMaxTonnes?: number // Poids maximum accepté par livraison

  @Column({ type: 'enum', enum: AccessibiliteType, nullable: true })
  accessibilite?: AccessibiliteType

  @Column({ type: 'varchar', length: 50, nullable: true })
  typeVehiculeMax?: string // Semi-remorque, Porteur, VL, etc.

  @Column({ type: 'boolean', default: false })
  hasQuaiChargement!: boolean // Possède un quai de chargement

  @Column({ type: 'boolean', default: false })
  hasChariot!: boolean // Possède un chariot élévateur

  @Column({ type: 'boolean', default: false })
  hasPontRoulant!: boolean // Possède un pont roulant

  @Column({ type: 'boolean', default: false })
  hasGrue!: boolean // Possède une grue

  // Horaires et disponibilités
  @Column({ type: 'jsonb', default: {} })
  horaires?: {
    livraison?: {
      lundi?: { debut: string; fin: string; pause?: { debut: string; fin: string } }
      mardi?: { debut: string; fin: string; pause?: { debut: string; fin: string } }
      mercredi?: { debut: string; fin: string; pause?: { debut: string; fin: string } }
      jeudi?: { debut: string; fin: string; pause?: { debut: string; fin: string } }
      vendredi?: { debut: string; fin: string; pause?: { debut: string; fin: string } }
      samedi?: { debut: string; fin: string; pause?: { debut: string; fin: string } }
    }
    fermetures?: string[] // Dates de fermeture exceptionnelle
    joursFerier?: boolean // Fermé les jours fériés
  }

  // Instructions et consignes
  @Column({ type: 'text', nullable: true })
  instructionsLivraison?: string // Instructions spécifiques pour la livraison

  @Column({ type: 'text', nullable: true })
  consignesSecurite?: string // Consignes de sécurité du site

  @Column({ type: 'jsonb', default: {} })
  documentsRequis?: {
    bonLivraison?: boolean
    cmr?: boolean
    certificatConformite?: boolean
    ficheSecurite?: boolean
    autres?: string[]
  }

  // Préférences et configuration
  @Column({ type: 'jsonb', default: {} })
  preferences?: {
    transporteursPreferes?: string[] // Liste des transporteurs préférés
    transporteursInterdits?: string[] // Liste des transporteurs interdits
    delaiPrevenanceMin?: number // Délai minimum de prévenance en heures
    prisesRdv?: boolean // Nécessite prise de RDV
    systemePriseRdv?: string // URL ou système de prise de RDV
    contactsUrgence?: Array<{
      nom: string
      telephone: string
      role: string
    }>
  }

  // Dates importantes
  @Column({ type: 'date', nullable: true })
  dateOuverture?: Date

  @Column({ type: 'date', nullable: true })
  dateFermeture?: Date // Pour les sites temporaires

  // Métadonnées
  @Column({ type: 'jsonb', default: {} })
  metadata?: {
    photos?: string[] // URLs des photos du site
    plans?: string[] // URLs des plans d'accès
    certifications?: string[] // Certifications du site
    zones?: Array<{
      // Zones de stockage
      nom: string
      type: string
      capacite?: number
      occupee?: number
    }>
    historiqueLivraisons?: Array<{
      date: string
      reference: string
      tonnage: number
      transporteur: string
      statut: string
    }>
    statistiques?: {
      nombreLivraisonsMois?: number
      tonnageMoyenMois?: number
      tauxOccupation?: number
      derniereMiseAJour?: string
    }
  }

  // Relations
  @OneToMany(
    () => Contact,
    (contact) => contact.site
  )
  contacts!: Contact[]

  @OneToMany(
    () => PartnerAddress,
    (address) => address.site
  )
  addresses!: PartnerAddress[]

  /**
   * Validation des règles métier
   */
  validate(): string[] {
    const errors: string[] = []

    if (!this.code?.trim()) {
      errors.push('Le code du site est requis')
    }

    if (!this.nom?.trim()) {
      errors.push('Le nom du site est requis')
    }

    if (!this.partnerId) {
      errors.push('Le partenaire associé est requis')
    }

    // Validation des capacités
    if (this.surfaceM2 !== undefined && this.surfaceM2 < 0) {
      errors.push('La surface ne peut pas être négative')
    }

    if (this.capaciteStockageTonnes !== undefined && this.capaciteStockageTonnes < 0) {
      errors.push('La capacité de stockage ne peut pas être négative')
    }

    if (this.hauteurMaxM !== undefined && this.hauteurMaxM < 0) {
      errors.push('La hauteur maximale ne peut pas être négative')
    }

    if (this.poidsMaxTonnes !== undefined && this.poidsMaxTonnes < 0) {
      errors.push('Le poids maximum ne peut pas être négatif')
    }

    // Validation des coordonnées GPS
    if (this.latitude !== undefined && (this.latitude < -90 || this.latitude > 90)) {
      errors.push('La latitude doit être entre -90 et 90')
    }

    if (this.longitude !== undefined && (this.longitude < -180 || this.longitude > 180)) {
      errors.push('La longitude doit être entre -180 et 180')
    }

    // Validation email
    if (this.email && !this.isValidEmail(this.email)) {
      errors.push("L'adresse email n'est pas valide")
    }

    // Validation logique
    if (!this.accepteLivraisons && !this.accepteEnlevements) {
      errors.push('Le site doit accepter au moins les livraisons ou les enlèvements')
    }

    if (this.type === SiteType.CHANTIER && !this.dateFermeture) {
      errors.push('Un chantier temporaire doit avoir une date de fermeture prévue')
    }

    return errors
  }

  /**
   * Méthodes métier
   */

  /**
   * Vérifier si le site est actif
   */
  isActif(): boolean {
    return this.status === SiteStatus.ACTIF
  }

  /**
   * Vérifier si le site est ouvert à une date donnée
   */
  isOuvert(date: Date = new Date()): boolean {
    if (this.status !== SiteStatus.ACTIF) return false

    if (this.dateOuverture && date < this.dateOuverture) return false
    if (this.dateFermeture && date > this.dateFermeture) return false

    // Vérifier les fermetures exceptionnelles
    if (this.horaires?.fermetures) {
      const dateStr = date.toISOString().split('T')[0]
      if (this.horaires.fermetures.includes(dateStr)) return false
    }

    return true
  }

  /**
   * Vérifier si le site accepte les livraisons à un moment donné
   */
  accepteLivraisonA(jour: string, heure: string): boolean {
    if (!this.accepteLivraisons) return false
    if (!this.horaires?.livraison) return true // Pas d'horaires = toujours ouvert

    const jourKey = jour.toLowerCase() as keyof typeof this.horaires.livraison
    const horaires = this.horaires.livraison[jourKey]

    if (!horaires) return false

    const heureMinutes = this.timeToMinutes(heure)
    const debutMinutes = this.timeToMinutes(horaires.debut)
    const finMinutes = this.timeToMinutes(horaires.fin)

    // Vérifier la pause déjeuner
    if (horaires.pause) {
      const pauseDebutMinutes = this.timeToMinutes(horaires.pause.debut)
      const pauseFinMinutes = this.timeToMinutes(horaires.pause.fin)

      if (heureMinutes >= pauseDebutMinutes && heureMinutes < pauseFinMinutes) {
        return false
      }
    }

    return heureMinutes >= debutMinutes && heureMinutes <= finMinutes
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
    if (this.region) parts.push(this.region)
    if (this.pays) parts.push(this.pays)
    return parts.join('\n')
  }

  /**
   * Calculer le taux d'occupation du site
   */
  calculerTauxOccupation(): number {
    if (!this.metadata?.zones || !this.capaciteStockageTonnes) return 0

    const totalOccupe = this.metadata.zones.reduce((sum, zone) => sum + (zone.occupee || 0), 0)

    return (totalOccupe / this.capaciteStockageTonnes) * 100
  }

  /**
   * Vérifier si un véhicule peut accéder au site
   */
  peutAccederVehicule(typeVehicule: string, poidsTonnes: number): boolean {
    if (this.poidsMaxTonnes && poidsTonnes > this.poidsMaxTonnes) {
      return false
    }

    if (this.typeVehiculeMax && typeVehicule > this.typeVehiculeMax) {
      return false
    }

    if (this.accessibilite === AccessibiliteType.RESTREINT) {
      return false // Nécessite autorisation spéciale
    }

    return true
  }

  /**
   * Ajouter une livraison à l'historique
   */
  ajouterLivraison(reference: string, tonnage: number, transporteur: string, statut: string): void {
    if (!this.metadata) {
      this.metadata = {}
    }
    if (!this.metadata.historiqueLivraisons) {
      this.metadata.historiqueLivraisons = []
    }

    this.metadata.historiqueLivraisons.push({
      date: new Date().toISOString(),
      reference,
      tonnage,
      transporteur,
      statut,
    })

    // Limiter l'historique aux 100 dernières livraisons
    if (this.metadata.historiqueLivraisons.length > 100) {
      this.metadata.historiqueLivraisons = this.metadata.historiqueLivraisons.slice(-100)
    }

    // Mettre à jour les statistiques
    this.updateStatistiques()
    this.markAsModified()
  }

  /**
   * Mettre à jour les statistiques du site
   */
  private updateStatistiques(): void {
    if (!this.metadata) {
      this.metadata = {}
    }
    if (!this.metadata.statistiques) {
      this.metadata.statistiques = {}
    }

    // Calculer les statistiques du mois en cours
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    if (this.metadata.historiqueLivraisons) {
      const livraisonsMois = this.metadata.historiqueLivraisons.filter((l) => {
        const date = new Date(l.date)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      })

      this.metadata.statistiques.nombreLivraisonsMois = livraisonsMois.length
      this.metadata.statistiques.tonnageMoyenMois =
        livraisonsMois.length > 0
          ? livraisonsMois.reduce((sum, l) => sum + l.tonnage, 0) / livraisonsMois.length
          : 0
    }

    this.metadata.statistiques.tauxOccupation = this.calculerTauxOccupation()
    this.metadata.statistiques.derniereMiseAJour = now.toISOString()
  }

  /**
   * Méthodes privées
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + (minutes || 0)
  }
}
