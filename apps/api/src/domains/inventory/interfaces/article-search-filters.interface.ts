/**
 * Interface pour les filtres de recherche avancés des articles
 */
export interface IArticleSearchFilters {
  /** Recherche textuelle globale */
  recherche?: string

  /** Filtres de base */
  base?: {
    /** Codes d'articles spécifiques */
    codes?: string[]

    /** IDs d'articles spécifiques */
    ids?: string[]

    /** Libellés d'articles (recherche partielle) */
    libelles?: string[]

    /** Statuts des articles */
    statuts?: string[]

    /** Types d'articles */
    types?: string[]

    /** Actif/Inactif */
    actif?: boolean
  }

  /** Filtres de stock */
  stock?: {
    /** Stock minimum */
    stockMin?: number

    /** Stock maximum */
    stockMax?: number

    /** Articles en rupture */
    enRupture?: boolean

    /** Articles sous stock minimum */
    sousStockMin?: boolean

    /** Articles en surstock */
    enSurstock?: boolean

    /** Stock disponible minimum */
    stockDisponibleMin?: number

    /** Stock disponible maximum */
    stockDisponibleMax?: number

    /** Stock réservé minimum */
    stockReserveMin?: number

    /** Stock réservé maximum */
    stockReserveMax?: number
  }

  /** Filtres de prix */
  prix?: {
    /** Prix d'achat minimum */
    prixAchatMin?: number

    /** Prix d'achat maximum */
    prixAchatMax?: number

    /** Prix de vente minimum */
    prixVenteMin?: number

    /** Prix de vente maximum */
    prixVenteMax?: number

    /** Devise */
    devise?: string

    /** Marge minimum (%) */
    margeMin?: number

    /** Marge maximum (%) */
    margeMax?: number
  }

  /** Filtres de valeur */
  valeur?: {
    /** Valeur stock minimum */
    valeurStockMin?: number

    /** Valeur stock maximum */
    valeurStockMax?: number

    /** Valeur unitaire minimum */
    valeurUnitaireMin?: number

    /** Valeur unitaire maximum */
    valeurUnitaireMax?: number
  }

  /** Filtres de catégorisation */
  categorisation?: {
    /** Catégories */
    categories?: string[]

    /** Sous-catégories */
    sousCategories?: string[]

    /** Familles */
    familles?: string[]

    /** Marques */
    marques?: string[]

    /** Fournisseurs */
    fournisseurs?: string[]

    /** Unités de mesure */
    unitesMesure?: string[]
  }

  /** Filtres de localisation */
  localisation?: {
    /** Emplacements */
    emplacements?: string[]

    /** Zones de stockage */
    zones?: string[]

    /** Magasins/Dépôts */
    depots?: string[]

    /** Allées */
    allees?: string[]

    /** Rayons */
    rayons?: string[]
  }

  /** Filtres temporels */
  temporels?: {
    /** Date de création - début */
    dateCreationDebut?: Date

    /** Date de création - fin */
    dateCreationFin?: Date

    /** Date de dernière modification - début */
    dateModificationDebut?: Date

    /** Date de dernière modification - fin */
    dateModificationFin?: Date

    /** Date de dernière entrée - début */
    dateDerniereEntreeDebut?: Date

    /** Date de dernière entrée - fin */
    dateDerniereEntreeFin?: Date

    /** Date de dernière sortie - début */
    dateDerniereSortieDebut?: Date

    /** Date de dernière sortie - fin */
    dateDerniereSortieFin?: Date

    /** Date de péremption - début */
    datePeremptionDebut?: Date

    /** Date de péremption - fin */
    datePeremptionFin?: Date
  }

  /** Filtres de rotation */
  rotation?: {
    /** Rotation minimum (jours) */
    rotationMin?: number

    /** Rotation maximum (jours) */
    rotationMax?: number

    /** Classification ABC */
    classificationABC?: ('A' | 'B' | 'C')[]

    /** Articles sans mouvement depuis X jours */
    sansMouvementDepuis?: number

    /** Fréquence de mouvement minimum */
    frequenceMovementMin?: number

    /** Fréquence de mouvement maximum */
    frequenceMovementMax?: number
  }

  /** Filtres de qualité et conformité */
  qualite?: {
    /** Certifications requises */
    certifications?: string[]

    /** Normes */
    normes?: string[]

    /** Statut qualité */
    statutsQualite?: string[]

    /** Contrôle qualité requis */
    controleQualiteRequis?: boolean

    /** Articles non conformes */
    nonConformes?: boolean
  }

  /** Filtres de traçabilité */
  tracabilite?: {
    /** Numéros de lot */
    numerosLot?: string[]

    /** Numéros de série */
    numerosSerie?: string[]

    /** Traçabilité requise */
    tracabiliteRequise?: boolean

    /** Articles avec lot */
    avecLot?: boolean

    /** Articles avec série */
    avecSerie?: boolean
  }

