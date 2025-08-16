/**
 * Interface pour les statistiques globales des matériaux
 */
export interface IMaterialStats {
  /** Statistiques générales */
  global: {
    /** Nombre total de matériaux */
    totalMateriaux: number

    /** Nombre de matériaux actifs */
    materiauxActifs: number

    /** Nombre de matériaux inactifs */
    materiauxInactifs: number

    /** Nombre de matériaux obsolètes */
    materiauxObsoletes: number

    /** Valeur totale du stock matériaux */
    valeurTotaleStock: number

    /** Poids total du stock */
    poidsTotalStock: number

    /** Volume total du stock */
    volumeTotalStock: number

    /** Devise principale */
    devise: string

    /** Date de dernière mise à jour */
    derniereMiseAJour: Date
  }

  /** Répartition par type de matériau */
  parType: {
    /** Type de matériau */
    type: string

    /** Nombre de matériaux */
    nombreMateriaux: number

    /** Quantité totale */
    quantiteTotale: number

    /** Valeur totale */
    valeurTotale: number

    /** Poids total */
    poidTotal: number

    /** Pourcentage de la valeur totale */
    pourcentageValeur: number
  }[]

  /** Répartition par forme */
  parForme: {
    /** Forme du matériau */
    forme: string

    /** Nombre de matériaux */
    nombreMateriaux: number

    /** Quantité totale */
    quantiteTotale: number

    /** Valeur totale */
    valeurTotale: number

    /** Pourcentage de la valeur totale */
    pourcentageValeur: number
  }[]

  /** Répartition par nuance */
  parNuance: {
    /** Nuance du matériau */
    nuance: string

    /** Nombre de matériaux */
    nombreMateriaux: number

    /** Quantité totale */
    quantiteTotale: number

    /** Valeur totale */
    valeurTotale: number

    /** Prix moyen */
    prixMoyen: number
  }[]

  /** Statistiques de stock */
  stock: {
    /** Matériaux en rupture de stock */
    materiauxEnRupture: number

    /** Matériaux sous le stock minimum */
    materiauxSousStockMin: number

    /** Matériaux en surstock */
    materiauxEnSurstock: number

    /** Taux de disponibilité (%) */
    tauxDisponibilite: number

    /** Valeur moyenne par matériau */
    valeurMoyenneMatériau: number

    /** Rotation moyenne des stocks */
    rotationMoyenneStock: number
  }

  /** Statistiques de rotation */
  rotation: {
    /** Rotation moyenne (jours) */
    rotationMoyenne: number

    /** Matériaux à rotation rapide (< 30 jours) */
    materiauxRotationRapide: number

    /** Matériaux à rotation normale (30-90 jours) */
    materiauxRotationNormale: number

    /** Matériaux à rotation lente (> 90 jours) */
    materiauxRotationLente: number

    /** Matériaux sans mouvement (> 365 jours) */
    materiauxSansMovement: number

    /** Matériaux dormants (> 2 ans) */
    materiauxDormants: number
  }

  /** Répartition par emplacement */
  parEmplacement: {
    /** Nom de l'emplacement */
    emplacement: string

    /** Nombre de matériaux */
    nombreMateriaux: number

    /** Valeur du stock */
    valeurStock: number

    /** Poids total */
    poidsTotal: number

    /** Volume total */
    volumeTotal: number

    /** Taux d'occupation (%) */
    tauxOccupation: number
  }[]

  /** Statistiques de qualité */
  qualite: {
    /** Matériaux avec certificats */
    materiauxAvecCertificats: number

    /** Matériaux conformes aux normes */
    materiauxConformes: number

    /** Matériaux non conformes */
    materiauxNonConformes: number

    /** Taux de conformité (%) */
    tauxConformite: number

    /** Matériaux nécessitant contrôle */
    materiauxAControler: number
  }

  /** Statistiques d'approvisionnement */
  approvisionnement: {
    /** Matériaux à commander */
    materiauxACommander: number

    /** Valeur totale à commander */
    valeurTotaleACommander: number

    /** Délai moyen d'approvisionnement */
    delaiMoyenApprovisionnement: number

    /** Fournisseurs actifs */
    fournisseursActifs: number

    /** Matériaux en commande */
    materiauxEnCommande: number
  }

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

    /** Transformations ce mois */
    transformationsMois: number
  }

  /** Alertes et notifications */
  alertes: {
    /** Matériaux en rupture critique */
    ruptureCritique: number

    /** Matériaux bientôt périmés */
    bientotPerimes: number

    /** Matériaux avec défauts qualité */
    defautsQualite: number

    /** Matériaux nécessitant maintenance */
    maintenanceRequise: number

    /** Écarts d'inventaire */
    ecartsInventaire: number
  }
}

