/**
 * Interface pour les statistiques globales de l'inventaire
 */
export interface IInventoryStats {
  /** Statistiques générales */
  global: {
    /** Nombre total d'articles */
    totalArticles: number

    /** Nombre d'articles actifs */
    articlesActifs: number

    /** Nombre d'articles inactifs */
    articlesInactifs: number

    /** Valeur totale du stock */
    valeurTotaleStock: number

    /** Devise principale */
    devise: string

    /** Date de dernière mise à jour */
    derniereMiseAJour: Date
  }

  /** Statistiques de stock */
  stock: {
    /** Articles en rupture de stock */
    articlesEnRupture: number

    /** Articles sous le stock minimum */
    articlesSousStockMin: number

    /** Articles en surstock */
    articlesEnSurstock: number

    /** Pourcentage d'articles disponibles */
    tauxDisponibilite: number

    /** Valeur moyenne des articles */
    valeurMoyenneArticle: number

    /** Stock total en unités */
    stockTotalUnites: number
  }

  /** Statistiques de rotation */
  rotation: {
    /** Rotation moyenne (jours) */
    rotationMoyenne: number

    /** Articles à rotation rapide (< 30 jours) */
    articlesRotationRapide: number

    /** Articles à rotation normale (30-90 jours) */
    articlesRotationNormale: number

    /** Articles à rotation lente (> 90 jours) */
    articlesRotationLente: number

    /** Articles sans mouvement (> 365 jours) */
    articlesSansMovement: number
  }

  /** Répartition par catégorie */
  categories: {
    /** Nom de la catégorie */
    nom: string

    /** Nombre d'articles */
    nombreArticles: number

    /** Valeur du stock */
    valeurStock: number

    /** Pourcentage de la valeur totale */
    pourcentageValeur: number
  }[]

  /** Répartition par emplacement */
  emplacements: {
    /** Nom de l'emplacement */
    nom: string

    /** Nombre d'articles */
    nombreArticles: number

    /** Valeur du stock */
    valeurStock: number

    /** Taux d'occupation (%) */
    tauxOccupation: number
  }[]

  /** Mouvements récents */
  mouvements: {
    /** Nombre de mouvements aujourd'hui */
    mouvementsAujourdhui: number

    /** Nombre de mouvements cette semaine */
    mouvementsSemaine: number

    /** Nombre de mouvements ce mois */
    mouvementsMois: number

    /** Valeur des entrées ce mois */
    valeurEntreesMois: number

    /** Valeur des sorties ce mois */
    valeurSortiesMois: number
  }

  /** Alertes et notifications */
  alertes: {
    /** Articles nécessitant une commande */
    articlesACommander: number

    /** Articles périmés ou bientôt périmés */
    articlesPerimes: number

    /** Articles avec écarts d'inventaire */
    articlesAvecEcarts: number

    /** Articles sans mouvement récent */
    articlesSansMovementRecent: number
  }
}

/**
 * Interface pour les statistiques d'un article spécifique
 */
export interface IArticleStats {
  /** ID de l'article */
  articleId: string

  /** Code de l'article */
  articleCode: string

  /** Libellé de l'article */
  articleLibelle: string

  /** Statistiques de stock */
  stock: {
    /** Stock actuel */
    stockActuel: number

    /** Stock minimum */
    stockMinimum: number

    /** Stock maximum */
    stockMaximum: number

    /** Stock réservé */
    stockReserve: number

    /** Stock disponible */
    stockDisponible: number

    /** Valeur du stock */
    valeurStock: number

    /** Date du dernier inventaire */
    dernierInventaire?: Date
  }

  /** Statistiques de rotation */
  rotation: {
    /** Nombre de jours de rotation */
    joursRotation: number

    /** Classement de rotation (A, B, C) */
    classementRotation: 'A' | 'B' | 'C'

    /** Consommation moyenne mensuelle */
    consommationMoyenneMensuelle: number

    /** Consommation des 12 derniers mois */
    consommationAnnuelle: number

    /** Tendance de consommation */
    tendanceConsommation: 'HAUSSE' | 'BAISSE' | 'STABLE'
  }

  /** Historique des mouvements */
  mouvements: {
    /** Nombre total de mouvements */
    totalMouvements: number

    /** Nombre d'entrées */
    nombreEntrees: number

    /** Nombre de sorties */
    nombreSorties: number

    /** Dernière entrée */
    derniereEntree?: Date

    /** Dernière sortie */
    derniereSortie?: Date

    /** Fréquence moyenne des mouvements (jours) */
    frequenceMoyenne: number
  }

