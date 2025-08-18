/**
 * Types de méthodes d'authentification multifacteur (MFA)
 */
export enum MFAMethodType {
  TOTP = 'TOTP', // Time-based One-Time Password (Google Authenticator, Authy)
  SMS = 'SMS', // Code par SMS
  EMAIL = 'EMAIL', // Code par email
  WEBAUTHN = 'WEBAUTHN', // WebAuthn (clé de sécurité, biométrie)
  BACKUP_CODES = 'BACKUP_CODES', // Codes de récupération
  APP_PUSH = 'APP_PUSH', // Notification push mobile
  VOICE_CALL = 'VOICE_CALL', // Appel vocal
}

/**
 * Statut de la vérification MFA
 */
export enum MFAVerificationStatus {
  PENDING = 'PENDING', // En attente de vérification
  VERIFIED = 'VERIFIED', // Vérifié avec succès
  FAILED = 'FAILED', // Échec de vérification
  EXPIRED = 'EXPIRED', // Code expiré
  BLOCKED = 'BLOCKED', // Compte bloqué après trop de tentatives
  CANCELLED = 'CANCELLED', // Annulé par l'utilisateur
}

/**
 * Interface pour une session de vérification MFA
 */
export interface IMFAVerification {
  /** Identifiant unique de la session de vérification */
  id: string

  /** ID de l'utilisateur */
  userId: string

  /** Email de l'utilisateur pour référence */
  userEmail: string

  /** ID de la session d'authentification */
  sessionId: string

  /** Méthode MFA utilisée */
  method: MFAMethodType

  /** Statut de la vérification */
  status: MFAVerificationStatus

  /** Code de vérification généré */
  verificationCode: string

  /** Date de génération du code */
  dateGeneration: Date

  /** Date d'expiration du code */
  dateExpiration: Date

  /** Nombre de tentatives effectuées */
  tentatives: number

  /** Nombre maximum de tentatives autorisées */
  maxTentatives: number

  /** Date de la première tentative */
  premiereTentative?: Date

  /** Date de la dernière tentative */
  derniereTentative?: Date

  /** Date de vérification réussie */
  dateVerification?: Date

  /** Adresse IP de l'utilisateur */
  adresseIP: string

  /** User-Agent du navigateur */
  userAgent: string

  /** Informations de géolocalisation */
  geolocalisation?: {
    pays?: string
    region?: string
    ville?: string
    latitude?: number
    longitude?: number
  }

  /** Empreinte du dispositif */
  deviceFingerprint?: string

  /** Informations spécifiques à la méthode */
  methodeInfos?: {
    /** Pour SMS/VOICE_CALL */
    numeroTelephone?: string

    /** Pour EMAIL */
    adresseEmail?: string

    /** Pour TOTP */
    secretKey?: string
    algorithm?: string
    digits?: number
    period?: number

    /** Pour WEBAUTHN */
    credentialId?: string
    publicKey?: string
    challenge?: string

    /** Pour BACKUP_CODES */
    codeUtilise?: string

    /** Pour APP_PUSH */
    deviceToken?: string
    pushId?: string
  }

  /** Raison de l'échec (si applicable) */
  raisonEchec?: string

  /** Code d'erreur technique */
  codeErreur?: string

  /** Contexte de la vérification */
  contexte: {
    /** Action nécessitant MFA */
    action: string

    /** Ressource accédée */
    ressource?: string

    /** Données de contexte supplémentaires */
    donneesContexte?: Record<string, unknown>
  }

  /** Options de sécurité */
  optionsSecurite: {
    /** Forcer la re-vérification même si déjà vérifié */
    forcerReverification: boolean

    /** Durée de validité après vérification réussie (secondes) */
    dureeValidite: number

    /** Mémoriser le dispositif */
    memoriserDispositif: boolean

    /** Durée de mémorisation du dispositif (jours) */
    dureeMemorisation?: number
  }

  /** Métadonnées de sécurité */
  metadonneesSecurite?: {
    /** Score de risque (0-100) */
    scoreRisque?: number

    /** Facteurs de risque identifiés */
    facteursRisque?: string[]

    /** Dispositif connu */
    dispositifConnu?: boolean

    /** Localisation habituelle */
    localisationHabituelle?: boolean

    /** Heure habituelle */
    heureHabituelle?: boolean
  }

  /** Audit et traçabilité */
  audit: {
    /** Date de création */
    dateCreation: Date

    /** Date de modification */
    dateModification?: Date

    /** Créé par (système/utilisateur) */
    creePar: string

    /** Historique des tentatives */
    historiqueTentatives: {
      date: Date
      codeEnvoye: string
      codeRecu?: string
      adresseIP: string
      userAgent: string
      resultat: 'SUCCESS' | 'FAIL' | 'TIMEOUT'
      tempsReponse?: number
    }[]
  }

