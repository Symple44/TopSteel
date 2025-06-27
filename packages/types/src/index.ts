// Types de base
export type ProjetStatut = 'NOUVEAU' | 'EN_COURS' | 'TERMINE' | 'ANNULE' | 'EN_ATTENTE'
export type DevisStatut = 'BROUILLON' | 'ENVOYE' | 'ACCEPTE' | 'REFUSE'
export type PrioriteProduction = 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE'
export type StatutProduction = 'EN_ATTENTE' | 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'ANNULE' | 'PAUSE'

// Interface Client
export interface Client {
  id: string
  nom: string
  email?: string
  telephone?: string
  adresse?: {
    rue?: string
    ville?: string
    codePostal?: string
  }
  siret?: string
}

// Interface Projet complète
export interface Projet {
  id: string
  nom: string
  description?: string
  client?: Client
  statut?: ProjetStatut
  montantHT: number
  montantTTC: number
  dateCreation?: Date
  dateEcheance?: Date
  dateFin?: Date
  reference?: string
  avancement?: number
  devis?: Devis[]
  documents?: any[]
  responsable?: {
    id: string
    nom: string
  }
}

// Interface Devis
export interface Devis {
  id: string
  numero: string
  version: string
  projetId: string
  dateCreation: Date
  dateValidite: Date
  statut: DevisStatut
  montantHT: number
  montantTTC: number
  accepte: boolean
}

// Types d'authentification
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: User
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface ProjetFormData {
  nom: string
  description?: string
  clientId: string
  montantHT: number
  dateEcheance?: Date
  responsableId?: string
}

export interface User {
  id: string
  nom: string
  email: string
  role: string
}

export interface Produit {
  id: string
  reference: string
  designation: string
  categorie: string
  unite: string
  prixAchat: number
  prixVente: number
}

export interface Stock {
  id: string
  produit: Produit
  quantiteDisponible: number
  quantiteReservee: number
  quantiteMinimale: number
  emplacement: string
}

// Constantes
export const PROJET_STATUT = {
  NOUVEAU: 'NOUVEAU',
  EN_COURS: 'EN_COURS',
  TERMINE: 'TERMINE',
  ANNULE: 'ANNULE',
  EN_ATTENTE: 'EN_ATTENTE'
} as const

export const PRIORITE_PRODUCTION = {
  BASSE: 'BASSE',
  NORMALE: 'NORMALE',
  HAUTE: 'HAUTE',
  URGENTE: 'URGENTE'
} as const

export const STATUT_PRODUCTION = {
  EN_ATTENTE: 'EN_ATTENTE',
  PLANIFIE: 'PLANIFIE',
  EN_COURS: 'EN_COURS',
  TERMINE: 'TERMINE',
  ANNULE: 'ANNULE',
  PAUSE: 'PAUSE'
} as const

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export const DEVIS_STATUT = {
  BROUILLON: 'BROUILLON',
  DEVIS: 'DEVIS', 
  ACCEPTE: 'ACCEPTE',
  REFUSE: 'REFUSE'
} as const
