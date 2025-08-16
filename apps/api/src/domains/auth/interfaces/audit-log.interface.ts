/**
 * Types d'événements d'audit
 */
export enum AuditEventType {
  // Authentification
  LOGIN = 'LOGIN',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  MFA_SETUP = 'MFA_SETUP',
  MFA_VERIFICATION = 'MFA_VERIFICATION',
  MFA_FAILED = 'MFA_FAILED',

  // Autorisation
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  PERMISSION_REVOKED = 'PERMISSION_REVOKED',
  ROLE_ASSIGNED = 'ROLE_ASSIGNED',
  ROLE_REMOVED = 'ROLE_REMOVED',

  // Gestion des utilisateurs
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ACTIVATED = 'USER_ACTIVATED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  USER_LOCKED = 'USER_LOCKED',
  USER_UNLOCKED = 'USER_UNLOCKED',

  // Gestion des données
  DATA_CREATE = 'DATA_CREATE',
  DATA_READ = 'DATA_READ',
  DATA_UPDATE = 'DATA_UPDATE',
  DATA_DELETE = 'DATA_DELETE',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT',
  DATA_BACKUP = 'DATA_BACKUP',
  DATA_RESTORE = 'DATA_RESTORE',

  // Configuration système
  SYSTEM_CONFIG_CHANGE = 'SYSTEM_CONFIG_CHANGE',
  SECURITY_CONFIG_CHANGE = 'SECURITY_CONFIG_CHANGE',
  INTEGRATION_CONFIG_CHANGE = 'INTEGRATION_CONFIG_CHANGE',

  // Activités métier
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_MODIFIED = 'ORDER_MODIFIED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  INVOICE_GENERATED = 'INVOICE_GENERATED',
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',

  // Sécurité
  SECURITY_ALERT = 'SECURITY_ALERT',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  POLICY_VIOLATION = 'POLICY_VIOLATION',
  INTRUSION_ATTEMPT = 'INTRUSION_ATTEMPT',

  // Autres
  API_ACCESS = 'API_ACCESS',
  FILE_ACCESS = 'FILE_ACCESS',
  REPORT_GENERATED = 'REPORT_GENERATED',
  EMAIL_SENT = 'EMAIL_SENT',
  NOTIFICATION_SENT = 'NOTIFICATION_SENT',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  CUSTOM_EVENT = 'CUSTOM_EVENT',
}

/**
 * Niveaux de sévérité
 */
export enum AuditSeverity {
  INFO = 'INFO',              // Information
  LOW = 'LOW',                // Faible importance
  MEDIUM = 'MEDIUM',          // Importance moyenne
  HIGH = 'HIGH',              // Haute importance
  CRITICAL = 'CRITICAL',      // Critique
  EMERGENCY = 'EMERGENCY',    // Urgence
}

/**
 * Statut de l'événement
 */
export enum AuditEventStatus {
  SUCCESS = 'SUCCESS',        // Succès
  FAILURE = 'FAILURE',        // Échec
  WARNING = 'WARNING',        // Avertissement
  ERROR = 'ERROR',            // Erreur
  PENDING = 'PENDING',        // En attente
}

/**
 * Catégories d'audit
 */
export enum AuditCategory {
  SECURITY = 'SECURITY',              // Sécurité
  AUTHENTICATION = 'AUTHENTICATION', // Authentification
  AUTHORIZATION = 'AUTHORIZATION',    // Autorisation
  USER_MANAGEMENT = 'USER_MANAGEMENT', // Gestion utilisateurs
  DATA_ACCESS = 'DATA_ACCESS',        // Accès aux données
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',      // Administration système
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',  // Logique métier
  INTEGRATION = 'INTEGRATION',        // Intégration
  COMPLIANCE = 'COMPLIANCE',          // Conformité
  PERFORMANCE = 'PERFORMANCE',        // Performance
  OTHER = 'OTHER',                    // Autre
}

/**
 * Interface principale pour un log d'audit
 */
export interface IAuditLog {
  /** Identifiant unique du log */
  id: string

  /** Timestamp de l'événement */
  timestamp: Date

  /** Type d'événement */
  eventType: AuditEventType

  /** Catégorie */
  category: AuditCategory

  /** Niveau de sévérité */
  severity: AuditSeverity

  /** Statut de l'événement */
  status: AuditEventStatus

  /** Message descriptif */
  message: string

  /** Description détaillée */
  description?: string

