// Enums
export enum PartnerType {
  CLIENT = 'CLIENT',
  FOURNISSEUR = 'FOURNISSEUR',
  MIXTE = 'MIXTE',
}

export enum PartnerStatus {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  PROSPECT = 'PROSPECT',
  SUSPENDU = 'SUSPENDU',
  ARCHIVE = 'ARCHIVE',
}

export enum GroupType {
  TARIF = 'TARIF',
  COMMERCIAL = 'COMMERCIAL',
  LOGISTIQUE = 'LOGISTIQUE',
  COMPTABLE = 'COMPTABLE',
}

export enum GroupStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum ContactRole {
  COMMERCIAL = 'COMMERCIAL',
  TECHNIQUE = 'TECHNIQUE',
  COMPTABILITE = 'COMPTABILITE',
  DIRECTION = 'DIRECTION',
  ACHAT = 'ACHAT',
  LOGISTIQUE = 'LOGISTIQUE',
  QUALITE = 'QUALITE',
  AUTRE = 'AUTRE',
}

export enum ContactStatus {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  PARTI = 'PARTI',
}

export enum SiteType {
  SIEGE_SOCIAL = 'SIEGE_SOCIAL',
  USINE = 'USINE',
  DEPOT = 'DEPOT',
  CHANTIER = 'CHANTIER',
  MAGASIN = 'MAGASIN',
  BUREAU = 'BUREAU',
  AUTRE = 'AUTRE',
}

export enum SiteStatus {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  FERME = 'FERME',
  EN_TRAVAUX = 'EN_TRAVAUX',
}

export enum AccessibiliteType {
  FACILE = 'FACILE',
  MOYEN = 'MOYEN',
  DIFFICILE = 'DIFFICILE',
  TRES_DIFFICILE = 'TRES_DIFFICILE',
}

export enum AddressType {
  FACTURATION = 'FACTURATION',
  LIVRAISON = 'LIVRAISON',
  SIEGE = 'SIEGE',
  AUTRE = 'AUTRE',
}

export enum AddressStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

// Entities
export interface Partner {
  id: string
  code: string
  type: PartnerType
  denomination: string
  denominationCommerciale?: string
  category: string
  status: PartnerStatus

  // Identification
  siret?: string
  numeroTVA?: string
  codeAPE?: string

  // Contact principal
  contactPrincipal?: string
  telephone?: string
  mobile?: string
  email?: string
  siteWeb?: string

  // Adresse principale
  adresse?: string
  adresseComplement?: string
  codePostal?: string
  ville?: string
  pays?: string

  // Commercial
  conditionsPaiement?: string
  modePaiement?: string
  delaiPaiement?: number // Added for compatibility
  plafondCredit?: number
  tauxRemise?: number
  representantCommercial?: string

  // Fournisseur
  delaiLivraison?: number
  montantMiniCommande?: number
  fournisseurPrefere?: boolean

  // Comptabilité
  compteComptableClient?: string
  compteComptableFournisseur?: string

  // Relations
  groupId?: string
  group?: PartnerGroup
  contacts?: Contact[]
  sites?: PartnerSite[]
  addresses?: PartnerAddress[]

  // Metadata
  notes?: Record<string, unknown>
  donneesTechniques?: Record<string, unknown>

  // Timestamps
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
  societeId?: string
}

export interface PartnerGroup {
  id: string
  code: string
  name: string
  description?: string
  type: GroupType
  status: GroupStatus

  // Paramètres commerciaux
  defaultDiscount?: number
  maxDiscount?: number
  creditLimit?: number
  paymentTerms?: string
  priority?: number

  // Règles métier
  rules?: {
    requiresApproval?: boolean
    minOrderAmount?: number
    maxOrderAmount?: number
    allowedPaymentMethods?: string[]
    allowedDeliveryModes?: string[]
    blockedProducts?: string[]
    exclusiveProducts?: string[]
  }

  // Metadata
  metadata?: {
    color?: string
    icon?: string
    tags?: string[]
    customFields?: Record<string, unknown>
  }

  // Relations
  partners?: Partner[]

  // Timestamps
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
  societeId?: string
}

