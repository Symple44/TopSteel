/**
 * Types d'interaction avec un partenaire
 */
export enum PartnerInteractionType {
  // Communications
  APPEL_TELEPHONIQUE = 'APPEL_TELEPHONIQUE',
  EMAIL = 'EMAIL',
  REUNION = 'REUNION',
  VISIOCONFERENCE = 'VISIOCONFERENCE',
  COURRIER = 'COURRIER',
  CHAT = 'CHAT',
  SMS = 'SMS',

  // Activités commerciales
  PROSPECTION = 'PROSPECTION',
  NEGOCIATION = 'NEGOCIATION',
  PRESENTATION = 'PRESENTATION',
  DEMONSTRATION = 'DEMONSTRATION',
  DEVIS = 'DEVIS',
  COMMANDE = 'COMMANDE',
  LIVRAISON = 'LIVRAISON',
  FACTURATION = 'FACTURATION',
  PAIEMENT = 'PAIEMENT',

  // Support et service
  SUPPORT_TECHNIQUE = 'SUPPORT_TECHNIQUE',
  FORMATION = 'FORMATION',
  MAINTENANCE = 'MAINTENANCE',
  DEPANNAGE = 'DEPANNAGE',
  CONSULTATION = 'CONSULTATION',
  CONSEIL = 'CONSEIL',

  // Qualité et conformité
  AUDIT = 'AUDIT',
  CONTROLE_QUALITE = 'CONTROLE_QUALITE',
  CERTIFICATION = 'CERTIFICATION',
  EVALUATION_FOURNISSEUR = 'EVALUATION_FOURNISSEUR',
  ACTION_CORRECTIVE = 'ACTION_CORRECTIVE',
  RECLAMATION = 'RECLAMATION',

  // Événements
  SALON = 'SALON',
  CONFERENCE = 'CONFERENCE',
  SEMINAIRE = 'SEMINAIRE',
  ATELIER = 'ATELIER',
  VISITE_SITE = 'VISITE_SITE',
  VISITE_USINE = 'VISITE_USINE',

  // Administratif
  CONTRAT = 'CONTRAT',
  AVENANT = 'AVENANT',
  RENOUVELLEMENT = 'RENOUVELLEMENT',
  RESILIATION = 'RESILIATION',
  MISE_A_JOUR_DOSSIER = 'MISE_A_JOUR_DOSSIER',

  // Autres
  AUTRE = 'AUTRE',
  NOTE_INTERNE = 'NOTE_INTERNE',
}

/**
 * Statut d'une interaction
 */
export enum PartnerInteractionStatus {
  PREVUE = 'PREVUE',
  EN_COURS = 'EN_COURS',
  TERMINEE = 'TERMINEE',
  ANNULEE = 'ANNULEE',
  REPORTEE = 'REPORTEE',
  ECHEC = 'ECHEC',
}

/**
 * Priorité d'une interaction
 */
export enum PartnerInteractionPriority {
  BASSE = 'BASSE',
  NORMALE = 'NORMALE',
  HAUTE = 'HAUTE',
  URGENTE = 'URGENTE',
  CRITIQUE = 'CRITIQUE',
}

/**
 * Direction d'une interaction
 */
export enum PartnerInteractionDirection {
  ENTRANT = 'ENTRANT', // Le partenaire nous contacte
  SORTANT = 'SORTANT', // Nous contactons le partenaire
  BIDIRECTIONNEL = 'BIDIRECTIONNEL', // Échange mutuel
}

/**
 * Résultat d'une interaction
 */
export enum PartnerInteractionResult {
  // Résultats positifs
  OBJECTIF_ATTEINT = 'OBJECTIF_ATTEINT',
  ACCORD_OBTENU = 'ACCORD_OBTENU',
  COMMANDE_SIGNEE = 'COMMANDE_SIGNEE',
  PROBLEME_RESOLU = 'PROBLEME_RESOLU',
  INFORMATION_OBTENUE = 'INFORMATION_OBTENUE',
  RELATION_RENFORCEE = 'RELATION_RENFORCEE',