/**
 * Interface pour les statistiques d'un matériau spécifique
 */
export interface ISpecificMaterialStats {
  /** ID du matériau */
  materialId: string

  /** Code du matériau */
  materialCode: string

  /** Nom du matériau */
  materialNom: string

  /** Type et forme */
  classification: {
    type: string
    forme: string
    nuance?: string
    qualite?: string
  }

  /** Statistiques de stock */
  stock: {
    /** Stock physique actuel */
    stockPhysique: number

    /** Stock disponible */
    stockDisponible: number

    /** Stock réservé */
    stockReserve: number

    /** Stock minimum */
    stockMinimum: number

    /** Stock maximum */
    stockMaximum: number

    /** Valeur du stock */
    valeurStock: number

    /** Poids du stock */
    poidsStock: number

    /** Volume du stock */
    volumeStock: number

    /** Date du dernier inventaire */
    dernierInventaire?: Date

    /** Écart dernier inventaire */
    ecartDernierInventaire?: number
  }

  /** Statistiques de consommation */
  consommation: {
    /** Consommation moyenne mensuelle */
    consommationMoyenneMensuelle: number

    /** Consommation des 12 derniers mois */
    consommationAnnuelle: number

    /** Tendance de consommation */
    tendanceConsommation: 'HAUSSE' | 'BAISSE' | 'STABLE'

    /** Saisonnalité détectée */
    saisonnalite?: 'OUI' | 'NON'

    /** Coefficient de variation */
    coefficientVariation: number
  }

  /** Statistiques de rotation */
  rotation: {
    /** Nombre de jours de rotation */
    joursRotation: number

    /** Classification ABC */
    classificationABC: 'A' | 'B' | 'C'

    /** Fréquence des mouvements */
    frequenceMouvements: number

    /** Dernière entrée */
    derniereEntree?: Date

    /** Dernière sortie */
    derniereSortie?: Date

    /** Temps moyen en stock */
    tempsMoyenStock: number
  }

  /** Historique des mouvements */
  mouvements: {
    /** Nombre total de mouvements */
    totalMouvements: number

    /** Nombre d'entrées */
    nombreEntrees: number

    /** Nombre de sorties */
    nombreSorties: number

    /** Nombre de transformations */
    nombreTransformations: number

    /** Nombre de transferts */
    nombreTransferts: number

    /** Valeur totale des mouvements */
    valeurTotaleMouvements: number
  }

  /** Performances financières */
  finances: {
    /** Prix d'achat moyen */
    prixAchatMoyen: number

    /** Prix d'achat actuel */
    prixAchatActuel: number

    /** Évolution prix (%) */
    evolutionPrix: number

    /** Coût de stockage */
    coutStockage: number

    /** Valeur immobilisée */
    valeurImmobilisee: number

    /** Rotation financière */
    rotationFinanciere: number
  }

  /** Informations de qualité */
  qualite: {
    /** Taux de conformité (%) */
    tauxConformite: number

    /** Nombre de contrôles effectués */
    nombreControles: number

    /** Nombre de non-conformités */
    nombreNonConformites: number

    /** Derniers résultats d'essais */
    dernierEssai?: Date

    /** Certifications en cours */
    certifications: string[]
  }

  /** Informations d'approvisionnement */
  approvisionnement: {
    /** Délai moyen de livraison */
    delaiMoyenLivraison: number

    /** Fournisseur principal */
    fournisseurPrincipal?: string

    /** Nombre de fournisseurs */
    nombreFournisseurs: number

    /** Fiabilité fournisseur (%) */
    fiabiliteFournisseur: number

    /** Prochaine commande recommandée */
    prochaineCommande?: Date
  }

  /** Prévisions */
  previsions: {
    /** Consommation prévue mois prochain */
    consommationPrevueMois: number

    /** Date de rupture prévue */
    dateRupturePrevue?: Date

    /** Quantité à commander */
    quantiteACommander: number

    /** Date de commande optimale */
    dateCommandeOptimale?: Date

    /** Niveau de confiance des prévisions (%) */
    niveauConfiancePrevisions: number
  }

  /** Analyse dimensionnelle */
  dimensions: {
    /** Dimensions moyennes */
    dimensionsMoyennes?: {
      longueur?: number
      largeur?: number
      epaisseur?: number
      diametre?: number
      poids?: number
    }

    /** Variations dimensionnelles */
    variationsDimensionnelles?: {
      coefficientVariationLongueur?: number
      coefficientVariationLargeur?: number
      coefficientVariationEpaisseur?: number
    }

    /** Optimisation découpe */
    optimisationDecoupe?: {
      chutesEstimees: number
      rendementMoyen: number
    }
  }
}

