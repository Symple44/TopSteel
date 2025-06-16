// Types pour l'authentification
export interface User {
  id: string
  email: string
  nom: string
  prenom: string
  role: UserRole
  entreprise?: string
  createdAt: Date
  updatedAt: Date
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  COMMERCIAL = 'COMMERCIAL',
  TECHNICIEN = 'TECHNICIEN',
  COMPTABLE = 'COMPTABLE',
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
}

// Types pour les projets
export interface Projet {
  id: string
  reference: string
  client: Client
  clientId: string
  description: string
  statut: ProjetStatut
  dateCreation: Date
  dateDebut?: Date
  dateFin?: Date
  montantHT: number
  montantTTC: number
  avancement: number
  devis?: Devis[]
  commandes?: Commande[]
  documents?: Document[]
  createdAt: Date
  updatedAt: Date
}

export enum ProjetStatut {
  BROUILLON = 'BROUILLON',
  DEVIS = 'DEVIS',
  ACCEPTE = 'ACCEPTE',
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE',
}

// Types pour les clients
export interface Client {
  id: string
  type: ClientType
  nom: string
  email: string
  telephone: string
  adresse: Adresse
  siret?: string
  tva?: string
  projets?: Projet[]
  createdAt: Date
  updatedAt: Date
}

export enum ClientType {
  PARTICULIER = 'PARTICULIER',
  PROFESSIONNEL = 'PROFESSIONNEL',
  COLLECTIVITE = 'COLLECTIVITE',
}

export interface Adresse {
  rue: string
  codePostal: string
  ville: string
  pays: string
  complement?: string
}

// Types pour les devis
export interface Devis {
  id: string
  numero: string
  projetId: string
  projet?: Projet
  dateEmission: Date
  dateValidite: Date
  statut: DevisStatut
  montantHT: number
  montantTVA: number
  montantTTC: number
  lignes: LigneDevis[]
  conditions?: string
  createdAt: Date
  updatedAt: Date
}

export enum DevisStatut {
  BROUILLON = 'BROUILLON',
  ENVOYE = 'ENVOYE',
  ACCEPTE = 'ACCEPTE',
  REFUSE = 'REFUSE',
  EXPIRE = 'EXPIRE',
}

export interface LigneDevis {
  id: string
  devisId: string
  description: string
  quantite: number
  unite: string
  prixUnitaire: number
  montantHT: number
  tauxTVA: number
  montantTTC: number
  ordre: number
}

// Types pour les commandes
export interface Commande {
  id: string
  numero: string
  projetId: string
  projet?: Projet
  fournisseur: Fournisseur
  fournisseurId: string
  dateCommande: Date
  dateLivraisonPrevue?: Date
  statut: CommandeStatut
  montantHT: number
  montantTTC: number
  lignes: LigneCommande[]
  createdAt: Date
  updatedAt: Date
}

export enum CommandeStatut {
  BROUILLON = 'BROUILLON',
  CONFIRMEE = 'CONFIRMEE',
  EN_COURS = 'EN_COURS',
  LIVREE_PARTIELLEMENT = 'LIVREE_PARTIELLEMENT',
  LIVREE = 'LIVREE',
  ANNULEE = 'ANNULEE',
}

export interface LigneCommande {
  id: string
  commandeId: string
  produit: Produit
  produitId: string
  quantite: number
  prixUnitaire: number
  montantHT: number
  quantiteLivree: number
}

// Types pour les stocks
export interface Stock {
  id: string
  produit: Produit
  produitId: string
  quantiteDisponible: number
  quantiteReservee: number
  quantiteMinimale: number
  emplacement?: string
  mouvements?: MouvementStock[]
  createdAt: Date
  updatedAt: Date
}

export interface Produit {
  id: string
  reference: string
  designation: string
  categorie: CategorieProduit
  unite: UniteMesure
  prixAchat: number
  prixVente: number
  fournisseurPrincipal?: Fournisseur
  fournisseurPrincipalId?: string
  specifications?: Record<string, any>
  stock?: Stock
  createdAt: Date
  updatedAt: Date
}

