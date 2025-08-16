/**
 * Interface pour les filtres de recherche avancés des partenaires
 */
export interface IPartnerSearchFilters {
  /** Recherche textuelle globale */
  recherche?: string

  /** Filtres de base */
  base?: {
    /** Codes partenaires spécifiques */
    codes?: string[]

    /** IDs spécifiques */
    ids?: string[]

    /** Raisons sociales (recherche partielle) */
    raisonsSociales?: string[]

    /** Noms commerciaux (recherche partielle) */
    nomsCommerciaux?: string[]

    /** Types de partenaires */
    types?: string[]

    /** Statuts */
    statuts?: string[]

    /** Actif/Inactif */
    actif?: boolean

    /** Partenaire principal */
    principal?: boolean

    /** Partenaire certifié */
    certifie?: boolean
  }

  /** Filtres de classification */
  classification?: {
    /** Catégories de partenaires */
    categories?: string[]

    /** Groupes de partenaires */
    groupes?: string[]

    /** Classifications ABC */
    classificationsABC?: ('A' | 'B' | 'C')[]

    /** Niveaux de priorité */
    niveauxPriorite?: ('BASSE' | 'NORMALE' | 'HAUTE' | 'CRITIQUE')[]

    /** Segments de marché */
    segmentsMarche?: string[]

    /** Secteurs d'activité */
    secteursActivite?: string[]

    /** Sous-secteurs */
    sousSecteurs?: string[]
  }

  /** Filtres géographiques */
  geographie?: {
    /** Pays */
    pays?: string[]

    /** Régions */
    regions?: string[]

    /** Départements */
    departements?: string[]

    /** Villes */
    villes?: string[]

    /** Codes postaux */
    codesPostaux?: string[]

    /** Zones géographiques */
    zones?: string[]

    /** Distance maximum (km) */
    distanceMax?: number

    /** Point de référence (latitude, longitude) */
    pointReference?: {
      latitude: number
      longitude: number
    }
  }

  /** Filtres de contact */
  contact?: {
    /** Adresses email */
    emails?: string[]

    /** Numéros de téléphone */
    telephones?: string[]

    /** Sites web */
    sitesWeb?: string[]

    /** Contacts avec email */
    avecEmail?: boolean

    /** Contacts avec téléphone */
    avecTelephone?: boolean

    /** Contacts avec mobile */
    avecMobile?: boolean

    /** Préférences de contact */
    preferencesContact?: string[]
  }

  /** Filtres juridiques */
  juridique?: {
    /** Formes juridiques */
    formesJuridiques?: string[]

    /** Numéros SIRET */
    numerosSIRET?: string[]

    /** Numéros SIREN */
    numerosSIREN?: string[]

    /** Codes NAF */
    codesNAF?: string[]

    /** Numéros TVA intracommunautaire */
    numerosTVA?: string[]

    /** Pays de résidence fiscale */
    paysResidenceFiscale?: string[]
  }

  /** Filtres financiers */
  financier?: {
    /** Chiffre d'affaires minimum */
    chiffreAffairesMin?: number

    /** Chiffre d'affaires maximum */
    chiffreAffairesMax?: number

    /** Capital minimum */
    capitalMin?: number

    /** Capital maximum */
    capitalMax?: number

    /** Effectif minimum */
    effectifMin?: number

    /** Effectif maximum */
    effectifMax?: number

    /** Devise */
    devise?: string

    /** Conditions de paiement */
    conditionsPaiement?: string[]

    /** Modes de paiement */
    modesPaiement?: string[]

    /** Délais de paiement minimum (jours) */
    delaisPaiementMin?: number

    /** Délais de paiement maximum (jours) */
    delaisPaiementMax?: number

    /** Limite de crédit minimum */
    limiteCreditMin?: number

    /** Limite de crédit maximum */
    limiteCreditMax?: number
  }

  /** Filtres de performance */
  performance?: {
    /** Note globale minimum */
    noteGlobaleMin?: number

    /** Note globale maximum */
    noteGlobaleMax?: number

    /** Note qualité minimum */
    noteQualiteMin?: number

    /** Note qualité maximum */
    noteQualiteMax?: number

    /** Note délai minimum */
    noteDelaiMin?: number

    /** Note délai maximum */
    noteDelaiMax?: number

    /** Note service minimum */
    noteServiceMin?: number

    /** Note service maximum */
    noteServiceMax?: number

    /** Taux de conformité minimum (%) */
    tauxConformiteMin?: number

    /** Taux de conformité maximum (%) */
    tauxConformiteMax?: number

    /** Taux de réclamation maximum (%) */
    tauxReclamationMax?: number
  }

