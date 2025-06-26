// packages/types/src/common.ts
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string
}

export interface Address {
  rue: string
  codePostal: string
  ville: string
  pays?: string
  complement?: string
}

export interface Contact {
  nom: string
  prenom?: string
  telephone?: string
  email?: string
  fonction?: string
}

export type Currency = 'EUR' | 'USD' | 'GBP'
export type Unit = 'ml' | 'mm' | 'cm' | 'dm' | 'km' | 'g' | 'kg' | 't' | 'piece' | 'mm2' | 'cm2' | 'm2' | 'm3' | 'heure' | 'jours' 
// Constantes pour usage comme valeurs
export const UNITES_MESURE = {
  METRE: { id: 'm', nom: 'Mètre', symbole: 'm' },
  KILOGRAMME: { id: 'kg', nom: 'Kilogramme', symbole: 'kg' },
  LITRE: { id: 'l', nom: 'Litre', symbole: 'l' }
} as const;

// Constantes pour usage comme valeurs
export const UNITES_MESURE = {
  METRE: { id: 'm', nom: 'Mètre', symbole: 'm' },
  KILOGRAMME: { id: 'kg', nom: 'Kilogramme', symbole: 'kg' },
  LITRE: { id: 'l', nom: 'Litre', symbole: 'l' }
} as const;
