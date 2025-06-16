// packages/types/src/projet.ts
export enum ProjetStatut {
  BROUILLON = 'BROUILLON',
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  EN_PAUSE = 'EN_PAUSE',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE',
  FACTURE = 'FACTURE'
}

export enum ProjetType {
  PORTAIL = 'PORTAIL',
  CLOTURE = 'CLOTURE',
  ESCALIER = 'ESCALIER',
  RAMPE = 'RAMPE',
  VERRIERE = 'VERRIERE',
  STRUCTURE = 'STRUCTURE',
  BARDAGE = 'BARDAGE',
  COUVERTURE = 'COUVERTURE',
  CHARPENTE = 'CHARPENTE',
  PHOTOVOLTAIQUE = 'PHOTOVOLTAIQUE',
  AUTRE = 'AUTRE'
}

export enum ProjetPriorite {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  URGENTE = 'URGENTE'
}

export interface Projet extends BaseEntity {
  reference: string
  description: string
  client: Client
  clientId: string
  statut: ProjetStatut
  type: ProjetType
  priorite: ProjetPriorite
  dateDebut?: Date
  dateFin?: Date
  dateFinPrevue?: Date
  adresseChantier: Address
  montantHT: number
  montantTTC: number
  tauxTVA: number
  marge: number
  avancement: number
  notes?: string
  alertes?: string[]
  responsable?: User
  responsableId?: string
  documentsIds: string[]
  ordresFabricationIds: string[]
}