  /** Filtres de gestion */
  gestion?: {
    /** Méthode de valorisation */
    methodesValorisation?: string[]

    /** Gestion par lot */
    gestionParLot?: boolean

    /** Gestion par série */
    gestionParSerie?: boolean

    /** Articles périssables */
    perissables?: boolean

    /** Articles dangereux */
    dangereux?: boolean

    /** Stockage spécial requis */
    stockageSpecial?: boolean
  }

  /** Filtres de performance */
  performance?: {
    /** Articles rentables */
    rentables?: boolean

    /** Rentabilité minimum (%) */
    rentabiliteMin?: number

    /** Rentabilité maximum (%) */
    rentabiliteMax?: number

    /** Chiffre d'affaires minimum */
    chiffreAffairesMin?: number

    /** Chiffre d'affaires maximum */
    chiffreAffairesMax?: number

    /** Contribution marge minimum (%) */
    contributionMargeMin?: number
  }

  /** Filtres de prévisions */
  previsions?: {
    /** Articles à commander */
    aCommander?: boolean

    /** Rupture prévue avant X jours */
    rupturePrevueAvant?: number

    /** Consommation prévue minimum */
    consommationPrevueMin?: number

    /** Consommation prévue maximum */
    consommationPrevueMax?: number
  }

  /** Filtres métier spécifiques */
  metier?: {
    /** Articles de production */
    production?: boolean

    /** Articles de maintenance */
    maintenance?: boolean

    /** Articles de revente */
    revente?: boolean

    /** Articles sur mesure */
    surMesure?: boolean

    /** Articles standards */
    standards?: boolean
  }

  /** Filtres de dimensions (pour les matériaux) */
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

    /** Poids minimum */
    poidsMin?: number

    /** Poids maximum */
    poidsMax?: number
  }

  /** Filtres personnalisés */
  personnalises?: {
    /** Champs personnalisés */
    champs?: Record<string, unknown>

    /** Tags/Étiquettes */
    tags?: string[]

    /** Attributs spéciaux */
    attributs?: Record<string, string | number | boolean>
  }
}

/**
 * Interface pour les options de tri des articles
 */
export interface IArticleSortOptions {
  /** Champ de tri */
  champ:
    | 'code'
    | 'libelle'
    | 'stock'
    | 'stockDisponible'
    | 'valeurStock'
    | 'prixAchat'
    | 'prixVente'
    | 'rotation'
    | 'dateCreation'
    | 'dateModification'
    | 'derniereEntree'
    | 'derniereSortie'
    | 'categorie'
    | 'fournisseur'
    | 'emplacement'

  /** Direction du tri */
  direction: 'ASC' | 'DESC'
}

/**
 * Interface pour la pagination des articles
 */
export interface IArticlePagination {
  /** Page actuelle (commence à 1) */
  page: number

  /** Nombre d'éléments par page */
  limite: number

  /** Options de tri */
  tri?: IArticleSortOptions[]
}

/**
 * Interface pour les options d'agrégation
 */
export interface IArticleAggregationOptions {
  /** Grouper par catégorie */
  parCategorie?: boolean

  /** Grouper par fournisseur */
  parFournisseur?: boolean

  /** Grouper par emplacement */
  parEmplacement?: boolean

  /** Grouper par statut */
  parStatut?: boolean

  /** Grouper par type */
  parType?: boolean

  /** Calculer les totaux */
  calculerTotaux?: boolean

  /** Calculer les moyennes */
  calculerMoyennes?: boolean

  /** Calculer les statistiques */
  calculerStatistiques?: boolean
}

/**
 * Interface pour les résultats agrégés
 */
export interface IArticleAggregationResult {
  /** Groupes de résultats */
  groupes: {
    /** Clé du groupe */
    cle: string

    /** Libellé du groupe */
    libelle: string

    /** Nombre d'articles */
    nombreArticles: number

    /** Valeur totale */
    valeurTotale: number

    /** Stock total */
    stockTotal: number

    /** Articles en rupture */
    articlesEnRupture: number

    /** Rotation moyenne */
    rotationMoyenne: number
  }[]

  /** Totaux généraux */
  totaux: {
    /** Nombre total d'articles */
    nombreArticles: number

    /** Valeur totale */
    valeurTotale: number

    /** Stock total */
    stockTotal: number

    /** Valeur moyenne */
    valeurMoyenne: number
  }
}

/**
 * Interface pour les résultats de recherche d'articles
 */
export interface IArticleSearchResult {
  /** Articles trouvés */
  articles: unknown[] // Remplacez par votre interface Article

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
  aggregations?: IArticleAggregationResult

  /** Statistiques de la recherche */
  statistiques?: {
    /** Temps de recherche (ms) */
    tempsRecherche: number

    /** Nombre de filtres appliqués */
    nombreFiltres: number

    /** Pertinence moyenne */
    pertinenceMoyenne?: number
  }

  /** Suggestions */
  suggestions?: {
    /** Suggestions de correction */
    corrections?: string[]

    /** Suggestions de filtres */
    filtresSuggeres?: Partial<IArticleSearchFilters>

    /** Articles similaires */
    articlesSimilaires?: string[]
  }
}