  /** Informations sur l'utilisateur */
  user: {
    /** ID de l'utilisateur */
    id: string

    /** Email */
    email: string

    /** Nom complet */
    nom?: string

    /** Nom d'utilisateur */
    username?: string

    /** Rôles au moment de l'événement */
    roles?: string[]

    /** Groupe d'appartenance */
    groupes?: string[]

    /** ID de session */
    sessionId?: string
  }

  /** Informations sur l'acteur (si différent de l'utilisateur) */
  actor?: {
    /** Type d'acteur */
    type: 'USER' | 'SYSTEM' | 'API' | 'SERVICE' | 'SCHEDULER' | 'WEBHOOK'

    /** ID de l'acteur */
    id?: string

    /** Nom de l'acteur */
    nom?: string

    /** Service ou système source */
    service?: string

    /** Version de l'application */
    version?: string
  }

  /** Informations sur la cible de l'événement */
  target?: {
    /** Type de ressource ciblée */
    type: string

    /** ID de la ressource */
    id?: string

    /** Nom de la ressource */
    nom?: string

    /** Chemin de la ressource */
    chemin?: string

    /** Attributs de la ressource */
    attributs?: Record<string, unknown>
  }

  /** Informations sur la source/origine */
  source: {
    /** Adresse IP */
    ip: string

    /** User-Agent */
    userAgent?: string

    /** Nom d'hôte */
    hostname?: string

    /** Géolocalisation */
    geolocation?: {
      pays: string
      region?: string
      ville?: string
      latitude?: number
      longitude?: number
    }

    /** Application source */
    application?: {
      nom: string
      version?: string
      module?: string
    }

    /** API endpoint (si applicable) */
    endpoint?: {
      methode: string
      url: string
      version?: string
    }
  }

  /** Contexte technique */
  context: {
    /** ID de corrélation pour tracer les requêtes liées */
    correlationId?: string

    /** ID de trace distribué */
    traceId?: string

    /** ID du tenant */
    tenantId?: string

    /** ID du site */
    siteId?: string

    /** Environnement */
    environnement?: 'DEV' | 'TEST' | 'STAGING' | 'PROD'

    /** Données contextuelles additionnelles */
    additionalData?: Record<string, unknown>
  }

  /** Détails de l'opération */
  operation?: {
    /** Nom de l'opération */
    nom: string

    /** Méthode ou fonction appelée */
    methode?: string

    /** Paramètres d'entrée (sensibles filtrés) */
    parametres?: Record<string, unknown>

    /** Résultat de l'opération */
    resultat?: {
      statut: 'SUCCESS' | 'FAILURE' | 'PARTIAL'
      code?: string
      message?: string
      donnees?: Record<string, unknown>
    }

    /** Durée d'exécution (ms) */
    dureeExecution?: number

    /** Ressources consommées */
    ressources?: {
      cpu?: number
      memoire?: number
      io?: number
    }
  }

  /** Modifications apportées aux données */
  modifications?: {
    /** Type de modification */
    type: 'CREATE' | 'UPDATE' | 'DELETE' | 'MERGE'

    /** Nombre d'enregistrements affectés */
    nombreEnregistrements?: number

    /** Champs modifiés */
    champsModifies?: string[]

    /** Valeurs avant modification (pour UPDATE) */
    valeursAvant?: Record<string, unknown>

    /** Valeurs après modification */
    valeursApres?: Record<string, unknown>

    /** Diff structuré des changements */
    diff?: {
      champ: string
      ancienneValeur: unknown
      nouvelleValeur: unknown
      typeModification: 'ADDED' | 'MODIFIED' | 'REMOVED'
    }[]
  }

  /** Informations de sécurité */
  securite?: {
    /** Niveau de risque détecté */
    niveauRisque?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

    /** Indicateurs de menace */
    indicateursMenace?: string[]

    /** Score de confiance */
    scoreConfiance?: number

    /** Règles de sécurité déclenchées */
    reglesSecurite?: string[]

    /** Actions de sécurité prises */
    actionsSecurite?: string[]
  }

  /** Conformité et gouvernance */
  conformite?: {
    /** Réglementations applicables */
    reglementations?: ('GDPR' | 'SOX' | 'HIPAA' | 'PCI_DSS' | 'ISO27001')[]

    /** Classification des données */
    classificationDonnees?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'SECRET'

    /** Période de rétention requise (mois) */
    periodeRetention?: number

    /** Marqueurs de conformité */
    marqueurs?: string[]
  }

