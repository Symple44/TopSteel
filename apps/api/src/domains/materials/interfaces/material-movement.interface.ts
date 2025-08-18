/**
 * Type de mouvement de matériau
 */
export enum MaterialMovementType {
  ENTREE = 'ENTREE',
  SORTIE = 'SORTIE',
  TRANSFERT = 'TRANSFERT',
  CORRECTION = 'CORRECTION',
  INVENTAIRE = 'INVENTAIRE',
  TRANSFORMATION = 'TRANSFORMATION',
  ASSEMBLAGE = 'ASSEMBLAGE',
  DESASSEMBLAGE = 'DESASSEMBLAGE',
  PERTE = 'PERTE',
  RETOUR = 'RETOUR',
}

/**
 * Motif du mouvement de matériau
 */
export enum MaterialMovementReason {
  // Entrées
  ACHAT = 'ACHAT',
  PRODUCTION_INTERNE = 'PRODUCTION_INTERNE',
  RETOUR_CLIENT = 'RETOUR_CLIENT',
  RETOUR_PRODUCTION = 'RETOUR_PRODUCTION',
  CORRECTION_POSITIVE = 'CORRECTION_POSITIVE',
  INVENTAIRE_POSITIF = 'INVENTAIRE_POSITIF',
  RECEPTION_TRANSFERT = 'RECEPTION_TRANSFERT',

  // Sorties
  CONSOMMATION_PRODUCTION = 'CONSOMMATION_PRODUCTION',
  VENTE = 'VENTE',
  EXPEDITION_TRANSFERT = 'EXPEDITION_TRANSFERT',
  ECHANTILLON = 'ECHANTILLON',
  ESSAI_DESTRUCTIF = 'ESSAI_DESTRUCTIF',
  RETOUR_FOURNISSEUR = 'RETOUR_FOURNISSEUR',
  CORRECTION_NEGATIVE = 'CORRECTION_NEGATIVE',
  INVENTAIRE_NEGATIF = 'INVENTAIRE_NEGATIF',
  REBUT = 'REBUT',
  DETERIORATION = 'DETERIORATION',
  VOL_PERTE = 'VOL_PERTE',

  // Transformations
  DECOUPE = 'DECOUPE',
  USINAGE = 'USINAGE',
  FORMAGE = 'FORMAGE',
  SOUDAGE = 'SOUDAGE',
  TRAITEMENT_THERMIQUE = 'TRAITEMENT_THERMIQUE',
  TRAITEMENT_SURFACE = 'TRAITEMENT_SURFACE',

  // Autres
  MAINTENANCE = 'MAINTENANCE',
  CONTROLE_QUALITE = 'CONTROLE_QUALITE',
  AUTRE = 'AUTRE',
}

/**
 * Statut du mouvement de matériau
 */
export enum MaterialMovementStatus {
  BROUILLON = 'BROUILLON',
  EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
  VALIDE = 'VALIDE',
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE',
  REJETE = 'REJETE',
}

/**
 * Priorité du mouvement
 */
export enum MaterialMovementPriority {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  URGENTE = 'URGENTE',
  CRITIQUE = 'CRITIQUE',
}

/**
 * Interface pour les informations de traçabilité
 */
export interface IMaterialTraceabilityInfo {
  /** Numéro de lot */
  numeroLot?: string

  /** Numéro de série */
  numeroSerie?: string

  /** Certificat matière */
  certificatMatiere?: string

  /** Numéro de coulée */
  numeroCoulee?: string

  /** Date de fabrication */
  dateFabrication?: Date

  /** Fournisseur origine */
  fournisseurOrigine?: string

  /** Références fournisseur */
  referencesFournisseur?: string[]

  /** Normes et certifications */
  normesCertifications?: string[]

  /** Résultats d'essais */
  resultatsEssais?: Record<string, unknown>

  /** Chaîne de traçabilité */
  chineTracabilite?: string[]
}

/**
 * Interface pour les informations de transformation
 */
export interface IMaterialTransformationInfo {
  /** Type de transformation */
  typeTransformation: string

  /** Matériaux sources */
  materiauxSources: {
    materialId: string
    materialCode: string
    quantiteConsommee: number
    unite: string
  }[]

  /** Matériaux produits */
  materiauxProduits: {
    materialId: string
    materialCode: string
    quantiteProduite: number
    unite: string
  }[]

  /** Paramètres de transformation */
  parametres?: Record<string, unknown>

  /** Rendement (%) */
  rendement?: number

