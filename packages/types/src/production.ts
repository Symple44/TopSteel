// packages/types/src/production.ts - Types production complets
// === ENUMS ===
export enum OrdreStatut {
  EN_ATTENTE = 'EN_ATTENTE',
  PLANIFIE = 'PLANIFIE',
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE',
  PAUSE = 'PAUSE'
}

export enum OrdrePriorite {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  URGENTE = 'URGENTE'
}

export enum OperationStatut {
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE',
  PAUSE = 'PAUSE',
  ANNULE = 'ANNULE'
}

export enum TypeOperation {
  DECOUPE = 'DECOUPE',
  SOUDAGE = 'SOUDAGE',
  ASSEMBLAGE = 'ASSEMBLAGE',
  PERCAGE = 'PERCAGE',
  PLIAGE = 'PLIAGE',
  USINAGE = 'USINAGE',
  FINITION = 'FINITION',
  CONTROLE = 'CONTROLE'
}

export enum QualiteStatut {
  EN_ATTENTE = 'EN_ATTENTE',
  CONFORME = 'CONFORME',
  NON_CONFORME = 'NON_CONFORME',
  RETOUCHE = 'RETOUCHE'
}

// === INTERFACES PRINCIPALES ===
export interface OrdreFabrication {
  id: number;
  numero: string;
  statut: OrdreStatut;
  description?: string;
  priorite: OrdrePriorite;
  dateDebutPrevue?: Date;
  dateFinPrevue?: Date;
  dateDebutReelle?: Date;
  dateFinReelle?: Date;
  avancement: number;
  responsableId?: number;
  notes?: string;
  operations?: Operation[];
  materiaux?: MaterialOrder[];
  controles?: ControleQualite[];
  projet?: string;
  projetId?: number;
  finition?: string;
  tempsPrevuTotal?: number;
  tempsReelTotal?: number;
  coutPrevuTotal?: number;
  coutReelTotal?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Operation {
  id: number;
  nom: string;
  description?: string;
  statut: OperationStatut;
  type: TypeOperation;
  dureeEstimee?: number;
  dureeReelle?: number;
  machine?: string;
  machineId?: number;
  technicien?: string;
  technicienId?: number;
  ordreId: number;
  ordre?: OrdreFabrication;
  sequence: number;
  coutEstime?: number;
  coutReel?: number;
  dateDebut?: Date;
  dateFin?: Date;
  instructions?: string;
  outilsRequis?: string[];
  competencesRequises?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Renommage pour éviter conflit avec types stocks
export interface MaterialOrder {
  id: number;
  reference: string;
  nom?: string;
  quantite: number;
  unite: string;
  description?: string;
  prixUnitaire?: number;
  prixTotal?: number;
  ordreId: number;
  materiauId?: number;
  statut?: 'REQUIS' | 'COMMANDE' | 'RECU' | 'UTILISE';
  fournisseur?: string;
  delaiLivraison?: number;
  notes?: string;
}

export interface ControleQualite {
  id: number;
  type: string;
  operationId?: number;
  ordreId: number;
  resultat: QualiteStatut;
  dateControle?: Date;
  controleur?: string;
  controleurId?: number;
  observations?: string;
  criteres?: ControleQualiteCritere[];
  photosAvant?: string[];
  photosApres?: string[];
  certificat?: string;
  conformeNormes?: boolean;
  normesApplicables?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ControleQualiteCritere {
  id: number;
  nom: string;
  valeurMesuree?: number;
  valeurRequise?: number;
  tolerance?: number;
  unite?: string;
  conforme: boolean;
  commentaire?: string;
}

// === INTERFACES DE PLANIFICATION ===
export interface PlanningItem {
  ordreId: number;
  ordre: OrdreFabrication;
  dateDebut: Date;
  dateFin: Date;
  technicienId?: number;
  technicien?: string;
  machineId?: number;
  machine?: string;
  couleur?: string;
  conflits?: PlanningConflit[];
}

export interface PlanningConflit {
  type: 'MACHINE_OCCUPEE' | 'TECHNICIEN_INDISPONIBLE' | 'MATERIAU_MANQUANT';
  ressourceId: number;
  ressourceNom: string;
  dateDebut: Date;
  dateFin: Date;
  impact: 'FAIBLE' | 'MOYEN' | 'CRITIQUE';
  suggestions?: string[];
}

// === INTERFACES DE REQUÊTES ===
export interface CreateOrdreFabricationRequest {
  numero: string;
  description?: string;
  priorite: OrdrePriorite;
  dateDebutPrevue?: Date;
  dateFinPrevue?: Date;
  projetId?: number;
  responsableId?: number;
  operations: Omit<Operation, 'id' | 'ordreId' | 'createdAt' | 'updatedAt'>[];
  materiaux: Omit<MaterialOrder, 'id' | 'ordreId'>[];
  notes?: string;
}

export interface UpdateOrdreFabricationRequest {
  statut?: OrdreStatut;
  priorite?: OrdrePriorite;
  dateDebutPrevue?: Date;
  dateFinPrevue?: Date;
  dateDebutReelle?: Date;
  dateFinReelle?: Date;
  avancement?: number;
  responsableId?: number;
  notes?: string;
}

export interface CreateOperationRequest {
  nom: string;
  description?: string;
  type: TypeOperation;
  dureeEstimee?: number;
  machineId?: number;
  technicienId?: number;
  sequence: number;
  instructions?: string;
  outilsRequis?: string[];
  competencesRequises?: string[];
}

export interface UpdateOperationRequest {
  statut?: OperationStatut;
  dureeReelle?: number;
  dateDebut?: Date;
  dateFin?: Date;
  technicienId?: number;
  machineId?: number;
  instructions?: string;
  coutReel?: number;
}

// === INTERFACES DE STATISTIQUES ===
export interface ProductionStats {
  ordresTotal: number;
  ordresEnCours: number;
  ordresTermines: number;
  ordresPlanifies: number;
  ordresEnRetard: number;
  tauxCompletion: number;
  tauxAvancement: number;
  chargeMachine: number;
  chargeHumaine: number;
  tempsProductionMoyen: number;
  coutProductionMoyen: number;
  efficaciteOperations: number;
}

export interface MachineStats {
  machineId: number;
  nom: string;
  tauxUtilisation: number;
  tempsArret: number;
  tempsProduction: number;
  ordresEnCours: number;
  operationsTerminees: number;
  maintenancesDues: number;
  prochaineMaintenance?: Date;
}

export interface TechnicienStats {
  technicienId: number;
  nom: string;
  tempsProductif: number;
  operationsTerminees: number;
  tauxEfficacite: number;
  competences: string[];
  disponibilite: number;
  prochainConge?: Date;
}

// === INTERFACES DE FILTRAGE ===
export interface ProductionFilters {
  statuts?: OrdreStatut[];
  priorites?: OrdrePriorite[];
  dateDebutMin?: Date;
  dateDebutMax?: Date;
  responsableIds?: number[];
  projetIds?: number[];
  retardOnly?: boolean;
  search?: string;
}

export interface OperationFilters {
  statuts?: OperationStatut[];
  types?: TypeOperation[];
  machineIds?: number[];
  technicienIds?: number[];
  ordreIds?: number[];
  dateDebutMin?: Date;
  dateDebutMax?: Date;
}

// === TYPES UTILITAIRES ===
export type OrdreFabricationSummary = Pick<
  OrdreFabrication,
  'id' | 'numero' | 'statut' | 'priorite' | 'avancement' | 'dateFinPrevue'
>;

export type OperationSummary = Pick<
  Operation,
  'id' | 'nom' | 'statut' | 'type' | 'dureeEstimee' | 'technicien'
>;

// === CONSTANTES ===
export const STATUT_COLORS: Record<OrdreStatut, string> = {
  [OrdreStatut.EN_ATTENTE]: '#6b7280',
  [OrdreStatut.PLANIFIE]: '#3b82f6',
  [OrdreStatut.EN_COURS]: '#f59e0b',
  [OrdreStatut.TERMINE]: '#10b981',
  [OrdreStatut.ANNULE]: '#ef4444',
  [OrdreStatut.PAUSE]: '#8b5cf6',
};

export const PRIORITE_COLORS: Record<OrdrePriorite, string> = {
  [OrdrePriorite.BASSE]: '#6b7280',
  [OrdrePriorite.NORMALE]: '#3b82f6',
  [OrdrePriorite.HAUTE]: '#f59e0b',
  [OrdrePriorite.URGENTE]: '#ef4444',
};

export const TYPE_OPERATION_LABELS: Record<TypeOperation, string> = {
  [TypeOperation.DECOUPE]: 'Découpe',
  [TypeOperation.SOUDAGE]: 'Soudage',
  [TypeOperation.ASSEMBLAGE]: 'Assemblage',
  [TypeOperation.PERCAGE]: 'Perçage',
  [TypeOperation.PLIAGE]: 'Pliage',
  [TypeOperation.USINAGE]: 'Usinage',
  [TypeOperation.FINITION]: 'Finition',
  [TypeOperation.CONTROLE]: 'Contrôle',
};