  /** Intégration avec systèmes externes */
  integration?: {
    /** Système externe impliqué */
    systemeExterne?: string

    /** ID de transaction externe */
    transactionId?: string

    /** Statut de synchronisation */
    statutSynchronisation?: 'SYNCED' | 'PENDING' | 'FAILED'

    /** Erreurs d'intégration */
    erreursIntegration?: {
      code: string
      message: string
      details?: Record<string, unknown>
    }[]
  }

  /** Métadonnées du log */
  metadata: {
    /** Version du schéma d'audit */
    schemaVersion: string

    /** Checksoma du log pour intégrité */
    checksum?: string

    /** Signature numérique */
    signature?: string

    /** Horodatage de création du log */
    timestampCreation: Date

    /** Taille du log (octets) */
    taille?: number

    /** Serveur qui a généré le log */
    serveurOrigine?: string

    /** Process ID */
    processId?: string

    /** Thread ID */
    threadId?: string
  }

  /** Tags pour catégorisation et recherche */
  tags?: string[]

  /** Liens vers d'autres logs ou événements */
  liens?: {
    /** Type de lien */
    type: 'PARENT' | 'CHILD' | 'RELATED' | 'CAUSE' | 'EFFECT'

    /** ID du log lié */
    logId: string

    /** Description du lien */
    description?: string
  }[]

  /** Indicateurs pour le monitoring */
  monitoring?: {
    /** Alerte générée */
    alerteGeneree?: boolean

    /** Niveau d'alerte */
    niveauAlerte?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'

    /** Tableaux de bord concernés */
    dashboards?: string[]

    /** Métriques à mettre à jour */
    metriques?: string[]
  }

  /** Archivage et rétention */
  archivage?: {
    /** Peut être archivé */
    archivable?: boolean

    /** Date d'archivage prévue */
    dateArchivagePrevue?: Date

    /** Date de suppression prévue */
    dateSuppressionPrevue?: Date

    /** Critères de rétention */
    criteresRetention?: string[]

    /** Statut d'archivage */
    statutArchivage?: 'ACTIVE' | 'ARCHIVED' | 'DELETED'
  }
}

/**
 * Interface pour les filtres de recherche des logs d'audit
 */
export interface IAuditLogFilters {
  /** Filtrer par période */
  dateDebut?: Date
  dateFin?: Date

  /** Filtrer par types d'événements */
  eventTypes?: AuditEventType[]

  /** Filtrer par catégories */
  categories?: AuditCategory[]

  /** Filtrer par niveaux de sévérité */
  severities?: AuditSeverity[]

  /** Filtrer par statuts */
  status?: AuditEventStatus[]

  /** Filtrer par utilisateurs */
  userIds?: string[]
  userEmails?: string[]

  /** Filtrer par acteurs */
  actorTypes?: string[]
  actorIds?: string[]

  /** Filtrer par cibles */
  targetTypes?: string[]
  targetIds?: string[]

  /** Filtrer par adresses IP */
  sourceIps?: string[]

  /** Filtrer par applications */
  applications?: string[]

  /** Filtrer par tenant */
  tenantIds?: string[]

  /** Filtrer par site */
  siteIds?: string[]

  /** Filtrer par niveau de risque */
  niveauxRisque?: string[]

  /** Filtrer par conformité */
  reglementations?: string[]

  /** Filtrer par tags */
  tags?: string[]

  /** Recherche textuelle */
  recherche?: string

  /** Filtrer par corrélation */
  correlationIds?: string[]

  /** Filtrer par opération */
  operations?: string[]

  /** Exclure les événements système */
  excludeSystemEvents?: boolean

  /** Inclure seulement les alertes */
  alertesUniquement?: boolean
}

/**
 * Interface pour les options de tri des logs d'audit
 */
export interface IAuditLogSortOptions {
  /** Champ de tri */
  champ: 'timestamp' | 'eventType' | 'severity' | 'userId' | 'sourceIp' | 'status'

  /** Direction du tri */
  direction: 'ASC' | 'DESC'
}

/**
 * Interface pour les statistiques d'audit
 */
export interface IAuditStatistics {
  /** Statistiques générales */
  global: {
    /** Nombre total d'événements */
    totalEvenements: number

    /** Événements par période */
    evenementsAujourdhui: number
    evenementsSemaine: number
    evenementsMois: number

    /** Répartition par statut */
    repartitionStatuts: {
      statut: AuditEventStatus
      nombre: number
      pourcentage: number
    }[]

    /** Top utilisateurs par activité */
    topUtilisateurs: {
      userId: string
      nom: string
      nombreEvenements: number
    }[]
  }