  /** Temps de transformation */
  tempsTransformation?: number

  /** Opérateur */
  operateur?: string

  /** Machine/Équipement utilisé */
  equipement?: string

  /** Instructions spéciales */
  instructions?: string
}

/**
 * Interface pour un mouvement de matériau
 */
export interface IMaterialMovement {
  /** Identifiant unique du mouvement */
  id: string

  /** Référence unique du mouvement */
  reference: string

  /** ID du matériau concerné */
  materialId: string

  /** Code matériau pour référence rapide */
  materialCode?: string

  /** Nom du matériau pour référence rapide */
  materialNom?: string

  /** Type de mouvement */
  type: MaterialMovementType

  /** Motif du mouvement */
  motif: MaterialMovementReason

  /** Priorité du mouvement */
  priorite: MaterialMovementPriority

  /** Statut du mouvement */
  status: MaterialMovementStatus

  /** Quantité du mouvement */
  quantite: number

  /** Unité de mesure */
  unite: string

  /** Poids total du mouvement */
  poidTotal?: number

  /** Volume total du mouvement */
  volumeTotal?: number

  /** Stock avant le mouvement */
  stockAvant: number

  /** Stock après le mouvement */
  stockApres: number

  /** Valeur unitaire au moment du mouvement */
  valeurUnitaire?: number

  /** Valeur totale du mouvement */
  valeurTotale?: number

  /** Devise */
  devise?: string

  /** Date du mouvement */
  dateMovement: Date

  /** Date prévue (si différente de la date réelle) */
  datePrevue?: Date

  /** Emplacement source */
  emplacementSource?: string

  /** Emplacement destination */
  emplacementDestination?: string

  /** Zone source */
  zoneSource?: string

  /** Zone destination */
  zoneDestination?: string

  /** Informations de traçabilité */
  tracabilite?: IMaterialTraceabilityInfo

  /** Informations de transformation (si applicable) */
  transformation?: IMaterialTransformationInfo

  /** ID du document source */
  documentSourceId?: string

  /** Type de document source */
  typeDocumentSource?: string

  /** Numéro du document source */
  numeroDocumentSource?: string

  /** ID de l'ordre de fabrication (si applicable) */
  ordreFabricationId?: string

  /** ID de la commande (si applicable) */
  commandeId?: string

  /** ID du projet (si applicable) */
  projetId?: string

  /** ID de l'utilisateur qui a effectué le mouvement */
  utilisateurId: string

  /** Nom de l'utilisateur pour référence rapide */
  utilisateurNom?: string

  /** ID du validateur */
  validateurId?: string

  /** Nom du validateur pour référence rapide */
  validateurNom?: string

  /** Date de validation */
  dateValidation?: Date

  /** Commentaires de validation */
  commentairesValidation?: string

  /** Contrôle qualité effectué */
  controleQualite?: {
    effectue: boolean
    conforme?: boolean
    controleur?: string
    dateControle?: Date
    commentaires?: string
    mesures?: Record<string, number>
    defauts?: string[]
  }

  /** Conditions de stockage requises */
  conditionsStockage?: {
    temperature?: number
    humidite?: number
    atmosphere?: string
    protection?: string[]
    precautions?: string[]
  }

  /** Informations de transport */
  transport?: {
    transporteurId?: string
    transporteurNom?: string
    numeroLivraison?: string
    dateExpedition?: Date
    dateLivraisonPrevue?: Date
    dateLivraisonReelle?: Date
    conditionsTransport?: string
    emballage?: string
  }

  /** Coûts associés */
  couts?: {
    coutMateriau?: number
    coutMain?: number
    coutMachine?: number
    coutTransport?: number
    coutStockage?: number
    coutTotal?: number
    devise?: string
  }

  /** Photos et documents */
  documents?: {
    photos?: string[]
    bonLivraison?: string
    certificats?: string[]
    rapportControle?: string
    autresDocuments?: string[]
  }

  /** Notes et commentaires */
  notes?: string

  /** Métadonnées additionnelles */
  metadonnees?: Record<string, unknown>

  /** Date de création de l'enregistrement */
  dateCreation: Date

  /** Date de dernière modification */
  dateModification?: Date

  /** Historique des modifications */
  historiqueModifications?: {
    date: Date
    utilisateur: string
    champ: string
    ancienneValeur: unknown
    nouvelleValeur: unknown
  }[]
}

/**
 * Interface pour les filtres de recherche des mouvements de matériaux
 */