export interface Contact {
  id: string
  partnerId: string
  partner?: Partner

  // Identification
  civilite?: string
  nom: string
  prenom?: string
  fonction?: string
  service?: string
  role: ContactRole
  status: ContactStatus

  // Contact
  telephoneDirect?: string
  telephoneMobile?: string
  email?: string
  fax?: string

  // Préférences
  isPrincipal?: boolean
  prefereEmail?: boolean
  prefereSMS?: boolean
  accepteMarketing?: boolean

  // Disponibilité
  horairesDisponibilite?: Record<string, unknown>
  joursAbsence?: string[]
  dateNaissance?: Date

  // Site associé
  partnerSiteId?: string
  partnerSite?: PartnerSite

  // Notes
  notes?: string
  preferences?: Record<string, unknown>
  historiqueInteractions?: Array<{
    date: Date
    type: string
    description: string
    userId?: string
  }>

  // Timestamps
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
  societeId?: string
}

export interface PartnerSite {
  id: string
  partnerId: string
  partner?: Partner

  // Identification
  code: string
  nom: string
  description?: string
  type: SiteType
  status: SiteStatus

  // Configuration
  isPrincipal?: boolean
  accepteLivraisons?: boolean
  accepteEnlevements?: boolean

  // Localisation
  adresse?: string
  adresseComplement?: string
  codePostal?: string
  ville?: string
  pays?: string
  region?: string
  latitude?: number
  longitude?: number

  // Contact
  responsable?: string
  telephone?: string
  email?: string

  // Capacités logistiques
  surfaceM2?: number
  capaciteStockageTonnes?: number
  hauteurMaxM?: number
  poidsMaxTonnes?: number
  accessibilite?: AccessibiliteType
  typeVehiculeMax?: string

  // Équipements
  hasQuaiChargement?: boolean
  hasChariot?: boolean
  hasPontRoulant?: boolean
  hasGrue?: boolean

  // Horaires et instructions
  horaires?: Record<string, unknown>
  instructionsLivraison?: string
  consignesSecurite?: string
  documentsRequis?: Record<string, unknown>

  // Préférences
  preferences?: Record<string, unknown>

  // Dates
  dateOuverture?: Date
  dateFermeture?: Date

  // Relations
  contacts?: Contact[]
  addresses?: PartnerAddress[]

  // Metadata
  metadata?: Record<string, unknown>

  // Timestamps
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
  societeId?: string
}

export interface PartnerAddress {
  id: string
  partnerId: string
  partner?: Partner
  partnerSiteId?: string
  partnerSite?: PartnerSite

  // Identification
  libelle: string
  type: AddressType
  status: AddressStatus
  isDefault?: boolean

  // Adresse
  ligne1: string
  ligne2?: string
  ligne3?: string
  codePostal: string
  ville: string
  region?: string
  pays?: string
  codePays?: string

  // Géolocalisation
  latitude?: number
  longitude?: number

  // Contact
  contactNom?: string
  contactTelephone?: string
  contactEmail?: string

  // Instructions
  instructionsAcces?: string
  notes?: string

  // Validité
  dateDebut?: Date
  dateFin?: Date

  // Timestamps
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
  societeId?: string
}

// DTOs
export interface CreatePartnerDto {
  code?: string
  type: PartnerType
  denomination: string
  denominationCommerciale?: string
  category: string
  status?: PartnerStatus
  siret?: string
  numeroTVA?: string
  codeAPE?: string
  contactPrincipal?: string
  telephone?: string
  mobile?: string
  email?: string
  siteWeb?: string
  adresse?: string
  adresseComplement?: string
  codePostal?: string
  ville?: string
  pays?: string
  conditionsPaiement?: string
  modePaiement?: string
  delaiPaiement?: number
  plafondCredit?: number
  tauxRemise?: number
  representantCommercial?: string
  delaiLivraison?: number
  montantMiniCommande?: number
  fournisseurPrefere?: boolean
  compteComptableClient?: string
  compteComptableFournisseur?: string
  groupId?: string
  notes?: Record<string, unknown>
  donneesTechniques?: Record<string, unknown>
}

