/**
 * 👥 CLIENT ENTITIES - TopSteel ERP
 * Entités et interfaces pour le domaine client
 */

import type { BaseEntity, Address, Contact } from '../../core'
import type { ClientType, ClientStatus, ClientPriority } from './enums'

/**
 * Entité Client principale
 */
export interface Client extends BaseEntity {
  nom: string
  type: ClientType
  statut: ClientStatus
  priorite: ClientPriority
  siret?: string
  adresse: Address
  contact: Contact
  email: string
  telephone: string
  notes?: string
  chiffreAffaire?: number
  nombreProjets?: number
  derniereActivite?: Date
  tags?: string[]
  commercial?: string
}

/**
 * Client pour affichage dans les listes (optimisé)
 */
export interface ClientListItem {
  id: string
  nom: string
  type: ClientType
  statut: ClientStatus
  email: string
  telephone: string
  chiffreAffaire?: number
  nombreProjets?: number
  derniereActivite?: Date
}

/**
 * Filtres pour la recherche de clients
 */
export interface ClientFilters {
  type?: ClientType[]
  statut?: ClientStatus[]
  priorite?: ClientPriority[]
  chiffreAffaireMin?: number
  chiffreAffaireMax?: number
  dateCreationDebut?: Date
  dateCreationFin?: Date
  tags?: string[]
  commercial?: string
  search?: string
}