export interface IMaterialMovementFilters {
  /** Filtrer par matériau */
  materialIds?: string[]

  /** Filtrer par code matériau */
  materialCodes?: string[]

  /** Filtrer par type de matériau */
  materialTypes?: string[]

  /** Filtrer par type de mouvement */
  types?: MaterialMovementType[]

  /** Filtrer par motif */
  motifs?: MaterialMovementReason[]

  /** Filtrer par statut */
  status?: MaterialMovementStatus[]

  /** Filtrer par priorité */
  priorites?: MaterialMovementPriority[]

  /** Filtrer par période */
  dateDebut?: Date
  dateFin?: Date

  /** Filtrer par utilisateur */
  utilisateurIds?: string[]

  /** Filtrer par validateur */
  validateurIds?: string[]

  /** Filtrer par emplacement */
  emplacementsSource?: string[]
  emplacementsDestination?: string[]

  /** Filtrer par zone */
  zonesSource?: string[]
  zonesDestination?: string[]

  /** Filtrer par document source */
  documentSourceIds?: string[]
  typeDocumentSource?: string

  /** Filtrer par projet */
  projetIds?: string[]

  /** Filtrer par commande */
  commandeIds?: string[]

  /** Filtrer par ordre de fabrication */
  ordreFabricationIds?: string[]

  /** Filtrer par lot */
  numeroLot?: string

  /** Filtrer par série */
  numeroSerie?: string

  /** Filtrer par certificat */
  certificatMatiere?: string

  /** Filtrer par contrôle qualité */
  controleQualite?: 'EFFECTUE' | 'NON_EFFECTUE' | 'CONFORME' | 'NON_CONFORME'

  /** Filtrer par transformation */
  avecTransformation?: boolean

  /** Recherche textuelle */
  recherche?: string

  /** Quantité minimum */
  quantiteMin?: number

  /** Quantité maximum */
  quantiteMax?: number

  /** Valeur minimum */
  valeurMin?: number

  /** Valeur maximum */
  valeurMax?: number

  /** Poids minimum */
  poidsMin?: number

  /** Poids maximum */
  poidsMax?: number

  /** Pagination */
  page?: number
  limit?: number

  /** Tri */
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * Interface pour les options de tri des mouvements de matériaux
 */
export interface IMaterialMovementSortOptions {
  /** Champ de tri */
  champ:
    | 'dateMovement'
    | 'reference'
    | 'materialCode'
    | 'quantite'
    | 'valeurTotale'
    | 'status'
    | 'priorite'
    | 'utilisateurNom'
    | 'dateCreation'

  /** Direction du tri */
  direction: 'ASC' | 'DESC'
}

/**
 * Interface pour la création d'un mouvement de matériau
 */
export interface ICreateMaterialMovement {
  /** ID du matériau concerné */
  materialId: string

  /** Type de mouvement */
  type: MaterialMovementType

  /** Motif du mouvement */
  motif: MaterialMovementReason

  /** Quantité du mouvement */
  quantite: number

  /** Priorité (par défaut NORMALE) */
  priorite?: MaterialMovementPriority

  /** Valeur unitaire optionnelle */
  valeurUnitaire?: number

  /** Date du mouvement (par défaut maintenant) */
  dateMovement?: Date

  /** Date prévue */
  datePrevue?: Date

  /** Emplacement source */
  emplacementSource?: string

  /** Emplacement destination */
  emplacementDestination?: string

  /** Zone source */
  zoneSource?: string

  /** Zone destination */
  zoneDestination?: string

  /** Informations de traçabilité */
  tracabilite?: Partial<IMaterialTraceabilityInfo>

  /** Informations de transformation */
  transformation?: Partial<IMaterialTransformationInfo>

  /** ID du document source */
  documentSourceId?: string

  /** Type de document source */
  typeDocumentSource?: string

  /** Numéro du document source */
  numeroDocumentSource?: string

  /** ID du projet */
  projetId?: string

  /** ID de la commande */
  commandeId?: string

  /** ID de l'ordre de fabrication */
  ordreFabricationId?: string

  /** Contrôle qualité */
  controleQualite?: {
    effectue: boolean
    conforme?: boolean
    commentaires?: string
    mesures?: Record<string, number>
  }

  /** Conditions de stockage */
  conditionsStockage?: {
    temperature?: number
    humidite?: number
    atmosphere?: string
    precautions?: string[]
  }

  /** Notes et commentaires */
  notes?: string

  /** Métadonnées additionnelles */
  metadonnees?: Record<string, unknown>
}