export interface UpdatePartnerDto extends Partial<CreatePartnerDto> {}

export interface CreateContactDto {
  civilite?: string
  nom: string
  prenom?: string
  fonction?: string
  service?: string
  role: ContactRole
  status?: ContactStatus
  telephoneDirect?: string
  telephoneMobile?: string
  email?: string
  fax?: string
  isPrincipal?: boolean
  prefereEmail?: boolean
  prefereSMS?: boolean
  accepteMarketing?: boolean
  horairesDisponibilite?: Record<string, unknown>
  joursAbsence?: string[]
  dateNaissance?: string
  partnerSiteId?: string
  notes?: string
  preferences?: Record<string, unknown>
}

export interface UpdateContactDto extends Partial<CreateContactDto> {}

export interface CreatePartnerSiteDto {
  code: string
  nom: string
  description?: string
  type: SiteType
  isPrincipal?: boolean
  accepteLivraisons?: boolean
  accepteEnlevements?: boolean
  adresse?: string
  adresseComplement?: string
  codePostal?: string
  ville?: string
  pays?: string
  region?: string
  latitude?: number
  longitude?: number
  responsable?: string
  telephone?: string
  email?: string
  surfaceM2?: number
  capaciteStockageTonnes?: number
  hauteurMaxM?: number
  poidsMaxTonnes?: number
  accessibilite?: AccessibiliteType
  typeVehiculeMax?: string
  hasQuaiChargement?: boolean
  hasChariot?: boolean
  hasPontRoulant?: boolean
  hasGrue?: boolean
  horaires?: Record<string, unknown>
  instructionsLivraison?: string
  consignesSecurite?: string
  documentsRequis?: Record<string, unknown>
  preferences?: Record<string, unknown>
  dateOuverture?: string
  dateFermeture?: string
  metadata?: Record<string, unknown>
}

export interface UpdatePartnerSiteDto extends Partial<CreatePartnerSiteDto> {
  status?: SiteStatus
}

export interface CreatePartnerAddressDto {
  libelle: string
  type: AddressType
  isDefault?: boolean
  ligne1: string
  ligne2?: string
  ligne3?: string
  codePostal: string
  ville: string
  region?: string
  pays?: string
  codePays?: string
  latitude?: number
  longitude?: number
  contactNom?: string
  contactTelephone?: string
  contactEmail?: string
  instructionsAcces?: string
  notes?: string
  dateDebut?: string
  dateFin?: string
  partnerSiteId?: string
}

export interface UpdatePartnerAddressDto extends Partial<CreatePartnerAddressDto> {
  status?: AddressStatus
}

export interface CreatePartnerGroupDto {
  code: string
  name: string
  description?: string
  type: GroupType
  defaultDiscount?: number
  maxDiscount?: number
  creditLimit?: number
  paymentTerms?: string
  priority?: number
  rules?: {
    requiresApproval?: boolean
    minOrderAmount?: number
    maxOrderAmount?: number
    allowedPaymentMethods?: string[]
    allowedDeliveryModes?: string[]
    blockedProducts?: string[]
    exclusiveProducts?: string[]
  }
  metadata?: {
    color?: string
    icon?: string
    tags?: string[]
    customFields?: Record<string, unknown>
  }
}

export interface UpdatePartnerGroupDto extends Partial<CreatePartnerGroupDto> {
  status?: GroupStatus
}

// Filters
export interface PartnerFilters {
  type?: PartnerType[]
  status?: PartnerStatus[]
  category?: string[]
  groupId?: string
  denomination?: string
  ville?: string
  codePostal?: string
  email?: string
  telephone?: string
  page?: number
  limit?: number
}

// Statistics
export interface PartnerStatistics {
  totalPartenaires: number
  totalClients: number
  totalFournisseurs: number
  totalProspects: number
  partenairesActifs: number
  partenairesInactifs: number
  partenairesSuspendus: number
  repartitionParCategorie: Record<string, number>
  repartitionParGroupe: Record<string, number>
  top10ClientsAnciennete: Array<{
    code: string
    denomination: string
    anciennete: number
  }>
}
