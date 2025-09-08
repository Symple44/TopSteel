/**
 * 🏭 ENTITÉS MÉTIER - DOMAINE PRODUCTION
 * Logique métier pure pour la production
 */
import type { BaseEntity } from '../../../core/base'
export declare enum OrdreStatut {
  BROUILLON = 'BROUILLON',
  PLANIFIE = 'PLANIFIE',
  EN_COURS = 'EN_COURS',
  SUSPENDU = 'SUSPENDU',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE',
  LIVRE = 'LIVRE',
}
export declare enum OrdrePriorite {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  URGENTE = 'URGENTE',
}
export declare enum StatutProduction {
  NON_COMMENCE = 'NON_COMMENCE',
  EN_PREPARATION = 'EN_PREPARATION',
  EN_COURS = 'EN_COURS',
  EN_PAUSE = 'EN_PAUSE',
  CONTROLE_QUALITE = 'CONTROLE_QUALITE',
  TERMINE = 'TERMINE',
  REJETE = 'REJETE',
}
export declare enum TypeOperation {
  DECOUPE = 'DECOUPE',
  SOUDURE = 'SOUDURE',
  ASSEMBLAGE = 'ASSEMBLAGE',
  USINAGE = 'USINAGE',
  PLIAGE = 'PLIAGE',
  PEINTURE = 'PEINTURE',
  FINITION = 'FINITION',
  CONTROLE = 'CONTROLE',
}
export declare enum OperationStatut {
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  TERMINEE = 'TERMINEE',
  BLOQUEE = 'BLOQUEE',
  ANNULEE = 'ANNULEE',
}
export declare enum PrioriteProduction {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  CRITIQUE = 'CRITIQUE',
}
export declare enum QualiteStatut {
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  CONFORME = 'CONFORME',
  NON_CONFORME = 'NON_CONFORME',
  A_REPRENDRE = 'A_REPRENDRE',
}
export declare enum MaterialStatus {
  DISPONIBLE = 'DISPONIBLE',
  COMMANDE = 'COMMANDE',
  EN_RECEPTION = 'EN_RECEPTION',
  MANQUANT = 'MANQUANT',
  RESERVE = 'RESERVE',
}
export interface ProductionSchedule {
  readonly dateDebut: Date
  readonly dateFin: Date
  readonly dureeEstimee: number
  readonly dureeReelle?: number
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
export interface Operation extends BaseEntity {
  readonly nom: string
  readonly description?: string
  readonly type: TypeOperation
  readonly statut: OperationStatut
  readonly priorite: PrioriteProduction
  readonly ordre: number
  readonly schedule: ProductionSchedule
  readonly prerequis: string[]
  readonly machineId?: string
  readonly operateurIds: string[]
  readonly outillage: string[]
  readonly instructions?: string
  readonly parametres: Record<string, unknown>
  readonly qualite: QualityRequirements
  readonly tempsEstime: number
  readonly tempsReel?: number
  readonly avancement: number
  readonly ordreId: string
  readonly projetId: string
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
  readonly projetId: string
  readonly clientId: string
  readonly responsableId: string
  readonly operations: Operation[]
  readonly materiaux: MaterialRequirement[]
  readonly plans: string[]
  readonly specifications?: string
  readonly dateCreation: Date
  readonly datePrevue: Date
  readonly dateDebut?: Date
  readonly dateFin?: Date
  readonly delaiProduction: number
  readonly quantiteCommande: number
  readonly quantiteProduite: number
  readonly quantiteLivree: number
  readonly unite: string
  readonly coutEstime?: number
  readonly coutReel?: number
  readonly tempsPrevuTotal: number
  readonly tempsReelTotal?: number
  readonly qualiteRequise: QualityRequirements
  readonly controles: ControleQualite[]
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly createdBy: string
}
export interface ControleQualite extends BaseEntity {
  readonly numero: string
  readonly type: string
  readonly statut: QualiteStatut
  readonly description: string
  readonly ordreId: string
  readonly operationId?: string
  readonly controleurId: string
  readonly dateControle: Date
  readonly criteres: Array<{
    nom: string
    valeurAttendue: string | number
    valeurMesuree?: string | number
    conforme: boolean
    commentaire?: string
  }>
  readonly conformeGlobal: boolean
  readonly defauts: string[]
  readonly actions: string[]
  readonly certificats: string[]
  readonly createdAt: Date
  readonly updatedAt: Date
}
export interface ProductionFilters {
  statut?: StatutProduction | StatutProduction[]
  priorite?: PrioriteProduction | PrioriteProduction[]
  dateDebutMin?: Date
  dateDebutMax?: Date
  dateFinMin?: Date
  dateFinMax?: Date
  clientId?: string
  projetId?: string
  operateur?: string
  page?: number
  limit?: number
  sortBy?: 'dateDebut' | 'dateFin' | 'priorite' | 'statut' | 'reference'
  sortOrder?: 'asc' | 'desc'
}
export interface MaterialOrder extends BaseEntity {
  readonly materialId: string
  readonly designation: string
  readonly quantite: number
  readonly quantiteRecue: number
  readonly unite: string
  readonly statut: MaterialStatus
  readonly ordreId: string
  readonly fournisseurId?: string
  readonly dateCommande?: Date
  readonly dateLivraisonPrevue?: Date
  readonly dateLivraisonReelle?: Date
  readonly prixUnitaire?: number
  readonly montantTotal?: number
  readonly specifications?: Record<string, unknown>
  readonly certification?: string
  readonly numeroLot?: string
  readonly createdAt: Date
  readonly updatedAt: Date
}
export interface ProductionStats {
  readonly ordresTotal: number
  readonly ordresEnCours: number
  readonly ordresTermines: number
  readonly tauxRealisation: number
  readonly tempsProductionMoyen: number
  readonly tauxQualite: number
}
//# sourceMappingURL=entities.d.ts.map
