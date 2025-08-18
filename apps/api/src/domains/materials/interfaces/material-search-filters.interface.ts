/**
 * Interface pour les filtres de recherche avancés des matériaux
 */
export interface IMaterialSearchFilters {
  /** Recherche textuelle globale */
  recherche?: string

  /** Filtres de base */
  base?: {
    /** Références spécifiques */
    references?: string[]

    /** IDs spécifiques */
    ids?: string[]

    /** Noms de matériaux (recherche partielle) */
    noms?: string[]

    /** Statuts des matériaux */
    statuts?: string[]

    /** Types de matériaux */
    types?: string[]

    /** Formes des matériaux */
    formes?: string[]

    /** Nuances */
    nuances?: string[]

    /** Qualités */
    qualites?: string[]

    /** Marques */
    marques?: string[]

    /** Modèles */
    modeles?: string[]

    /** Actif/Inactif */
    actif?: boolean

    /** Obsolète */
    obsolete?: boolean
  }

  /** Filtres de stock */
  stock?: {
    /** Stock physique minimum */
    stockPhysiqueMin?: number

    /** Stock physique maximum */
    stockPhysiqueMax?: number

    /** Stock minimum configuré - min */
    stockMiniMin?: number

    /** Stock minimum configuré - max */
    stockMiniMax?: number

    /** Stock maximum configuré - min */
    stockMaxiMin?: number

    /** Stock maximum configuré - max */
    stockMaxiMax?: number

    /** Stock réservé minimum */
    stockReserveMin?: number

    /** Stock réservé maximum */
    stockReserveMax?: number

    /** Matériaux en rupture */
    enRupture?: boolean

    /** Matériaux sous stock minimum */
    sousStockMin?: boolean

    /** Matériaux en surstock */
    enSurstock?: boolean

    /** Stock disponible minimum */
    stockDisponibleMin?: number

    /** Stock disponible maximum */
    stockDisponibleMax?: number
  }

  /** Filtres de prix et valeur */
  prix?: {
    /** Prix unitaire minimum */
    prixUnitaireMin?: number

    /** Prix unitaire maximum */
    prixUnitaireMax?: number

    /** Devise */
    devise?: string

    /** Valeur stock minimum */
    valeurStockMin?: number

    /** Valeur stock maximum */
    valeurStockMax?: number

    /** Évolution prix minimum (%) */
    evolutionPrixMin?: number

    /** Évolution prix maximum (%) */
    evolutionPrixMax?: number
  }

  /** Filtres de dimensions */
  dimensions?: {
    /** Longueur minimum */
    longueurMin?: number

    /** Longueur maximum */
    longueurMax?: number

    /** Largeur minimum */
    largeurMin?: number

    /** Largeur maximum */
    largeurMax?: number

    /** Épaisseur minimum */
    epaisseurMin?: number

    /** Épaisseur maximum */
    epaisseurMax?: number

    /** Diamètre minimum */
    diametreMin?: number

    /** Diamètre maximum */
    diametreMax?: number

    /** Diamètre intérieur minimum */
    diametreInterieurMin?: number

    /** Diamètre intérieur maximum */
    diametreInterieurMax?: number

    /** Diamètre extérieur minimum */
    diametreExterieurMin?: number

    /** Diamètre extérieur maximum */
    diametreExterieurMax?: number

    /** Hauteur minimum */
    hauteurMin?: number

    /** Hauteur maximum */
    hauteurMax?: number

    /** Poids unitaire minimum */
    poidsUnitaireMin?: number

    /** Poids unitaire maximum */
    poidsUnitaireMax?: number

    /** Densité minimum */
    densiteMin?: number

    /** Densité maximum */
    densiteMax?: number

    /** Section minimum */
    sectionMin?: number

    /** Section maximum */
    sectionMax?: number
  }