  /** Informations de nettoyage */
  nettoyage: {
    /** Date de suppression automatique prévue */
    dateSuppressionPrevue: Date

    /** Peut être supprimé */
    peutEtreSuppr?: boolean
  }
}

/**
 * Interface pour initier une vérification MFA
 */
export interface IInitiateMFAVerification {
  /** ID de l'utilisateur */
  userId: string

  /** ID de la session */
  sessionId: string

  /** Méthode MFA préférée */
  method: MFAMethodType

  /** Contexte de la vérification */
  contexte: {
    action: string
    ressource?: string
    donneesContexte?: Record<string, unknown>
  }

  /** Options de sécurité */
  optionsSecurite?: {
    forcerReverification?: boolean
    dureeValidite?: number
    memoriserDispositif?: boolean
    dureeMemorisation?: number
  }

  /** Informations du dispositif */
  dispositif: {
    adresseIP: string
    userAgent: string
    deviceFingerprint?: string
  }

  /** Informations supplémentaires selon la méthode */
  methodeInfos?: {
    numeroTelephone?: string
    adresseEmail?: string
    deviceToken?: string
  }
}

/**
 * Interface pour vérifier un code MFA
 */
export interface IVerifyMFACode {
  /** ID de la session de vérification */
  verificationId: string

  /** Code fourni par l'utilisateur */
  codeUtilisateur: string

  /** Informations du dispositif */
  dispositif: {
    adresseIP: string
    userAgent: string
    deviceFingerprint?: string
  }

  /** Mémoriser ce dispositif */
  memoriserDispositif?: boolean
}

/**
 * Interface pour le résultat de la vérification MFA
 */
export interface IMFAVerificationResult {
  /** Succès de la vérification */
  success: boolean

  /** ID de la session de vérification */
  verificationId: string

  /** Statut de la vérification */
  status: MFAVerificationStatus

  /** Message à afficher à l'utilisateur */
  message: string

  /** Code d'erreur (si échec) */
  errorCode?: string

  /** Détails de l'erreur */
  errorDetails?: string

  /** Token d'authentification (si succès) */
  authToken?: string

  /** Token de rafraîchissement */
  refreshToken?: string

  /** Durée de validité du token (secondes) */
  tokenExpiration?: number

  /** Tentatives restantes (si échec) */
  tentativesRestantes?: number

  /** Temps d'attente avant nouvelle tentative (secondes) */
  tempsAttenteProchaineTentative?: number

  /** Méthodes MFA alternatives disponibles */
  methodesAlternatives?: MFAMethodType[]

  /** Dispositif mémorisé */
  dispositifMemorise?: boolean

  /** Prochaine vérification MFA requise dans X secondes */
  prochaineVerificationDans?: number

  /** Informations de sécurité */
  infosSecurity?: {
    scoreRisque?: number
    factorsRisque?: string[]
    recommendationSecurity?: string[]
  }
}

/**
 * Interface pour la configuration MFA d'un utilisateur
 */
export interface IUserMFAConfiguration {
  /** ID de l'utilisateur */
  userId: string

  /** MFA activé */
  mfaEnabled: boolean

  /** MFA requis pour cet utilisateur */
  mfaRequired: boolean

  /** Méthodes MFA configurées */
  methodesConfigurees: {
    /** Type de méthode */
    type: MFAMethodType

    /** Activée */
    active: boolean

    /** Méthode principale */
    principale: boolean

    /** Informations de configuration */
    configuration: {
      /** Pour TOTP */
      secretKey?: string
      algorithm?: string
      digits?: number
      period?: number

      /** Pour SMS/VOICE */
      numeroTelephone?: string
      numeroVerifie?: boolean

      /** Pour EMAIL */
      adresseEmail?: string
      emailVerifie?: boolean

      /** Pour WEBAUTHN */
      credentials?: {
        credentialId: string
        publicKey: string
        counter: number
        dateInscription: Date
        derniereUtilisation?: Date
        nomDispositif?: string
      }[]

      /** Pour BACKUP_CODES */
      codesGeneres?: {
        code: string
        utilise: boolean
        dateUtilisation?: Date
      }[]

      /** Pour APP_PUSH */
      deviceTokens?: {
        token: string
        plateforme: string
        dateInscription: Date
        actif: boolean
      }[]
    }

    /** Date d'activation */
    dateActivation: Date

    /** Dernière utilisation */
    derniereUtilisation?: Date

    /** Nombre d'utilisations */
    nombreUtilisations: number
  }[]