  // Résultats neutres
  INFORMATION_ECHANGEE = 'INFORMATION_ECHANGEE',
  SUIVI_NECESSAIRE = 'SUIVI_NECESSAIRE',
  DECISION_REPORTEE = 'DECISION_REPORTEE',
  EN_REFLEXION = 'EN_REFLEXION',

  // Résultats négatifs
  OBJECTIF_NON_ATTEINT = 'OBJECTIF_NON_ATTEINT',
  REFUS = 'REFUS',
  DESACCORD = 'DESACCORD',
  PROBLEME_NON_RESOLU = 'PROBLEME_NON_RESOLU',
  RELATION_DETERIOREE = 'RELATION_DETERIOREE',

  // Autres
  AUTRE = 'AUTRE',
  NON_DEFINI = 'NON_DEFINI',
}

/**
 * Interface pour une interaction avec un partenaire
 */
export interface IPartnerInteraction {
  /** Identifiant unique de l'interaction */
  id: string

  /** ID du partenaire concerné */
  partnerId: string

  /** Code du partenaire pour référence rapide */
  partnerCode?: string

  /** Nom du partenaire pour référence rapide */
  partnerNom?: string

  /** Type d'interaction */
  type: PartnerInteractionType

  /** Sous-type spécifique (optionnel) */
  sousType?: string

  /** Sujet/Objet de l'interaction */
  sujet: string

  /** Description détaillée */
  description?: string

  /** Direction de l'interaction */
  direction: PartnerInteractionDirection

  /** Statut de l'interaction */
  status: PartnerInteractionStatus

  /** Priorité */
  priorite: PartnerInteractionPriority

  /** Date et heure de l'interaction */
  dateInteraction: Date

  /** Durée de l'interaction (en minutes) */
  duree?: number

  /** Date de création de l'enregistrement */
  dateCreation: Date

  /** Date de dernière modification */
  dateModification?: Date

  /** ID de l'utilisateur responsable */
  utilisateurId: string

  /** Nom de l'utilisateur pour référence rapide */
  utilisateurNom?: string

  /** Participants côté entreprise */
  participantsInternes?: {
    userId: string
    nom: string
    role: string
    fonction?: string
  }[]

  /** Participants côté partenaire */
  participantsPartenaire?: {
    contactId?: string
    nom: string
    fonction?: string
    email?: string
    telephone?: string
  }[]

  /** Contact principal côté partenaire */
  contactPrincipalId?: string

  /** Nom du contact principal pour référence rapide */
  contactPrincipalNom?: string

  /** Canal de communication utilisé */
  canal?: string

  /** Lieu de l'interaction */
  lieu?: string

  /** Adresse complète du lieu */
  adresseLieu?: string

  /** Coordonnées GPS */
  coordonnees?: {
    latitude: number
    longitude: number
  }

  /** Contexte de l'interaction */
  contexte?: {
    /** ID du projet associé */
    projetId?: string

    /** ID de la commande associée */
    commandeId?: string

    /** ID de l'opportunité associée */
    opportuniteId?: string

    /** ID du contrat associé */
    contratId?: string

    /** Campagne marketing */
    campagne?: string

    /** Source de l'interaction */
    source?: string
  }

  /** Objectifs de l'interaction */
  objectifs?: string[]

  /** Résultat de l'interaction */
  resultat?: PartnerInteractionResult

  /** Commentaires sur le résultat */
  commentairesResultat?: string

  /** Actions convenues */
  actionsConvenues?: {
    action: string
    responsable: string
    dateEcheance?: Date
    statut?: 'EN_ATTENTE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE'
  }[]

  /** Prochaines étapes */
  prochaiinesEtapes?: string[]

  /** Date de prochain contact */
  prochainContact?: Date

  /** Rappels programmés */
  rappels?: {
    date: Date
    message: string
    utilisateurId: string
    envoye?: boolean
  }[]

  /** Évaluation de l'interaction */
  evaluation?: {
    /** Satisfaction (1-5) */
    satisfaction?: number

    /** Productivité (1-5) */
    productivite?: number

    /** Qualité de l'échange (1-5) */
    qualiteEchange?: number

    /** Impact business (1-5) */
    impactBusiness?: number

    /** Commentaires */
    commentaires?: string
  }