/**
 * Interface pour les statistiques de performance des matériaux
 */
export interface IMaterialPerformanceStats {
  /** Indicateurs de performance clés (KPI) */
  kpi: {
    /** Taux de disponibilité (%) */
    tauxDisponibilite: number

    /** Taux de rotation global */
    tauxRotationGlobal: number

    /** Taux de rupture de stock (%) */
    tauxRuptureStock: number

    /** Couverture de stock moyenne (jours) */
    couvertureStockMoyenne: number

    /** Précision des prévisions (%) */
    precisionPrevisions: number

    /** Taux d'obsolescence (%) */
    tauxObsolescence: number

    /** Efficacité des achats (%) */
    efficaciteAchats: number
  }

  /** Analyse ABC des matériaux */
  analyseABC: {
    /** Classe A - Matériaux critiques */
    classeA: {
      nombre: number
      pourcentageArticles: number
      pourcentageValeur: number
      rotationMoyenne: number
      tauxDisponibilite: number
    }

    /** Classe B - Matériaux importants */
    classeB: {
      nombre: number
      pourcentageArticles: number
      pourcentageValeur: number
      rotationMoyenne: number
      tauxDisponibilite: number
    }

    /** Classe C - Matériaux standards */
    classeC: {
      nombre: number
      pourcentageArticles: number
      pourcentageValeur: number
      rotationMoyenne: number
      tauxDisponibilite: number
    }
  }

  /** Analyse XYZ (variabilité de la demande) */
  analyseXYZ: {
    /** Classe X - Demande stable */
    classeX: {
      nombre: number
      pourcentageArticles: number
      coefficientVariationMoyen: number
    }

    /** Classe Y - Demande variable */
    classeY: {
      nombre: number
      pourcentageArticles: number
      coefficientVariationMoyen: number
    }

    /** Classe Z - Demande irrégulière */
    classeZ: {
      nombre: number
      pourcentageArticles: number
      coefficientVariationMoyen: number
    }
  }

  /** Matrice ABC-XYZ combinée */
  matriceABCXYZ: {
    /** Combinaison classe-variabilité */
    combinaison: string // Ex: "A-X", "B-Y", etc.

    /** Nombre de matériaux */
    nombre: number

    /** Stratégie recommandée */
    strategie: string

    /** Niveau de service cible (%) */
    niveauServiceCible: number
  }[]

  /** Tendances et évolutions */
  tendances: {
    /** Évolution valeur stock (%) */
    evolutionValeurStock: number

    /** Évolution nombre matériaux (%) */
    evolutionNombreMateriaux: number

    /** Évolution rotation (%) */
    evolutionRotation: number

    /** Matériaux en croissance */
    materiauxEnCroissance: number

    /** Matériaux en déclin */
    materiauxEnDeclin: number

    /** Nouveaux matériaux introduits */
    nouveauxMateriaux: number
  }

  /** Optimisations recommandées */
  optimisations: {
    /** Matériaux à rationaliser */
    materiauxARationaliser: number

    /** Économies potentielles */
    economiesPotentielles: number

    /** Matériaux à consolider */
    materiauxAConsolider: string[]

    /** Fournisseurs à optimiser */
    fournisseursAOptimiser: string[]
  }
}

/**
 * Interface pour les paramètres de calcul des statistiques matériaux
 */
export interface IMaterialStatsParams {
  /** Période d'analyse */
  periode?: {
    dateDebut: Date
    dateFin: Date
  }

  /** Inclure les matériaux inactifs */
  inclureInactifs?: boolean

  /** Inclure les matériaux obsolètes */
  inclureObsoletes?: boolean

  /** Filtrer par types */
  types?: string[]

  /** Filtrer par formes */
  formes?: string[]

  /** Filtrer par nuances */
  nuances?: string[]

  /** Filtrer par emplacements */
  emplacements?: string[]

  /** Filtrer par fournisseurs */
  fournisseurs?: string[]

  /** Niveau de détail */
  niveauDetail?: 'RESUME' | 'DETAILLE' | 'COMPLET'

  /** Inclure les prévisions */
  inclurePrevisions?: boolean

  /** Inclure l'analyse dimensionnelle */
  inclureAnalyseDimensionnelle?: boolean

  /** Devise pour les calculs */
  devise?: string

  /** Méthode de valorisation */
  methodeValorisation?: 'FIFO' | 'LIFO' | 'CUMP' | 'STANDARD'
}