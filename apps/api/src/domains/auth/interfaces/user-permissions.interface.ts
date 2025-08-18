/**
 * Types de permissions système
 */
export enum PermissionType {
  // Permissions de lecture
  READ = 'READ',
  VIEW = 'VIEW',
  LIST = 'LIST',
  SEARCH = 'SEARCH',
  EXPORT = 'EXPORT',
  PRINT = 'PRINT',

  // Permissions de modification
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  MODIFY = 'MODIFY',
  EDIT = 'EDIT',

  // Permissions avancées
  MANAGE = 'MANAGE',
  ADMIN = 'ADMIN',
  CONFIGURE = 'CONFIGURE',
  APPROVE = 'APPROVE',
  VALIDATE = 'VALIDATE',
  PUBLISH = 'PUBLISH',

  // Permissions spéciales
  EXECUTE = 'EXECUTE',
  IMPORT = 'IMPORT',
  BACKUP = 'BACKUP',
  RESTORE = 'RESTORE',
  AUDIT = 'AUDIT',
}

/**
 * Contexte d'application d'une permission
 */
export enum PermissionContext {
  GLOBAL = 'GLOBAL', // Permission globale
  TENANT = 'TENANT', // Limitée au tenant
  SITE = 'SITE', // Limitée au site
  DEPARTMENT = 'DEPARTMENT', // Limitée au département
  PROJECT = 'PROJECT', // Limitée au projet
  RESOURCE = 'RESOURCE', // Limitée à une ressource spécifique
  OWNED = 'OWNED', // Limitée aux ressources possédées
}

/**
 * Niveaux de permission
 */
export enum PermissionLevel {
  NONE = 'NONE', // Aucune permission
  READ_ONLY = 'READ_ONLY', // Lecture seule
  READ_WRITE = 'READ_WRITE', // Lecture et écriture
  FULL_ACCESS = 'FULL_ACCESS', // Accès complet
  ADMIN = 'ADMIN', // Administration
  SUPER_ADMIN = 'SUPER_ADMIN', // Super administration
}

/**
 * Statut d'une permission
 */
export enum PermissionStatus {
  ACTIVE = 'ACTIVE', // Permission active
  INACTIVE = 'INACTIVE', // Permission inactive
  SUSPENDED = 'SUSPENDED', // Permission suspendue
  REVOKED = 'REVOKED', // Permission révoquée
  EXPIRED = 'EXPIRED', // Permission expirée
}

/**
 * Interface pour une permission utilisateur
 */
export interface IUserPermission {
  /** Identifiant unique de la permission */
  id: string

  /** ID de l'utilisateur */
  userId: string

  /** Email de l'utilisateur pour référence */
  userEmail?: string

  /** Nom de l'utilisateur pour référence */
  userName?: string

  /** Ressource concernée par la permission */
  resource: string

  /** Action permise sur la ressource */
  action: PermissionType

  /** Contexte d'application */
  context: PermissionContext

  /** Niveau de permission */
  level: PermissionLevel

  /** Statut de la permission */
  status: PermissionStatus

  /** Permission accordée (true) ou refusée (false) */
  granted: boolean

  /** Conditions d'application de la permission */
  conditions?: {
    /** Contraintes temporelles */
    contraintes?: {
      /** Date de début de validité */
      dateDebut?: Date

      /** Date de fin de validité */
      dateFin?: Date

      /** Jours de la semaine autorisés (0-6, 0=dimanche) */
      joursAutorises?: number[]

      /** Heures autorisées (format HH:MM-HH:MM) */
      heuresAutorisees?: string[]

      /** Fuseaux horaires */
      fuseauxHoraires?: string[]
    }

    /** Contraintes géographiques */
    geographiques?: {
      /** Pays autorisés */
      paysAutorises?: string[]

      /** Régions autorisées */
      regionsAutorisees?: string[]

      /** Adresses IP autorisées (CIDR) */
      adressesIPAutorisees?: string[]

      /** Géofencing (coordonnées et rayon) */
      geofencing?: {
        latitude: number
        longitude: number
        rayon: number // en mètres
      }[]
    }

    /** Contraintes techniques */
    techniques?: {
      /** User-agents autorisés */
      userAgentsAutorises?: string[]

      /** Plateformes autorisées */
      plateformesAutorisees?: string[]

      /** Versions d'application minimum */
      versionMinimum?: string

      /** MFA requis pour cette permission */
      mfaRequis?: boolean

      /** Niveau de sécurité minimum requis */
      niveauSecuriteMinimum?: number
    }

    /** Contraintes métier */
    metier?: {
      /** Département requis */
      departementRequis?: string[]

      /** Rôle minimum requis */
      roleMinimumRequis?: string

      /** Ancienneté minimum (mois) */
      ancienneteMinimum?: number

      /** Certifications requises */
      certificationsRequises?: string[]

      /** Formations requises */
      formationsRequises?: string[]
    }

    /** Contraintes sur les données */
    donnees?: {
      /** Types de données autorisés */
      typesDonneesAutorises?: string[]

      /** Classification de sensibilité maximum */
      sensibiliteMaximum?: string

      /** Taille maximum des données (octets) */
      tailleMaximum?: number

      /** Champs interdits */
      champsInterdits?: string[]
    }
  }