  /** Filtres de propriétés mécaniques */
  proprietesMecaniques?: {
    /** Limite élastique minimum (MPa) */
    limiteElastiqueMin?: number

    /** Limite élastique maximum (MPa) */
    limiteElastiqueMax?: number

    /** Résistance traction minimum (MPa) */
    resistanceTractionMin?: number

    /** Résistance traction maximum (MPa) */
    resistanceTractionMax?: number

    /** Dureté minimum */
    dureteMin?: number

    /** Dureté maximum */
    dureteMax?: number

    /** Module d'élasticité minimum (GPa) */
    moduleElasticiteMin?: number

    /** Module d'élasticité maximum (GPa) */
    moduleElasticiteMax?: number

    /** Résilience minimum */
    resilienceMin?: number

    /** Résilience maximum */
    resilienceMax?: number

    /** Allongement minimum (%) */
    allongementMin?: number

    /** Allongement maximum (%) */
    allongementMax?: number
  }

  /** Filtres de propriétés physiques */
  proprietesPhysiques?: {
    /** Densité minimum (g/cm³) */
    densiteMin?: number

    /** Densité maximum (g/cm³) */
    densiteMax?: number

    /** Point de fusion minimum (°C) */
    pointFusionMin?: number

    /** Point de fusion maximum (°C) */
    pointFusionMax?: number

    /** Conductivité thermique minimum (W/m·K) */
    conductiviteThermiqueMin?: number

    /** Conductivité thermique maximum (W/m·K) */
    conductiviteThermiqueMax?: number

    /** Conductivité électrique minimum (S/m) */
    conductiviteElectriqueMin?: number

    /** Conductivité électrique maximum (S/m) */
    conductiviteElectriqueMax?: number

    /** Dilatation thermique minimum (1/K) */
    dilatationThermiqueMin?: number

    /** Dilatation thermique maximum (1/K) */
    dilatationThermiqueMax?: number
  }

  /** Filtres de composition chimique */
  compositionChimique?: {
    /** Éléments requis avec pourcentages minimum */
    elementsRequis?: Record<string, number>

    /** Éléments interdits */
    elementsInterdits?: string[]

    /** Pourcentage carbone minimum */
    carboneMin?: number

    /** Pourcentage carbone maximum */
    carboneMax?: number

    /** Pourcentage chrome minimum */
    chromeMin?: number

    /** Pourcentage chrome maximum */
    chromeMax?: number

    /** Pourcentage nickel minimum */
    nickelMin?: number

    /** Pourcentage nickel maximum */
    nickelMax?: number

    /** Résistance à la corrosion */
    resistanceCorrosion?: string[]
  }

  /** Filtres de localisation et stockage */
  localisation?: {
    /** Emplacements */
    emplacements?: string[]

    /** Zones de stockage */
    zones?: string[]

    /** Méthodes de stockage */
    methodesStockage?: string[]

    /** Conditions stockage spéciales */
    conditionsSpeciales?: boolean

    /** Matériaux dangereux */
    dangereux?: boolean

    /** Classes de danger */
    classesDanger?: string[]
  }

  /** Filtres temporels */
  temporels?: {
    /** Date de création - début */
    dateCreationDebut?: Date

    /** Date de création - fin */
    dateCreationFin?: Date

    /** Date de dernière entrée - début */
    dateDerniereEntreeDebut?: Date

    /** Date de dernière entrée - fin */
    dateDerniereEntreeFin?: Date

    /** Date de dernière sortie - début */
    dateDerniereSortieDebut?: Date

    /** Date de dernière sortie - fin */
    dateDerniereSortieFin?: Date

    /** Date de dernier inventaire - début */
    dateDernierInventaireDebut?: Date

    /** Date de dernier inventaire - fin */
    dateDernierInventaireFin?: Date

    /** Âge du stock minimum (jours) */
    ageStockMin?: number

    /** Âge du stock maximum (jours) */
    ageStockMax?: number
  }