  /** Filtres temporels */
  temporels?: {
    /** Date de création - début */
    dateCreationDebut?: Date

    /** Date de création - fin */
    dateCreationFin?: Date

    /** Date de dernière commande - début */
    dateDerniereCommandeDebut?: Date

    /** Date de dernière commande - fin */
    dateDerniereCommandeFin?: Date

    /** Date de dernière livraison - début */
    dateDerniereLivraisonDebut?: Date

    /** Date de dernière livraison - fin */
    dateDerniereLivraisonFin?: Date

    /** Date de dernière interaction - début */
    dateDerniereInteractionDebut?: Date

    /** Date de dernière interaction - fin */
    dateDerniereInteractionFin?: Date

    /** Inactif depuis X jours */
    inactifDepuis?: number

    /** Dernière activité dans les X jours */
    derniereActiviteDans?: number
  }

  /** Filtres de relation commerciale */
  relationCommerciale?: {
    /** Types de relation */
    typesRelation?: ('FOURNISSEUR' | 'CLIENT' | 'SOUS_TRAITANT' | 'DISTRIBUTEUR' | 'PARTENAIRE')[]

    /** Montant d'affaires minimum */
    montantAffairesMin?: number

    /** Montant d'affaires maximum */
    montantAffairesMax?: number

    /** Nombre de commandes minimum */
    nombreCommandesMin?: number

    /** Nombre de commandes maximum */
    nombreCommandesMax?: number

    /** Fréquence de commandes */
    frequenceCommandes?: ('QUOTIDIENNE' | 'HEBDOMADAIRE' | 'MENSUELLE' | 'TRIMESTRIELLE' | 'ANNUELLE' | 'OCCASIONNELLE')[]

    /** Contrat cadre actif */
    contratCadreActif?: boolean

    /** Accord de partenariat */
    accordPartenariat?: boolean

    /** Exclusivité */
    exclusivite?: boolean
  }

  /** Filtres de capacité */
  capacite?: {
    /** Capacités métier */
    capacitesMetier?: string[]

    /** Technologies maîtrisées */
    technologies?: string[]

    /** Équipements disponibles */
    equipements?: string[]

    /** Capacité de production minimum */
    capaciteProductionMin?: number

    /** Capacité de production maximum */
    capaciteProductionMax?: number

    /** Certifications */
    certifications?: string[]

    /** Normes respectées */
    normes?: string[]

    /** Agréments */
    agrements?: string[]
  }

  /** Filtres de qualité */
  qualite?: {
    /** Certifications qualité */
    certificationsQualite?: string[]

    /** Système qualité */
    systemeQualite?: string[]

    /** Audits qualité réalisés */
    auditsQualiteRealises?: boolean

    /** Date dernier audit - début */
    dateDernierAuditDebut?: Date

    /** Date dernier audit - fin */
    dateDernierAuditFin?: Date

    /** Résultat dernier audit */
    resultatDernierAudit?: ('EXCELLENT' | 'BON' | 'SATISFAISANT' | 'INSUFFISANT')[]

    /** Actions correctives en cours */
    actionsCorrectives?: boolean

    /** Statut certification */
    statutCertification?: ('CERTIFIE' | 'EN_COURS' | 'EXPIRE' | 'SUSPENDU')[]
  }

  /** Filtres environnementaux */
  environnemental?: {
    /** Certifications environnementales */
    certificationsEnvironnementales?: string[]

    /** Politiques RSE */
    politiquesRSE?: boolean

    /** Empreinte carbone documentée */
    empreinteCarboneDocumentee?: boolean

    /** Recyclage des déchets */
    recyclage?: boolean

    /** Énergies renouvelables */
    energiesRenouvelables?: boolean

    /** Transport éco-responsable */
    transportEcoResponsable?: boolean
  }