  /** Restrictions spécifiques */
  restrictions?: {
    /** Nombre maximum d'utilisations par jour */
    maxUtilisationsJour?: number

    /** Nombre maximum d'utilisations par heure */
    maxUtilisationsHeure?: number

    /** Délai minimum entre utilisations (minutes) */
    delaiMinimumUtilisations?: number

    /** Ressources spécifiques autorisées */
    ressourcesAutorisees?: string[]

    /** Ressources spécifiques interdites */
    ressourcesInterdites?: string[]

    /** Attributs spécifiques accessibles */
    attributsAccessibles?: string[]

    /** Filtres de données obligatoires */
    filtresObligatoires?: Record<string, unknown>
  }

  /** Source de la permission */
  source: {
    /** Type de source */
    type: 'DIRECT' | 'ROLE' | 'GROUP' | 'INHERITED' | 'DELEGATED'

    /** ID de la source (role, group, etc.) */
    sourceId?: string

    /** Nom de la source */
    sourceName?: string

    /** Hiérarchie des sources (pour l'héritage) */
    hierarchie?: string[]
  }

  /** Informations de délégation */
  delegation?: {
    /** Permission déléguée par un autre utilisateur */
    delegueepar?: string

    /** Nom du délégateur */
    nomDelegateur?: string

    /** Date de délégation */
    dateDelegation?: Date

    /** Date d'expiration de la délégation */
    dateExpirationDelegation?: Date

    /** Peut être sous-déléguée */
    sousDelegable?: boolean

    /** Commentaire de délégation */
    commentaireDelegation?: string
  }

  /** Métadonnées d'audit */
  audit: {
    /** Date de création */
    dateCreation: Date

    /** Créée par */
    creeePar: string

    /** Nom du créateur */
    nomCreateur?: string

    /** Date de dernière modification */
    dateModification?: Date

    /** Modifiée par */
    modifieePar?: string

    /** Nom du modificateur */
    nomModificateur?: string

    /** Date de dernière utilisation */
    dateDerniereUtilisation?: Date

    /** Nombre d'utilisations */
    nombreUtilisations: number

    /** Historique des modifications */
    historiqueModifications?: {
      date: Date
      utilisateur: string
      action: string
      ancienneValeur?: unknown
      nouvelleValeur?: unknown
      commentaire?: string
    }[]
  }

  /** Informations de révision */
  revision?: {
    /** Date de dernière révision */
    dateDerniereRevision?: Date

    /** Révisée par */
    reviseurId?: string

    /** Nom du réviseur */
    nomReviseur?: string

    /** Prochaine révision prévue */
    prochaineRevisionPrevue?: Date

    /** Fréquence de révision (mois) */
    frequenceRevision?: number

    /** Commentaire de révision */
    commentaireRevision?: string

    /** Statut de révision */
    statutRevision?: 'A_REVOIR' | 'REVISE' | 'APPROUVE' | 'REFUSE'
  }

  /** Justification métier */
  justification: {
    /** Raison de l'attribution */
    raison: string

    /** Justification détaillée */
    justificationDetaillee?: string

    /** Référence au processus d'approbation */
    referenceApprobation?: string

    /** Durée prévue de la permission */
    dureePrevue?: number

    /** Renouvellement automatique */
    renouvellementAutomatique?: boolean
  }