  /** Informations techniques */
  technique?: {
    /** Support technique fourni */
    supportFourni?: boolean

    /** Problèmes identifiés */
    problemesIdentifies?: string[]

    /** Solutions proposées */
    solutionsProposees?: string[]

    /** Documentation fournie */
    documentationFournie?: string[]

    /** Formation dispensée */
    formation?: {
      sujet: string
      duree: number
      participants: number
      supports?: string[]
    }
  }

  /** Informations commerciales */
  commercial?: {
    /** Opportunité identifiée */
    opportuniteIdentifiee?: boolean

    /** Montant potentiel */
    montantPotentiel?: number

    /** Probabilité de succès (%) */
    probabiliteSucces?: number

    /** Délai estimé */
    delaiEstime?: number

    /** Concurrents identifiés */
    concurrents?: string[]

    /** Facteurs de décision */
    facteursDecision?: string[]

    /** Budget client */
    budgetClient?: number

    /** Délai de décision */
    delaiDecision?: Date
  }

  /** Documents et pièces jointes */
  documents?: {
    /** Nom du fichier */
    nom: string

    /** Type de fichier */
    type: string

    /** URL du fichier */
    url: string

    /** Taille du fichier */
    taille?: number

    /** Description */
    description?: string

    /** Date d'ajout */
    dateAjout: Date
  }[]

  /** Coûts associés */
  couts?: {
    /** Coût de déplacement */
    deplacement?: number

    /** Coût de communication */
    communication?: number

    /** Coût de représentation */
    representation?: number

    /** Autres coûts */
    autres?: number

    /** Coût total */
    total?: number

    /** Devise */
    devise?: string
  }

  /** Métriques de suivi */
  metriques?: {
    /** Temps de préparation (minutes) */
    tempsPreparation?: number

    /** Temps effectif (minutes) */
    tempsEffectif?: number

    /** Temps de suivi (minutes) */
    tempsSuivi?: number

    /** Nombre de participants */
    nombreParticipants?: number

    /** Taux de présence (%) */
    tauxPresence?: number
  }

  /** Tags et catégorisation */
  tags?: string[]

  /** Notes privées (visibles seulement par le créateur) */
  notesPrivees?: string

  /** Notes publiques (visibles par l'équipe) */
  notesPubliques?: string

  /** Interaction liée (pour les suivis) */
  interactionParenteId?: string

  /** Interactions enfants (suivis de cette interaction) */
  interactionsEnfants?: string[]

  /** Métadonnées additionnelles */
  metadonnees?: Record<string, unknown>

  /** Historique des modifications */
  historiqueModifications?: {
    date: Date
    utilisateurId: string
    utilisateurNom: string
    champ: string
    ancienneValeur: unknown
    nouvelleValeur: unknown
    commentaire?: string
  }[]

  /** Confidentialité */
  confidentialite?: {
    /** Niveau de confidentialité */
    niveau: 'PUBLIC' | 'INTERNE' | 'CONFIDENTIEL' | 'SECRET'

    /** Utilisateurs autorisés */
    utilisateursAutorises?: string[]

    /** Groupes autorisés */
    groupesAutorises?: string[]

    /** Date d'expiration de la confidentialité */
    dateExpiration?: Date
  }
}

/**
 * Interface pour les filtres de recherche d'interactions
 */
export interface IPartnerInteractionFilters {
  /** Filtrer par partenaire */
  partnerIds?: string[]

  /** Filtrer par codes partenaire */
  partnerCodes?: string[]

  /** Filtrer par types d'interaction */
  types?: PartnerInteractionType[]

  /** Filtrer par sous-types */
  sousTypes?: string[]

  /** Filtrer par statut */
  status?: PartnerInteractionStatus[]

  /** Filtrer par priorité */
  priorites?: PartnerInteractionPriority[]

  /** Filtrer par direction */
  directions?: PartnerInteractionDirection[]