export enum CategorieProduit {
  PROFILE = 'PROFILE',
  TOLE = 'TOLE',
  TUBE = 'TUBE',
  ACCESSOIRE = 'ACCESSOIRE',
  CONSOMMABLE = 'CONSOMMABLE',
  QUINCAILLERIE = 'QUINCAILLERIE',
}

export enum UniteMesure {
  METRE = 'METRE',
  METRE_CARRE = 'METRE_CARRE',
  KILOGRAMME = 'KILOGRAMME',
  PIECE = 'PIECE',
  LITRE = 'LITRE',
}

export interface MouvementStock {
  id: string
  stockId: string
  type: TypeMouvement
  quantite: number
  reference?: string
  motif: string
  utilisateurId: string
  createdAt: Date
}

export enum TypeMouvement {
  ENTREE = 'ENTREE',
  SORTIE = 'SORTIE',
  RESERVATION = 'RESERVATION',
  AJUSTEMENT = 'AJUSTEMENT',
}

// Types pour la production
export interface OrdreFabrication {
  id: string
  numero: string
  projetId: string
  projet?: Projet
  statut: StatutProduction
  dateDebut: Date
  dateFin?: Date
  priorite: PrioriteProduction
  operations: Operation[]
  createdAt: Date
  updatedAt: Date
}

export enum StatutProduction {
  PLANIFIE = 'PLANIFIE',
  EN_COURS = 'EN_COURS',
  PAUSE = 'PAUSE',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE',
}

export enum PrioriteProduction {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  URGENTE = 'URGENTE',
}

export interface Operation {
  id: string
  ordreFabricationId: string
  nom: string
  description?: string
  dureeEstimee: number // en minutes
  dureeReelle?: number
  statut: StatutOperation
  technicienId?: string
  technicien?: User
  dateDebut?: Date
  dateFin?: Date
}

export enum StatutOperation {
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  TERMINEE = 'TERMINEE',
  BLOQUEE = 'BLOQUEE',
}

// Types pour les fournisseurs
export interface Fournisseur {
  id: string
  nom: string
  email: string
  telephone: string
  adresse: Adresse
  siret?: string
  delaiLivraison?: number // en jours
  conditionsPaiement?: string
  produits?: Produit[]
  commandes?: Commande[]
  createdAt: Date
  updatedAt: Date
}

// Types pour les documents
export interface Document {
  id: string
  nom: string
  type: TypeDocument
  url: string
  taille: number
  projetId?: string
  projet?: Projet
  uploadePar: string
  createdAt: Date
}

export enum TypeDocument {
  PLAN = 'PLAN',
  DEVIS = 'DEVIS',
  FACTURE = 'FACTURE',
  BON_COMMANDE = 'BON_COMMANDE',
  BON_LIVRAISON = 'BON_LIVRAISON',
  PHOTO = 'PHOTO',
  AUTRE = 'AUTRE',
}

// Types pour le chiffrage
export interface CalculChiffrage {
  id: string
  nom: string
  description?: string
  elements: ElementChiffrage[]
  montantMatieres: number
  montantMainOeuvre: number
  montantSousTraitance: number
  margeCommerciale: number
  montantHT: number
  montantTTC: number
  createdAt: Date
  updatedAt: Date
}

export interface ElementChiffrage {
  id: string
  type: TypeElementChiffrage
  designation: string
  quantite: number
  unite: string
  prixUnitaire: number
  montant: number
  formule?: string
  parametres?: Record<string, number>
}

export enum TypeElementChiffrage {
  MATIERE = 'MATIERE',
  MAIN_OEUVRE = 'MAIN_OEUVRE',
  SOUS_TRAITANCE = 'SOUS_TRAITANCE',
  DIVERS = 'DIVERS',
}

// Types pour les requêtes API
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  message: string
  code?: string
  details?: any
}

// Types pour les filtres
export interface ProjetFilters {
  search?: string
  statut?: ProjetStatut[]
  clientId?: string
  dateDebut?: Date
  dateFin?: Date
  montantMin?: number
  montantMax?: number
}

export interface StockFilters {
  search?: string
  categorie?: CategorieProduit[]
  stockCritique?: boolean
  fournisseurId?: string
}