  /** Alertes et notifications */
  alertes?: {
    /** Alerter avant expiration (jours) */
    alerteAvantExpiration?: number

    /** Alerter en cas d'usage inhabituel */
    alerteUsageInhabituel?: boolean

    /** Alerter en cas de tentative d'accès refusée */
    alerteAccesRefuse?: boolean

    /** Destinataires des alertes */
    destinatairesAlertes?: string[]
  }

  /** Commentaires et notes */
  commentaires?: string

  /** Tags pour catégorisation */
  tags?: string[]

  /** Métadonnées personnalisées */
  metadonnees?: Record<string, unknown>
}

/**
 * Interface pour les permissions consolidées d'un utilisateur
 */
export interface IUserPermissions {
  /** ID de l'utilisateur */
  userId: string

  /** Email de l'utilisateur */
  userEmail: string

  /** Nom de l'utilisateur */
  userName: string

  /** Date de dernière mise à jour des permissions */
  derniereMAJ: Date

  /** Permissions directes */
  permissionsDirectes: IUserPermission[]

  /** Permissions héritées des rôles */
  permissionsRoles: {
    /** ID du rôle */
    roleId: string

    /** Nom du rôle */
    roleNom: string

    /** Permissions du rôle */
    permissions: IUserPermission[]
  }[]

  /** Permissions héritées des groupes */
  permissionsGroupes: {
    /** ID du groupe */
    groupeId: string

    /** Nom du groupe */
    groupeNom: string

    /** Permissions du groupe */
    permissions: IUserPermission[]
  }[]

  /** Permissions déléguées reçues */
  permissionsDeguees: {
    /** ID du délégateur */
    delegateurId: string

    /** Nom du délégateur */
    delegateurNom: string

    /** Permissions déléguées */
    permissions: IUserPermission[]

    /** Date d'expiration de la délégation */
    dateExpiration?: Date
  }[]

  /** Permissions déléguées accordées */
  permissionsAccordees: {
    /** ID du bénéficiaire */
    beneficiaireId: string

    /** Nom du bénéficiaire */
    beneficiaireNom: string

    /** Permissions accordées */
    permissions: IUserPermission[]

    /** Date d'expiration */
    dateExpiration?: Date
  }[]

  /** Résumé des permissions effectives */
  permissionsEffectives: {
    /** Ressource */
    resource: string

    /** Actions autorisées */
    actionsAutorisees: PermissionType[]

    /** Niveau maximum */
    niveauMaximum: PermissionLevel

    /** Contexte d'application */
    contexte: PermissionContext

    /** Restrictions applicables */
    restrictions?: {
      temporelles?: boolean
      geographiques?: boolean
      techniques?: boolean
      metier?: boolean
    }

    /** Source de la permission la plus élevée */
    sourcePrincipale: {
      type: string
      nom: string
      id?: string
    }
  }[]

  /** Permissions en attente d'approbation */
  permissionsEnAttente?: {
    /** Demande de permission */
    demande: {
      resource: string
      action: PermissionType
      justification: string
      datedemande: Date
    }

    /** Approbateur désigné */
    approbateur: {
      userId: string
      nom: string
    }

    /** Statut de la demande */
    statut: 'EN_ATTENTE' | 'APPROUVE' | 'REFUSE'
  }[]

  /** Violations et tentatives d'accès refusées */
  violations?: {
    /** Date de la tentative */
    date: Date

    /** Ressource tentée */
    resource: string

    /** Action tentée */
    action: PermissionType

    /** Raison du refus */
    raisonRefus: string

    /** Adresse IP */
    adresseIP: string
  }[]

  /** Statistiques d'usage */
  statistiques: {
    /** Nombre total de permissions */
    nombreTotalPermissions: number

    /** Permissions actives */
    permissionsActives: number

    /** Permissions expirées */
    permissionsExpirees: number

    /** Dernière activité */
    derniereActivite?: Date

    /** Usage par ressource (top 10) */
    usageParRessource: {
      resource: string
      nombreUtilisations: number
      derniereUtilisation: Date
    }[]
  }
}

/**
 * Interface pour la demande de permission
 */
export interface IPermissionRequest {
  /** ID de la demande */
  id: string

  /** ID de l'utilisateur demandeur */
  demandeurId: string

  /** Nom du demandeur */
  demandeurNom: string

  /** Ressource demandée */
  resource: string

  /** Action demandée */
  action: PermissionType

  /** Niveau demandé */
  niveau: PermissionLevel

  /** Contexte demandé */
  contexte: PermissionContext