  /** Statistiques par catégorie */
  parCategorie: {
    categorie: AuditCategory
    nombre: number
    pourcentage: number
    tendance: 'HAUSSE' | 'BAISSE' | 'STABLE'
  }[]

  /** Statistiques par type d'événement */
  parTypeEvenement: {
    type: AuditEventType
    nombre: number
    tauxSucces: number
    dernierEvenement: Date
  }[]

  /** Analyse de sécurité */
  securite: {
    /** Événements de sécurité */
    evenementsSecurite: number

    /** Tentatives d'intrusion */
    tentativesIntrusion: number

    /** Violations de politiques */
    violationsPolitiques: number

    /** Alertes critiques */
    alertesCritiques: number

    /** Top adresses IP suspectes */
    ipsSuspectes: {
      ip: string
      nombreTentatives: number
      derniereTentative: Date
      typesMenaces: string[]
    }[]
  }

  /** Tendances temporelles */
  tendances: {
    /** Évolution par jour (30 derniers jours) */
    evolutionJournaliere: {
      date: Date
      nombreEvenements: number
      nombreAlertes: number
    }[]

    /** Répartition par heure */
    repartitionHoraire: {
      heure: number
      nombreEvenements: number
    }[]

    /** Pic d'activité détecté */
    picActivite?: {
      date: Date
      heureDebut: number
      heureFin: number
      nombreEvenements: number
    }
  }

  /** Conformité et gouvernance */
  conformite: {
    /** Événements par réglementation */
    parReglementation: {
      reglementation: string
      nombreEvenements: number
      evenementsCritiques: number
    }[]

    /** Rétention des logs */
    retention: {
      logsActifs: number
      logsArchives: number
      logsASupprimer: number
      prochaineArchivage: Date
    }
  }
}

/**
 * Interface pour la configuration de l'audit
 */
export interface IAuditConfiguration {
  /** Configuration générale */
  general: {
    /** Audit activé */
    enabled: boolean

    /** Niveau minimum de sévérité à logger */
    niveauMinimum: AuditSeverity

    /** Types d'événements à auditer */
    typesEvenements: AuditEventType[]

    /** Catégories à auditer */
    categories: AuditCategory[]

    /** Durée de rétention par défaut (jours) */
    dureeRetentionDefaut: number
  }

  /** Configuration par catégorie */
  parCategorie: {
    categorie: AuditCategory
    enabled: boolean
    niveauMinimum: AuditSeverity
    dureeRetention: number
    alertesActivees: boolean
    archivageAutomatique: boolean
  }[]

  /** Configuration de la sécurité */
  securite: {
    /** Chiffrement des logs sensibles */
    chiffrementLogs: boolean

    /** Signature numérique */
    signatureNumerique: boolean

    /** Vérification d'intégrité */
    verificationIntegrite: boolean

    /** Protection contre la falsification */
    protectionFalsification: boolean
  }

  /** Configuration des alertes */
  alertes: {
    /** Alertes temps réel activées */
    tempsReelActive: boolean

    /** Seuils d'alerte */
    seuils: {
      evenementsCritiquesParHeure: number
      echatsAuthParMinute: number
      violationsPolitiquesParJour: number
      tentativesIntrusionParHeure: number
    }

    /** Destinataires des alertes */
    destinataires: string[]

    /** Canaux de notification */
    canaux: ('EMAIL' | 'SMS' | 'WEBHOOK' | 'SLACK')[]
  }

  /** Configuration de l'archivage */
  archivage: {
    /** Archivage automatique activé */
    automatique: boolean

    /** Fréquence d'archivage */
    frequence: 'DAILY' | 'WEEKLY' | 'MONTHLY'

    /** Compression des archives */
    compression: boolean

    /** Stockage externe pour archives */
    stockageExterne?: {
      type: 'S3' | 'AZURE_BLOB' | 'GCS'
      configuration: Record<string, unknown>
    }
  }

  /** Configuration de l'exportation */
  export: {
    /** Formats d'exportation supportés */
    formatsSuppotes: ('JSON' | 'CSV' | 'XML' | 'SYSLOG')[]

    /** Exportation programmée */
    exportProgramme?: {
      frequence: 'DAILY' | 'WEEKLY' | 'MONTHLY'
      format: string
      destination: string
    }
  }
}