  /** Filtrer par résultat */
  resultats?: PartnerInteractionResult[]

  /** Filtrer par période */
  dateDebut?: Date
  dateFin?: Date

  /** Filtrer par utilisateur */
  utilisateurIds?: string[]

  /** Filtrer par contact partenaire */
  contactIds?: string[]

  /** Filtrer par canal */
  canaux?: string[]

  /** Filtrer par lieu */
  lieux?: string[]

  /** Filtrer par projet */
  projetIds?: string[]

  /** Filtrer par commande */
  commandeIds?: string[]

  /** Filtrer par tags */
  tags?: string[]

  /** Recherche textuelle */
  recherche?: string

  /** Durée minimum */
  dureeMin?: number

  /** Durée maximum */
  dureeMax?: number

  /** Satisfaction minimum */
  satisfactionMin?: number

  /** Satisfaction maximum */
  satisfactionMax?: number

  /** Avec actions en cours */
  avecActionsEnCours?: boolean

  /** Avec prochaines étapes */
  avecProchainesEtapes?: boolean
}

/**
 * Interface pour la création d'une interaction
 */
export interface ICreatePartnerInteraction {
  /** ID du partenaire */
  partnerId: string

  /** Type d'interaction */
  type: PartnerInteractionType

  /** Sous-type (optionnel) */
  sousType?: string

  /** Sujet */
  sujet: string

  /** Description */
  description?: string

  /** Direction */
  direction: PartnerInteractionDirection

  /** Priorité (par défaut NORMALE) */
  priorite?: PartnerInteractionPriority

  /** Date de l'interaction */
  dateInteraction: Date

  /** Durée estimée ou réelle */
  duree?: number

  /** Contact principal */
  contactPrincipalId?: string

  /** Participants internes */
  participantsInternes?: {
    userId: string
    role: string
    fonction?: string
  }[]

  /** Participants partenaire */
  participantsPartenaire?: {
    contactId?: string
    nom: string
    fonction?: string
    email?: string
    telephone?: string
  }[]

  /** Canal de communication */
  canal?: string

  /** Lieu */
  lieu?: string

  /** Contexte */
  contexte?: {
    projetId?: string
    commandeId?: string
    opportuniteId?: string
    contratId?: string
    campagne?: string
    source?: string
  }

  /** Objectifs */
  objectifs?: string[]

  /** Tags */
  tags?: string[]

  /** Notes */
  notesPubliques?: string

  /** Métadonnées */
  metadonnees?: Record<string, unknown>
}

/**
 * Interface pour la mise à jour d'une interaction
 */
export interface IUpdatePartnerInteraction {
  /** Statut */
  status?: PartnerInteractionStatus

  /** Durée réelle */
  duree?: number

  /** Résultat */
  resultat?: PartnerInteractionResult

  /** Commentaires résultat */
  commentairesResultat?: string

  /** Actions convenues */
  actionsConvenues?: {
    action: string
    responsable: string
    dateEcheance?: Date
    statut?: string
  }[]

  /** Prochaines étapes */
  prochaiinesEtapes?: string[]

  /** Prochain contact */
  prochainContact?: Date

  /** Évaluation */
  evaluation?: {
    satisfaction?: number
    productivite?: number
    qualiteEchange?: number
    impactBusiness?: number
    commentaires?: string
  }

  /** Informations techniques */
  technique?: {
    supportFourni?: boolean
    problemesIdentifies?: string[]
    solutionsProposees?: string[]
    documentationFournie?: string[]
  }

  /** Informations commerciales */
  commercial?: {
    opportuniteIdentifiee?: boolean
    montantPotentiel?: number
    probabiliteSucces?: number
    delaiEstime?: number
    concurrents?: string[]
  }

  /** Coûts */
  couts?: {
    deplacement?: number
    communication?: number
    representation?: number
    autres?: number
    devise?: string
  }

  /** Notes */
  notesPubliques?: string
  notesPrivees?: string

  /** Tags */
  tags?: string[]

  /** Métadonnées */
  metadonnees?: Record<string, unknown>
}