  /** Filtres de rotation et performance */
  performance?: {
    /** Rotation minimum (jours) */
    rotationMin?: number

    /** Rotation maximum (jours) */
    rotationMax?: number

    /** Classification ABC */
    classificationABC?: ('A' | 'B' | 'C')[]

    /** Classification XYZ */
    classificationXYZ?: ('X' | 'Y' | 'Z')[]

    /** Matériaux sans mouvement depuis X jours */
    sansMouvementDepuis?: number

    /** Consommation moyenne minimum */
    consommationMoyenneMin?: number

    /** Consommation moyenne maximum */
    consommationMoyenneMax?: number

    /** Fréquence de mouvement minimum */
    frequenceMin?: number

    /** Fréquence de mouvement maximum */
    frequenceMax?: number
  }

  /** Filtres de qualité et conformité */
  qualite?: {
    /** Certifications requises */
    certifications?: string[]

    /** Normes */
    normes?: string[]

    /** Attestations */
    attestations?: string[]

    /** Classifications */
    classifications?: string[]

    /** Essais requis */
    essaisRequis?: string[]

    /** Contrôle qualité requis */
    controleQualiteRequis?: boolean

    /** Matériaux conformes */
    conformes?: boolean

    /** Matériaux avec défauts */
    avecDefauts?: boolean
  }

  /** Filtres d'approvisionnement */
  approvisionnement?: {
    /** Fournisseurs principaux */
    fournisseursPrincipaux?: string[]

    /** Fournisseurs secondaires */
    fournisseursSecondaires?: string[]

    /** Références fournisseur */
    referencesFournisseur?: string[]

    /** Délai livraison minimum (jours) */
    delaiLivraisonMin?: number

    /** Délai livraison maximum (jours) */
    delaiLivraisonMax?: number

    /** Quantité minimum commande - min */
    qteMinCommandeMin?: number

    /** Quantité minimum commande - max */
    qteMinCommandeMax?: number

    /** Transport spécial requis */
    transportSpecial?: boolean

    /** Stockage fournisseur */
    stockageFournisseur?: boolean

    /** Contrat cadre */
    contratCadre?: boolean
  }

  /** Filtres de production */
  production?: {
    /** Procédés de fabrication */
    procedesFabrication?: string[]

    /** Outils spéciaux requis */
    outilsSpeciauxRequis?: boolean

    /** Temps d'usinage minimum (minutes) */
    tempsUsinageMin?: number

    /** Temps d'usinage maximum (minutes) */
    tempsUsinageMax?: number

    /** Taux de rebut maximum (%) */
    tauxRebutMax?: number

    /** Post-traitement requis */
    postTraitementRequis?: string[]

    /** Assemblage spécial */
    assemblageSpecial?: boolean
  }

  /** Filtres de traçabilité */
  tracabilite?: {
    /** Matériaux avec numéro de coulée */
    avecNumeroCoulee?: boolean

    /** Matériaux avec certificat */
    avecCertificat?: boolean

    /** Matériaux tracés */
    traces?: boolean

    /** Numéros de coulée */
    numerosCoulee?: string[]

    /** Numéros de certificat */
    numerosCertificat?: string[]

    /** Origine géographique */
    origineGeographique?: string[]
  }

  /** Filtres métier spécifiques */
  metier?: {
    /** Usage construction */
    construction?: boolean

    /** Usage mécanique */
    mecanique?: boolean

    /** Usage électrique */
    electrique?: boolean

    /** Usage chimique */
    chimique?: boolean

    /** Usage alimentaire */
    alimentaire?: boolean

    /** Usage maritime */
    maritime?: boolean

    /** Usage aéronautique */
    aeronautique?: boolean

    /** Usage automobile */
    automobile?: boolean

    /** Usage ferroviaire */
    ferroviaire?: boolean

    /** Usage énergie */
    energie?: boolean
  }

  /** Filtres environnementaux */
  environnemental?: {
    /** Matériaux recyclables */
    recyclables?: boolean

    /** Matériaux recyclés */
    recycles?: boolean

    /** Empreinte carbone maximum */
    empreinteCarboneMax?: number

    /** Certifications environnementales */
    certificationsEnvironnementales?: string[]

    /** Substances dangereuses */
    substancesDangereuses?: boolean

    /** Conformité REACH */
    conformiteREACH?: boolean

    /** Conformité RoHS */
    conformiteRoHS?: boolean
  }

