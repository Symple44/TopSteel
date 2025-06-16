// packages/types/src/forms.ts
export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface ProjetFormData {
  clientId: string
  description: string
  type: ProjetType
  priorite: ProjetPriorite
  dateDebut?: string
  dateFin?: string
  adresseChantier: Address
  notes?: string
}

export interface ClientFormData {
  nom: string
  type: ClientType
  siret?: string
  adresse: Address
  contact: Contact
  email: string
  telephone: string
  notes?: string
}

export interface StockFormData {
  reference: string
  designation: string
  description?: string
  type: StockType
  quantiteStock: number
  quantiteMin: number
  quantiteMax: number
  unite: Unit
  prixAchat: number
  prixVente?: number
  fournisseur: string
  emplacement: string
}