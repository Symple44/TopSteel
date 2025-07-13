/**
 * 🌐 TYPES COMMUNS - TopSteel ERP
 * Types partagés utilisés dans plusieurs domaines
 */

/**
 * Adresse postale
 */
export interface Address {
  rue: string
  codePostal: string
  ville: string
  pays?: string
  complement?: string
}

/**
 * Contact personne
 */
export interface Contact {
  nom: string
  prenom?: string
  telephone?: string
  email?: string
  fonction?: string
}

/**
 * Devises supportées
 */
export type Currency = 'EUR' | 'USD' | 'GBP'

/**
 * Unités de mesure
 */
export type Unit =
  | 'ml'
  | 'mm'
  | 'cm'
  | 'dm'
  | 'km'
  | 'g'
  | 'kg'
  | 't'
  | 'piece'
  | 'mm2'
  | 'cm2'
  | 'm2'
  | 'm3'
  | 'heure'
  | 'jours'

/**
 * Couleurs standards
 */
export type Color = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'

/**
 * Tailles standards
 */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * Positions/orientations
 */
export type Position = 'top' | 'bottom' | 'left' | 'right' | 'center'

/**
 * Status génériques
 */
export type GenericStatus = 'active' | 'inactive' | 'pending' | 'archived'