  /** Performances financières */
  finances: {
    /** Prix d'achat moyen */
    prixAchatMoyen: number

    /** Prix de vente moyen */
    prixVenteMoyen: number

    /** Marge moyenne */
    margeMoyenne: number

    /** Chiffre d'affaires généré */
    chiffreAffaires: number

    /** Rentabilité de l'article */
    rentabilite: number
  }

  /** Prévisions */
  previsions: {
    /** Consommation prévue pour le mois prochain */
    consommationPrevueMois: number

    /** Date de rupture prévue */
    dateRupturePrevue?: Date

    /** Quantité à commander recommandée */
    quantiteRecommandee: number

    /** Date de commande recommandée */
    dateCommandeRecommandee?: Date
  }
}

/**
 * Interface pour les statistiques par période
 */
export interface IInventoryPeriodStats {
  /** Période concernée */
  periode: {
    /** Date de début */
    dateDebut: Date

    /** Date de fin */
    dateFin: Date

    /** Type de période */
    type: 'JOUR' | 'SEMAINE' | 'MOIS' | 'TRIMESTRE' | 'ANNEE'
  }

  /** Évolution du stock */
  evolution: {
    /** Stock initial */
    stockInitial: number

    /** Stock final */
    stockFinal: number

    /** Variation absolue */
    variationAbsolue: number

    /** Variation en pourcentage */
    variationPourcentage: number

    /** Valeur initiale */
    valeurInitiale: number

    /** Valeur finale */
    valeurFinale: number
  }

  /** Mouvements de la période */
  mouvements: {
    /** Total des entrées */
    totalEntrees: number

    /** Total des sorties */
    totalSorties: number

    /** Nombre de mouvements */
    nombreMouvements: number

    /** Valeur des entrées */
    valeurEntrees: number

    /** Valeur des sorties */
    valeurSorties: number

    /** Rotation moyenne */
    rotationMoyenne: number
  }

  /** Comparaison avec la période précédente */
  comparaison?: {
    /** Évolution du stock (%) */
    evolutionStock: number

    /** Évolution des entrées (%) */
    evolutionEntrees: number

    /** Évolution des sorties (%) */
    evolutionSorties: number

    /** Évolution de la rotation (%) */
    evolutionRotation: number
  }
}

/**
 * Interface pour les statistiques de performance d'inventaire
 */
export interface IInventoryPerformanceStats {
  /** Indicateurs de performance clés (KPI) */
  kpi: {
    /** Taux de service (%) */
    tauxService: number

    /** Taux de rupture (%) */
    tauxRupture: number

    /** Rotation globale (fois par an) */
    rotationGlobale: number

    /** Couverture de stock (jours) */
    couvertureStock: number

    /** Précision d'inventaire (%) */
    precisionInventaire: number

    /** Obsolescence (%) */
    tauxObsolescence: number
  }

  /** Analyse ABC */
  analyseABC: {
    /** Articles de classe A */
    classeA: {
      nombre: number
      pourcentageArticles: number
      pourcentageValeur: number
      valeurMoyenne: number
    }

    /** Articles de classe B */
    classeB: {
      nombre: number
      pourcentageArticles: number
      pourcentageValeur: number
      valeurMoyenne: number
    }

    /** Articles de classe C */
    classeC: {
      nombre: number
      pourcentageArticles: number
      pourcentageValeur: number
      valeurMoyenne: number
    }
  }

  /** Analyse des écarts */
  ecarts: {
    /** Nombre d'écarts détectés */
    nombreEcarts: number

    /** Valeur totale des écarts */
    valeurEcarts: number

    /** Écart moyen */
    ecartMoyen: number

    /** Écarts par catégorie */
    ecartsParCategorie: {
      categorie: string
      nombreEcarts: number
      valeurEcarts: number
    }[]
  }

  /** Tendances et prévisions */
  tendances: {
    /** Tendance générale */
    tendanceGenerale: 'HAUSSE' | 'BAISSE' | 'STABLE'

    /** Prévision de croissance annuelle (%) */
    croissancePrevue: number

    /** Articles en croissance */
    articlesEnCroissance: number

    /** Articles en déclin */
    articlesEnDeclin: number
  }
}

/**
 * Interface pour les paramètres de calcul des statistiques
 */
export interface IInventoryStatsParams {
  /** Période de calcul */
  periode?: {
    dateDebut: Date
    dateFin: Date
  }

  /** Inclure les articles inactifs */
  inclureInactifs?: boolean

  /** Filtrer par catégories */
  categories?: string[]

  /** Filtrer par emplacements */
  emplacements?: string[]

  /** Type de calcul de rotation */
  typeRotation?: 'FIFO' | 'LIFO' | 'MOYENNE'

  /** Devise pour les calculs financiers */
  devise?: string

  /** Niveau de détail */
  niveauDetail?: 'RESUME' | 'DETAILLE' | 'COMPLET'
}