  /** Dispositifs mémorisés */
  dispositifsMemorises: {
    /** Empreinte du dispositif */
    deviceFingerprint: string

    /** Nom donné au dispositif */
    nomDispositif: string

    /** Date de mémorisation */
    dateMemorisation: Date

    /** Date d'expiration */
    dateExpiration: Date

    /** Dernière utilisation */
    derniereUtilisation?: Date

    /** Informations du dispositif */
    infosDispositif: {
      userAgent: string
      plateforme?: string
      navigateur?: string
      version?: string
    }

    /** Localisation de la mémorisation */
    localisation?: {
      pays?: string
      region?: string
      ville?: string
    }

    /** Actif */
    actif: boolean
  }[]

  /** Codes de récupération */
  codesRecuperation?: {
    /** Codes générés */
    codes: string[]

    /** Date de génération */
    dateGeneration: Date

    /** Codes utilisés */
    codesUtilises: string[]
  }

  /** Préférences MFA */
  preferences: {
    /** Méthode par défaut */
    methodeParDefaut: MFAMethodType

    /** Demander MFA pour toutes les actions sensibles */
    mfaPourActionsSensibles: boolean

    /** Fréquence de re-vérification (heures) */
    frequenceReverification: number

    /** Notifications de sécurité */
    notificationsSecurite: boolean
  }

  /** Statistiques */
  statistiques: {
    /** Nombre total de vérifications */
    nombreTotalVerifications: number

    /** Nombre de vérifications réussies */
    nombreVerificationsReussies: number

    /** Nombre d'échecs */
    nombreEchecs: number

    /** Dernière vérification réussie */
    derniereVerificationReussie?: Date

    /** Date de dernière configuration */
    derniereConfiguration: Date
  }

  /** Paramètres de sécurité */
  parametresSecurite: {
    /** Nombre maximum de tentatives par session */
    maxTentativesParSession: number

    /** Durée de blocage après échecs répétés (minutes) */
    dureeBlocage: number

    /** Durée de validité des codes (minutes) */
    dureeValiditeCodes: number

    /** Longueur des codes générés */
    longueurCodes: number
  }
}

/**
 * Interface pour les filtres de recherche des vérifications MFA
 */
export interface IMFAVerificationFilters {
  /** Filtrer par utilisateur */
  userIds?: string[]

  /** Filtrer par méthode */
  methods?: MFAMethodType[]

  /** Filtrer par statut */
  status?: MFAVerificationStatus[]

  /** Filtrer par période */
  dateDebut?: Date
  dateFin?: Date

  /** Filtrer par adresse IP */
  adressesIP?: string[]

  /** Filtrer par succès/échec */
  success?: boolean

  /** Filtrer par action */
  actions?: string[]

  /** Filtrer par nombre de tentatives */
  tentativesMin?: number
  tentativesMax?: number

  /** Recherche textuelle */
  recherche?: string
}

/**
 * Interface pour les statistiques MFA
 */
export interface IMFAStatistics {
  /** Statistiques globales */
  global: {
    /** Nombre total de vérifications */
    totalVerifications: number

    /** Nombre de vérifications réussies */
    verificationsReussies: number

    /** Taux de succès (%) */
    tauxSucces: number

    /** Utilisateurs avec MFA activé */
    utilisateursMFAActif: number

    /** Méthodes les plus utilisées */
    methodesPopulaires: {
      methode: MFAMethodType
      nombre: number
      pourcentage: number
    }[]
  }

  /** Statistiques par méthode */
  parMethode: {
    /** Méthode */
    methode: MFAMethodType

    /** Nombre d'utilisations */
    nombreUtilisations: number

    /** Taux de succès */
    tauxSucces: number

    /** Temps de vérification moyen (secondes) */
    tempsVerificationMoyen: number

    /** Nombre d'utilisateurs utilisant cette méthode */
    nombreUtilisateurs: number
  }[]

  /** Tendances temporelles */
  tendances: {
    /** Évolution par jour (30 derniers jours) */
    evolutionJournaliere: {
      date: Date
      nombreVerifications: number
      tauxSucces: number
    }[]

    /** Répartition par heure */
    repartitionHoraire: {
      heure: number
      nombreVerifications: number
    }[]
  }

  /** Alertes de sécurité */
  alertes: {
    /** Tentatives suspectes détectées */
    tentativesSupectes: number

    /** Comptes potentiellement compromis */
    comptesArisque: number

    /** Nouvelles localisations détectées */
    nouvellesLocalisations: number
  }
}