  /** Filtres de risque */
  risque?: {
    /** Niveau de risque */
    niveauxRisque?: ('FAIBLE' | 'MOYEN' | 'ELEVE' | 'CRITIQUE')[]

    /** Types de risque */
    typesRisque?: string[]

    /** Assurance responsabilité civile */
    assuranceRC?: boolean

    /** Assurance professionnelle */
    assuranceProfessionnelle?: boolean

    /** Garantie financière */
    garantieFinanciere?: boolean

    /** Score de solvabilité minimum */
    scoreSolvabiliteMin?: number

    /** Score de solvabilité maximum */
    scoreSolvabiliteMax?: number

    /** Incidents signalés */
    incidentsSignales?: boolean
  }

  /** Filtres de communication */
  communication?: {
    /** Langues parlées */
    langues?: string[]

    /** Canaux de communication préférés */
    canauxCommunication?: string[]

    /** Disponibilité 24/7 */
    disponibilite24h?: boolean

    /** Service d'urgence */
    serviceUrgence?: boolean

    /** Support technique */
    supportTechnique?: boolean

    /** Formation fournie */
    formation?: boolean
  }

  /** Filtres logistiques */
  logistique?: {
    /** Moyens de transport */
    moyensTransport?: string[]

    /** Zones de livraison */
    zonesLivraison?: string[]

    /** Délai de livraison minimum (jours) */
    delaiLivraisonMin?: number

    /** Délai de livraison maximum (jours) */
    delaiLivraisonMax?: number

    /** Livraison express */
    livraisonExpress?: boolean

    /** Livraison sur site */
    livraisonSurSite?: boolean

    /** Emballage spécialisé */
    emballageSpecialise?: boolean

    /** Traçabilité transport */
    tracabiliteTransport?: boolean
  }

  /** Filtres de services */
  services?: {
    /** Services proposés */
    servicesProposés?: string[]

    /** Maintenance */
    maintenance?: boolean

    /** Support après-vente */
    supportApresVente?: boolean

    /** Formation */
    formation?: boolean

    /** Conseil technique */
    conseilTechnique?: boolean

    /** Installation */
    installation?: boolean

    /** Dépannage */
    depannage?: boolean

    /** Garantie étendue */
    garantieEtendue?: boolean
  }

  /** Filtres de tarification */
  tarification?: {
    /** Types de tarification */
    typesTarification?: string[]

    /** Remises proposées */
    remisesProposees?: boolean

    /** Conditions de remise */
    conditionsRemise?: string[]

    /** Grille tarifaire négociée */
    grilleTarifaireNegociee?: boolean

    /** Prix dégressifs */
    prixDegressifs?: boolean

    /** Tarifs préférentiels */
    tarifsPreferentiels?: boolean
  }

  /** Filtres de projets */
  projets?: {
    /** Projets en cours */
    projetsEnCours?: string[]

    /** Projets passés */
    projetsPasses?: string[]

    /** Types de projets */
    typesProjets?: string[]

    /** Montant de projets minimum */
    montantProjetsMin?: number

    /** Montant de projets maximum */
    montantProjetsMax?: number

    /** Durée de projets minimum (mois) */
    dureeProjetsMin?: number

    /** Durée de projets maximum (mois) */
    dureeProjetsMax?: number
  }

  /** Filtres personnalisés */
  personnalises?: {
    /** Attributs personnalisés */
    attributs?: Record<string, unknown>

    /** Tags/Étiquettes */
    tags?: string[]

    /** Métadonnées spécifiques */
    metadonnees?: Record<string, unknown>

    /** Champs utilisateur */
    champsUtilisateur?: Record<string, unknown>

    /** Notes particulières */
    notes?: string

    /** Observations */
    observations?: string
  }
}

/**
 * Interface pour les options de tri des partenaires
 */
export interface IPartnerSortOptions {
  /** Champ de tri */
  champ:
    | 'code'
    | 'raisonSociale'
    | 'nomCommercial'
    | 'type'
    | 'statut'
    | 'dateCreation'
    | 'dateModification'
    | 'derniereCommande'
    | 'derniereLivraison'
    | 'montantAffaires'
    | 'nombreCommandes'
    | 'noteGlobale'
    | 'noteQualite'
    | 'noteDelai'
    | 'noteService'
    | 'chiffreAffaires'
    | 'effectif'
    | 'ville'
    | 'pays'
    | 'classificationABC'
    | 'niveauRisque'

  /** Direction du tri */
  direction: 'ASC' | 'DESC'
}

/**
 * Interface pour la pagination des partenaires
 */