  /** Justification de la demande */
  justification: string

  /** Justification détaillée */
  justificationDetaillee?: string

  /** Urgence de la demande */
  urgence: 'NORMALE' | 'HAUTE' | 'CRITIQUE'

  /** Durée demandée (mois) */
  dureeDemandee?: number

  /** Date limite souhaitée */
  dateLimiteSouhaitee?: Date

  /** Approbateur suggéré */
  approbateurSuggere?: string

  /** Statut de la demande */
  statut: 'EN_ATTENTE' | 'EN_REVISION' | 'APPROUVE' | 'REFUSE' | 'EXPIRE'

  /** Date de création de la demande */
  dateCreation: Date

  /** Date de traitement */
  dateTraitement?: Date

  /** Traitée par */
  traiteePar?: string

  /** Nom du traitant */
  nomTraitant?: string

  /** Commentaire du traitement */
  commentaireTraitement?: string

  /** Workflow d'approbation */
  workflowApprobation?: {
    /** Étape actuelle */
    etapeActuelle: number

    /** Étapes définies */
    etapes: {
      numero: number
      nom: string
      approbateurId: string
      approbateurNom: string
      statut: 'EN_ATTENTE' | 'APPROUVE' | 'REFUSE'
      dateTraitement?: Date
      commentaire?: string
    }[]
  }

  /** Conditions spéciales demandées */
  conditionsSpeciales?: {
    temporelles?: boolean
    geographiques?: boolean
    techniques?: boolean
  }
}

/**
 * Interface pour les filtres de recherche de permissions
 */
export interface IUserPermissionFilters {
  /** Filtrer par utilisateur */
  userIds?: string[]

  /** Filtrer par ressource */
  resources?: string[]

  /** Filtrer par action */
  actions?: PermissionType[]

  /** Filtrer par contexte */
  contexts?: PermissionContext[]

  /** Filtrer par niveau */
  levels?: PermissionLevel[]

  /** Filtrer par statut */
  status?: PermissionStatus[]

  /** Filtrer par source */
  sources?: ('DIRECT' | 'ROLE' | 'GROUP' | 'INHERITED' | 'DELEGATED')[]

  /** Filtrer par permissions accordées/refusées */
  granted?: boolean

  /** Filtrer par permissions expirées */
  expired?: boolean

  /** Filtrer par permissions nécessitant révision */
  needsRevision?: boolean

  /** Filtrer par période de création */
  dateCreationDebut?: Date
  dateCreationFin?: Date

  /** Filtrer par dernière utilisation */
  dernierUtilisationDebut?: Date
  dernierUtilisationFin?: Date

  /** Recherche textuelle */
  recherche?: string

  /** Tags */
  tags?: string[]
}

/**
 * Interface pour les statistiques de permissions
 */
export interface IPermissionStatistics {
  /** Statistiques globales */
  global: {
    /** Nombre total d'utilisateurs avec permissions */
    nombreUtilisateurs: number

    /** Nombre total de permissions */
    nombreTotalPermissions: number

    /** Permissions actives */
    permissionsActives: number

    /** Permissions expirées */
    permissionsExpirees: number

    /** Ressources les plus utilisées */
    ressourcesPopulaires: {
      resource: string
      nombrePermissions: number
      nombreUtilisateurs: number
    }[]
  }

  /** Répartition par type */
  parType: {
    type: PermissionType
    nombre: number
    pourcentage: number
  }[]

  /** Répartition par niveau */
  parNiveau: {
    niveau: PermissionLevel
    nombre: number
    pourcentage: number
  }[]

  /** Répartition par contexte */
  parContexte: {
    contexte: PermissionContext
    nombre: number
    pourcentage: number
  }[]

  /** Tendances temporelles */
  tendances: {
    /** Créations de permissions par mois */
    creationsParMois: {
      mois: string
      nombre: number
    }[]

    /** Utilisations par jour (30 derniers jours) */
    utilisationsParJour: {
      date: Date
      nombre: number
    }[]
  }

  /** Alertes de sécurité */
  alertes: {
    /** Permissions à réviser */
    permissionsARevoir: number

    /** Permissions expirées non renouvelées */
    permissionsExpirees: number

    /** Utilisateurs avec trop de permissions */
    utilisateursSurPrivilegies: number

    /** Violations récentes */
    violationsRecentes: number
  }
}
