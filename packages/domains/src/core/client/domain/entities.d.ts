/**
 * 🏢 ENTITÉS MÉTIER - DOMAINE CLIENT
 * Logique métier pure pour les clients
 */
import type { BaseEntity } from '../../base'
export interface ClientContact {
  readonly nom: string
  readonly telephone: string
  readonly email: string
  readonly poste?: string
}
export interface ClientAddress {
  readonly rue: string
  readonly ville: string
  readonly codePostal: string
  readonly pays: string
  readonly complement?: string
}
export declare enum ClientType {
  PARTICULIER = 'PARTICULIER',
  PROFESSIONNEL = 'PROFESSIONNEL',
  COLLECTIVITE = 'COLLECTIVITE',
}
export declare enum ClientStatut {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  SUSPENDU = 'SUSPENDU',
  ARCHIVE = 'ARCHIVE',
}
export declare enum ClientPriorite {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  VIP = 'VIP',
}
export interface Client extends BaseEntity {
  readonly nom: string
  readonly type: ClientType
  readonly siret?: string
  readonly email: string
  readonly telephone: string
  readonly contact: ClientContact
  readonly adresse: ClientAddress
  readonly statut: ClientStatut
  readonly priorite: ClientPriorite
  readonly source?: string
  readonly notes?: string
  readonly chiffreAffaire?: number
  readonly nombreProjets?: number
  readonly dateDernierProjet?: Date
  readonly createdAt: Date
  readonly updatedAt: Date
}
export interface ClientStats {
  readonly total: number
  readonly actifs: number
  readonly nouveauxCeMois: number
  readonly chiffreAffaireMoyen: number
  readonly topClients: Client[]
}
export interface ClientWithProjects extends Client {
  readonly projets: {
    total: number
    enCours: number
    termines: number
    chiffreAffaireTotal: number
  }
}
//# sourceMappingURL=entities.d.ts.map