export interface IPartnerPagination {
  /** Page actuelle (commence à 1) */
  page: number

  /** Nombre d'éléments par page */
  limite: number

  /** Options de tri */
  tri?: IPartnerSortOptions[]
}

/**
 * Interface pour les options d'agrégation des partenaires
 */
export interface IPartnerAggregationOptions {
  /** Grouper par type */
  parType?: boolean

  /** Grouper par statut */
  parStatut?: boolean

  /** Grouper par pays */
  parPays?: boolean

  /** Grouper par région */
  parRegion?: boolean

  /** Grouper par secteur d'activité */
  parSecteurActivite?: boolean

  /** Grouper par classification ABC */
  parClassificationABC?: boolean

  /** Grouper par niveau de risque */
  parNiveauRisque?: boolean

  /** Grouper par performance */
  parPerformance?: boolean

  /** Calculer totaux financiers */
  totauxFinanciers?: boolean

  /** Calculer moyennes de performance */
  moyennesPerformance?: boolean

  /** Statistiques temporelles */
  statistiquesTemporelles?: boolean
}

/**
 * Interface pour les résultats agrégés des partenaires
 */
export interface IPartnerAggregationResult {
  /** Groupes de résultats */
  groupes: {
    /** Type de groupe */
    typeGroupe: string

    /** Groupes */
    groupes: {
      /** Clé du groupe */
      cle: string

      /** Libellé du groupe */
      libelle: string

      /** Nombre de partenaires */
      nombrePartenaires: number

      /** Montant d'affaires total */
      montantAffairesTotal: number

      /** Nombre de commandes total */
      nombreCommandesTotal: number

      /** Performance moyenne */
      performanceMoyenne: number

      /** Dernière activité */
      derniereActivite?: Date
    }[]
  }[]

  /** Statistiques globales */
  statistiques: {
    /** Nombre total de partenaires */
    nombreTotal: number

    /** Montant d'affaires total */
    montantAffairesTotal: number

    /** Nombre de commandes total */
    nombreCommandesTotal: number

    /** Performance moyenne globale */
    performanceMoyenneGlobale: number

    /** Répartition géographique */
    repartitionGeographique: {
      pays: string
      nombre: number
      pourcentage: number
    }[]
  }
}

/**
 * Interface pour les résultats de recherche de partenaires
 */
export interface IPartnerSearchResult {
  /** Partenaires trouvés */
  partenaires: any[] // Remplacez par votre interface Partner

  /** Informations de pagination */
  pagination: {
    /** Page actuelle */
    page: number

    /** Nombre d'éléments par page */
    limite: number

    /** Nombre total d'éléments */
    total: number

    /** Nombre total de pages */
    totalPages: number

    /** Y a-t-il une page suivante */
    hasNext: boolean

    /** Y a-t-il une page précédente */
    hasPrevious: boolean
  }

  /** Résultats agrégés (si demandés) */
  aggregations?: IPartnerAggregationResult

  /** Métadonnées de la recherche */
  meta: {
    /** Temps d'exécution (ms) */
    tempsExecution: number

    /** Nombre de filtres appliqués */
    nombreFiltres: number

    /** Score de pertinence moyen */
    scorePertinence?: number

    /** Index utilisé pour la recherche */
    indexUtilise?: string
  }

  /** Suggestions */
  suggestions?: {
    /** Corrections orthographiques */
    corrections?: string[]

    /** Filtres suggérés */
    filtresSuggeres?: Partial<IPartnerSearchFilters>

    /** Partenaires similaires */
    partenairesSimilaires?: string[]

    /** Recherches associées */
    recherchesAssociees?: string[]

    /** Termes de recherche populaires */
    termesPopulaires?: string[]
  }

  /** Facettes pour affinage de la recherche */
  facettes?: {
    /** Types de partenaires */
    types?: { valeur: string; nombre: number }[]

    /** Statuts */
    statuts?: { valeur: string; nombre: number }[]

    /** Pays */
    pays?: { valeur: string; nombre: number }[]

    /** Secteurs d'activité */
    secteursActivite?: { valeur: string; nombre: number }[]

    /** Classifications ABC */
    classificationsABC?: { valeur: string; nombre: number }[]

    /** Niveaux de risque */
    niveauxRisque?: { valeur: string; nombre: number }[]
  }
}