  /** Filtres économiques */
  economique?: {
    /** Matériaux économiques */
    economiques?: boolean

    /** Rapport qualité/prix minimum */
    rapportQualitePrixMin?: number

    /** Coût total possession minimum */
    coutTotalPossessionMin?: number

    /** Coût total possession maximum */
    coutTotalPossessionMax?: number

    /** Rentabilité minimum (%) */
    rentabiliteMin?: number
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
  }
}

/**
 * Interface pour les options de tri des matériaux
 */
export interface IMaterialSortOptions {
  /** Champ de tri */
  champ:
    | 'reference'
    | 'nom'
    | 'type'
    | 'forme'
    | 'nuance'
    | 'stockPhysique'
    | 'stockDisponible'
    | 'valeurStock'
    | 'prixUnitaire'
    | 'rotation'
    | 'dateCreation'
    | 'dateModification'
    | 'derniereEntree'
    | 'derniereSortie'
    | 'fournisseurPrincipal'
    | 'emplacement'
    | 'poidsUnitaire'
    | 'densite'
    | 'limiteElastique'
    | 'resistanceTraction'
    | 'longueur'
    | 'largeur'
    | 'epaisseur'
    | 'diametre'

  /** Direction du tri */
  direction: 'ASC' | 'DESC'
}

/**
 * Interface pour la pagination des matériaux
 */
export interface IMaterialPagination {
  /** Page actuelle (commence à 1) */
  page: number

  /** Nombre d'éléments par page */
  limite: number

  /** Options de tri */
  tri?: IMaterialSortOptions[]
}

/**
 * Interface pour les options d'agrégation des matériaux
 */
export interface IMaterialAggregationOptions {
  /** Grouper par type */
  parType?: boolean

  /** Grouper par forme */
  parForme?: boolean

  /** Grouper par nuance */
  parNuance?: boolean

  /** Grouper par fournisseur */
  parFournisseur?: boolean

  /** Grouper par emplacement */
  parEmplacement?: boolean

  /** Grouper par classification ABC */
  parClassificationABC?: boolean

  /** Calculer statistiques dimensionnelles */
  statistiquesDimensionnelles?: boolean

  /** Calculer statistiques mécaniques */
  statistiquesDecaniques?: boolean

  /** Calculer totaux financiers */
  totauxFinanciers?: boolean

  /** Calculer moyennes */
  calculerMoyennes?: boolean
}

/**
 * Interface pour les résultats de recherche de matériaux
 */
export interface IMaterialSearchResult {
  /** Matériaux trouvés */
  materiaux: any[] // Remplacez par votre interface Material

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

  /** Résultats agrégés */
  aggregations?: {
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

        /** Nombre de matériaux */
        nombreMateriaux: number

        /** Valeur totale */
        valeurTotale: number

        /** Stock total */
        stockTotal: number

        /** Poids total */
        poidsTotal: number
      }[]
    }[]

    /** Statistiques globales */
    statistiques: {
      /** Valeur totale */
      valeurTotale: number

      /** Stock total */
      stockTotal: number

      /** Poids total */
      poidsTotal: number

      /** Volume total */
      volumeTotal: number

      /** Nombre total */
      nombreTotal: number
    }
  }

  /** Métadonnées de la recherche */
  meta: {
    /** Temps d'exécution (ms) */
    tempsExecution: number

    /** Nombre de filtres appliqués */
    nombreFiltres: number

    /** Index utilisé */
    indexUtilise?: string

    /** Score de pertinence moyen */
    scorePertinence?: number
  }

  /** Suggestions */
  suggestions?: {
    /** Corrections de recherche */
    corrections?: string[]

    /** Filtres suggérés */
    filtresSuggeres?: Partial<IMaterialSearchFilters>

    /** Matériaux similaires */
    materiauxSimilaires?: string[]

    /** Recherches associées */
    recherchesAssociees?: string[]
  }
}
