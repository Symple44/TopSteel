/**
 * 🏭 ENTITÉS MÉTIER - DOMAINE PRODUCTION
 * Logique métier pure pour la production
 */

import type { BaseEntity } from '../../../core/base'

// ===== ENUMS MÉTIER =====

export enum OrdreStatut {
  BROUILLON = 'BROUILLON',
  PLANIFIE = 'PLANIFIE',
  EN_COURS = 'EN_COURS',
  SUSPENDU = 'SUSPENDU',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE',
  LIVRE = 'LIVRE',
}

export enum OrdrePriorite {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  URGENTE = 'URGENTE',
}

export enum StatutProduction {
  NON_COMMENCE = 'NON_COMMENCE',
  EN_PREPARATION = 'EN_PREPARATION',
  EN_COURS = 'EN_COURS',
  EN_PAUSE = 'EN_PAUSE',
  CONTROLE_QUALITE = 'CONTROLE_QUALITE',
  TERMINE = 'TERMINE',
  REJETE = 'REJETE',
}

export enum TypeOperation {
  DECOUPE = 'DECOUPE',
  SOUDURE = 'SOUDURE',
  ASSEMBLAGE = 'ASSEMBLAGE',
  USINAGE = 'USINAGE',
  PLIAGE = 'PLIAGE',
  PEINTURE = 'PEINTURE',
  FINITION = 'FINITION',
  CONTROLE = 'CONTROLE',
}

export enum OperationStatut {
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  TERMINEE = 'TERMINEE',
  BLOQUEE = 'BLOQUEE',
  ANNULEE = 'ANNULEE',
}

export enum PrioriteProduction {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  CRITIQUE = 'CRITIQUE',
}

export enum QualiteStatut {
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  CONFORME = 'CONFORME',
  NON_CONFORME = 'NON_CONFORME',
  A_REPRENDRE = 'A_REPRENDRE',
}

export enum MaterialStatus {
  DISPONIBLE = 'DISPONIBLE',
  COMMANDE = 'COMMANDE',
  EN_RECEPTION = 'EN_RECEPTION',
  MANQUANT = 'MANQUANT',
  RESERVE = 'RESERVE',
}

// ===== VALUE OBJECTS =====

export interface ProductionSchedule {
  readonly dateDebut: Date
  readonly dateFin: Date
  readonly dureeEstimee: number // en heures
  readonly dureeReelle?: number // en heures
}

export interface QualityRequirements {
  readonly normes: string[]
  readonly tolerances: Record<string, number>
  readonly controles: string[]
  readonly certificationsRequises: string[]
}

export interface MaterialRequirement {
  readonly materialId: string
  readonly designation: string
  readonly quantiteRequise: number
  readonly quantiteDisponible: number
  readonly unite: string
  readonly statut: MaterialStatus
  readonly fournisseur?: string
}

// ===== ENTITÉS =====

export interface Operation extends BaseEntity {
  readonly nom: string
  readonly description?: string
  readonly type: TypeOperation
  readonly statut: OperationStatut
  readonly priorite: PrioriteProduction
  readonly ordre: number
  
  // Planning
  readonly schedule: ProductionSchedule
  readonly prerequis: string[] // IDs des opérations prérequises
  
  // Ressources
  readonly machineId?: string
  readonly operateurIds: string[]
  readonly outillage: string[]
  
  // Techniques
  readonly instructions?: string
  readonly parametres: Record<string, any>
  readonly qualite: QualityRequirements
  
  // Suivi
  readonly tempsEstime: number // en heures
  readonly tempsReel?: number // en heures
  readonly avancement: number // 0-100
  
  // Relations
  readonly ordreId: string
  readonly projetId: string
  
  // Audit
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly createdBy: string
}

export interface OrdreFabrication extends BaseEntity {
  readonly numero: string
  readonly reference: string
  readonly designation: string
  readonly statut: OrdreStatut
  readonly priorite: OrdrePriorite
  readonly statutProduction: StatutProduction
  
  // Relations
  readonly projetId: string
  readonly clientId: string
  readonly responsableId: string
  
  // Contenu
  readonly operations: Operation[]
  readonly materiaux: MaterialRequirement[]
  readonly plans: string[]
  readonly specifications?: string
  
  // Planning
  readonly dateCreation: Date
  readonly datePrevue: Date
  readonly dateDebut?: Date
  readonly dateFin?: Date
  readonly delaiProduction: number // en jours
  
  // Quantités
  readonly quantiteCommande: number
  readonly quantiteProduite: number
  readonly quantiteLivree: number
  readonly unite: string
  
  // Coûts
  readonly coutEstime?: number
  readonly coutReel?: number
  readonly tempsPrevuTotal: number // en heures
  readonly tempsReelTotal?: number // en heures
  
  // Qualité
  readonly qualiteRequise: QualityRequirements
  readonly controles: ControleQualite[]
  
  // Audit
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly createdBy: string
}

export interface ControleQualite extends BaseEntity {
  readonly numero: string
  readonly type: string
  readonly statut: QualiteStatut
  readonly description: string
  
  // Relations
  readonly ordreId: string
  readonly operationId?: string
  readonly controleurId: string
  
  // Contrôle
  readonly dateControle: Date
  readonly criteres: Array<{
    nom: string
    valeurAttendue: string | number
    valeurMesuree?: string | number
    conforme: boolean
    commentaire?: string
  }>
  
  // Résultats
  readonly conformeGlobal: boolean
  readonly defauts: string[]
  readonly actions: string[]
  readonly certificats: string[]
  
  // Audit
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface MaterialOrder extends BaseEntity {
  readonly materialId: string
  readonly designation: string
  readonly quantite: number
  readonly quantiteRecue: number
  readonly unite: string
  readonly statut: MaterialStatus
  
  // Relations
  readonly ordreId: string
  readonly fournisseurId?: string
  
  // Commande
  readonly dateCommande?: Date
  readonly dateLivraisonPrevue?: Date
  readonly dateLivraisonReelle?: Date
  readonly prixUnitaire?: number
  readonly montantTotal?: number
  
  // Caractéristiques
  readonly specifications?: Record<string, any>
  readonly certification?: string
  readonly numeroLot?: string
  
  // Audit
  readonly createdAt: Date
  readonly updatedAt: Date
}

// ===== AGRÉGATS =====

export interface ProductionStats {
  readonly ordresTotal: number
  readonly ordresEnCours: number
  readonly ordresTermines: number
  readonly tauxRealisation: number
  readonly tempsProductionMoyen: number
  readonly tauxQualite: number
}