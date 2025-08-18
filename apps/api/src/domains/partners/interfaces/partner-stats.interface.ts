/**
 * Interface pour les statistiques globales des partenaires
 */
export interface IPartnerStats {
  /** Statistiques générales */
  global: {
    /** Nombre total de partenaires */
    totalPartenaires: number

    /** Partenaires actifs */
    partenairesActifs: number

    /** Partenaires inactifs */
    partenairesInactifs: number

    /** Nouveaux partenaires ce mois */
    nouveauxPartenairesMois: number

    /** Montant d'affaires total */
    montantAffairesTotal: number

    /** Montant d'affaires moyen par partenaire */
    montantAffairesMoyen: number

    /** Devise principale */
    devise: string

    /** Date de dernière mise à jour */
    derniereMiseAJour: Date
  }

  /** Répartition par type de partenaire */
  parType: {
    /** Type de partenaire */
    type: string

    /** Nombre de partenaires */
    nombrePartenaires: number

    /** Pourcentage du total */
    pourcentageTotal: number

    /** Montant d'affaires */
    montantAffaires: number

    /** Pourcentage du CA */
    pourcentageCA: number

    /** Nombre moyen de commandes */
    nombreMoyenCommandes: number
  }[]

  /** Répartition géographique */
  repartitionGeographique: {
    /** Pays */
    pays: string

    /** Nombre de partenaires */
    nombrePartenaires: number

    /** Pourcentage du total */
    pourcentageTotal: number

    /** Montant d'affaires */
    montantAffaires: number

    /** Régions principales */
    regions: {
      region: string
      nombrePartenaires: number
      montantAffaires: number
    }[]
  }[]

  /** Répartition par secteur d'activité */
  parSecteurActivite: {
    /** Secteur d'activité */
    secteur: string

    /** Nombre de partenaires */
    nombrePartenaires: number

    /** Montant d'affaires */
    montantAffaires: number

    /** Croissance annuelle (%) */
    croissanceAnnuelle: number

    /** Sous-secteurs */
    sousSecteurs: {
      sousSecteur: string
      nombrePartenaires: number
      montantAffaires: number
    }[]
  }[]

  /** Classification ABC */
  classificationABC: {
    /** Classe A - Partenaires stratégiques */
    classeA: {
      nombre: number
      pourcentagePartenaires: number
      pourcentageCA: number
      montantAffairesMoyen: number
      frequenceCommandeMoyenne: number
    }

    /** Classe B - Partenaires importants */
    classeB: {
      nombre: number
      pourcentagePartenaires: number
      pourcentageCA: number
      montantAffairesMoyen: number
      frequenceCommandeMoyenne: number
    }

    /** Classe C - Partenaires standards */
    classeC: {
      nombre: number
      pourcentagePartenaires: number
      pourcentageCA: number
      montantAffairesMoyen: number
      frequenceCommandeMoyenne: number
    }
  }

  /** Statistiques de performance */
  performance: {
    /** Note moyenne globale */
    noteMoyenneGlobale: number

    /** Note moyenne qualité */
    noteMoyenneQualite: number

    /** Note moyenne délai */
    noteMoyenneDelai: number

    /** Note moyenne service */
    noteMoyenneService: number

    /** Taux de satisfaction global (%) */
    tauxSatisfactionGlobal: number

    /** Partenaires excellents (note > 4.5) */
    partenairesExcellents: number

    /** Partenaires à améliorer (note < 3.0) */
    partenairesAAmeliorer: number
  }

  /** Statistiques de relation commerciale */
  relationCommerciale: {
    /** Durée moyenne de partenariat (mois) */
    dureeMoyennePartenariat: number

    /** Taux de fidélité (%) */
    tauxFidelite: number

    /** Fréquence moyenne de commande (jours) */
    frequenceMoyenneCommande: number

    /** Montant moyen par commande */
    montantMoyenCommande: number

    /** Taux de croissance des affaires (%) */
    tauxCroissanceAffaires: number

    /** Partenaires avec contrat cadre */
    partenairesContratCadre: number
  }

  /** Statistiques de risque */
  risque: {
    /** Répartition par niveau de risque */
    repartitionNiveauRisque: {
      niveau: 'FAIBLE' | 'MOYEN' | 'ELEVE' | 'CRITIQUE'
      nombre: number
      pourcentage: number
      montantAffaires: number
    }[]

    /** Partenaires à surveiller */
    partenairesASurveiller: number

    /** Incidents récents */
    incidentsRecents: number

    /** Taux de solvabilité moyen */
    tauxSolvabiliteMoyen: number
  }

  /** Activité récente */
  activiteRecente: {
    /** Commandes cette semaine */
    commandesSemaine: number

    /** Commandes ce mois */
    commandesMois: number

    /** Livraisons cette semaine */
    livraisonsSemaine: number

    /** Livraisons ce mois */
    livraisonsMois: number

    /** Nouveaux contacts cette semaine */
    nouveauxContactsSemaine: number

    /** Interactions cette semaine */
    interactionsSemaine: number
  }

  /** Certifications et qualité */
  certificationsQualite: {
    /** Partenaires certifiés ISO */
    partenairesCertifiesISO: number

    /** Partenaires avec certification qualité */
    partenairesAvecCertificationQualite: number

    /** Audits qualité réalisés ce mois */
    auditsQualiteMois: number

    /** Taux de conformité global (%) */
    tauxConformiteGlobal: number

    /** Actions correctives en cours */
    actionsCorrectives: number
  }

  /** Top performers */
  topPerformers: {
    /** Top 10 par CA */
    topCA: {
      partnerId: string
      partnerCode: string
      partnerNom: string
      montantAffaires: number
      croissance: number
    }[]

    /** Top 10 par performance */
    topPerformance: {
      partnerId: string
      partnerCode: string
      partnerNom: string
      noteGlobale: number
      nombreCommandes: number
    }[]

    /** Top 10 par fidélité */
    topFidelite: {
      partnerId: string
      partnerCode: string
      partnerNom: string
      dureePartenariatMois: number
      frequenceCommande: number
    }[]
  }

  /** Alertes et notifications */
  alertes: {
    /** Partenaires sans activité récente */
    partenairesSansActivite: number

    /** Contrats arrivant à échéance */
    contratsEcheance: number

    /** Partenaires avec retard de paiement */
    partenairesRetardPaiement: number

    /** Certifications expirant bientôt */
    certificationsExpirant: number

    /** Partenaires nécessitant audit */
    partenairesNecessitantAudit: number
  }
}

/**
 * Interface pour les statistiques d'un partenaire spécifique
 */
export interface ISpecificPartnerStats {
  /** Informations du partenaire */
  partenaire: {
    id: string
    code: string
    raisonSociale: string
    nomCommercial?: string
    type: string
    statut: string
  }

  /** Statistiques commerciales */
  commercial: {
    /** Montant d'affaires total */
    montantAffairesTotal: number

    /** Montant d'affaires cette année */
    montantAffairesAnnee: number

    /** Montant d'affaires mois dernier */
    montantAffairesMoisDernier: number

    /** Évolution mensuelle (%) */
    evolutionMensuelle: number

    /** Évolution annuelle (%) */
    evolutionAnnuelle: number

    /** Nombre total de commandes */
    nombreTotalCommandes: number

    /** Nombre de commandes cette année */
    nombreCommandesAnnee: number

    /** Montant moyen par commande */
    montantMoyenCommande: number

    /** Fréquence de commande (jours) */
    frequenceCommande: number

    /** Dernière commande */
    derniereCommande?: Date

    /** Prochaine commande prévue */
    prochaineCommandePrevue?: Date
  }

  /** Statistiques de performance */
  performance: {
    /** Note globale */
    noteGlobale: number

    /** Note qualité */
    noteQualite: number

    /** Note délai */
    noteDelai: number

    /** Note service */
    noteService: number

    /** Évolution des notes (6 derniers mois) */
    evolutionNotes: {
      mois: string
      noteGlobale: number
      noteQualite: number
      noteDelai: number
      noteService: number
    }[]

    /** Taux de conformité (%) */
    tauxConformite: number

    /** Nombre de réclamations */
    nombreReclamations: number

    /** Taux de réclamation (%) */
    tauxReclamation: number

    /** Temps de résolution moyen (jours) */
    tempsResolutionMoyen: number
  }

  /** Historique des interactions */
  interactions: {
    /** Nombre total d'interactions */
    nombreTotalInteractions: number

    /** Interactions cette année */
    interactionsAnnee: number

    /** Dernière interaction */
    derniereInteraction?: Date

    /** Types d'interactions */
    typesInteractions: {
      type: string
      nombre: number
      derniere?: Date
    }[]

    /** Interactions par mois (12 derniers mois) */
    interactionsParMois: {
      mois: string
      nombre: number
    }[]
  }

  /** Informations financières */
  financier: {
    /** Limite de crédit */
    limiteCredit: number

    /** Crédit utilisé */
    creditUtilise: number

    /** Crédit disponible */
    creditDisponible: number

    /** Délai de paiement moyen (jours) */
    delaiPaiementMoyen: number

    /** Retards de paiement */
    retardsPaiement: number

    /** Montant en retard */
    montantEnRetard: number

    /** Score de solvabilité */
    scoreSolvabilite: number

    /** Conditions de paiement */
    conditionsPaiement: string

    /** Mode de paiement préféré */
    modePaiementPrefere: string
  }

  /** Logistique et livraisons */
  logistique: {
    /** Nombre total de livraisons */
    nombreTotalLivraisons: number

    /** Livraisons cette année */
    livraisonsAnnee: number

    /** Délai de livraison moyen (jours) */
    delaiLivraisonMoyen: number

    /** Taux de livraison à temps (%) */
    tauxLivraisonTemps: number

    /** Dernière livraison */
    derniereLivraison?: Date

    /** Incidents de livraison */
    incidentsLivraison: number

    /** Moyens de transport utilisés */
    moyensTransport: string[]

    /** Zones de livraison couvertes */
    zonesLivraison: string[]
  }

  /** Qualité et certifications */
  qualite: {
    /** Certifications détenues */
    certifications: {
      nom: string
      dateObtention?: Date
      dateExpiration?: Date
      statut: 'VALIDE' | 'EXPIRE' | 'EN_COURS' | 'SUSPENDU'
    }[]

    /** Audits réalisés */
    audits: {
      date: Date
      type: string
      resultat: 'EXCELLENT' | 'BON' | 'SATISFAISANT' | 'INSUFFISANT'
      actions?: string[]
    }[]

    /** Dernier audit */
    dernierAudit?: Date

    /** Prochain audit prévu */
    prochainAudit?: Date

    /** Actions correctives en cours */
    actionsCorrectives: number

    /** Système qualité */
    systemeQualite?: string
  }

  /** Capacités et services */
  capacites: {
    /** Capacités métier */
    capacitesMetier: string[]

    /** Technologies maîtrisées */
    technologies: string[]

    /** Services proposés */
    servicesProposés: string[]

    /** Équipements disponibles */
    equipements: string[]

    /** Capacité de production */
    capaciteProduction?: number

    /** Disponibilité (%) */
    disponibilite: number

    /** Délai de réaction (heures) */
    delaiReaction: number
  }

  /** Analyse comparative */
  comparatif: {
    /** Position dans le classement général */
    positionClassement: number

    /** Total partenaires dans la catégorie */
    totalPartenairesCategorie: number

    /** Percentile performance */
    percentilePerformance: number

    /** Comparaison avec la moyenne du secteur */
    comparaisonSecteur: {
      noteGlobale: 'SUPERIEURE' | 'MOYENNE' | 'INFERIEURE'
      montantAffaires: 'SUPERIEUR' | 'MOYEN' | 'INFERIEUR'
      delaiLivraison: 'MEILLEUR' | 'MOYEN' | 'MOINS_BON'
      tauxConformite: 'SUPERIEUR' | 'MOYEN' | 'INFERIEUR'
    }
  }

  /** Prévisions et tendances */
  previsions: {
    /** Montant d'affaires prévu mois prochain */
    montantAffairesPrevuMois: number

    /** Nombre de commandes prévu */
    nombreCommandesPrevues: number

    /** Tendance générale */
    tendanceGenerale: 'HAUSSE' | 'BAISSE' | 'STABLE'

    /** Confiance des prévisions (%) */
    confiancePrevisions: number

    /** Facteurs de risque */
    facteursRisque: string[]

    /** Opportunités identifiées */
    opportunites: string[]
  }

  /** Recommandations */
  recommandations: {
    /** Actions prioritaires */
    actionsPrioritaires: string[]

    /** Améliorations suggérées */
    ameliorationsSuggerees: string[]

    /** Opportunités de développement */
    opportunitesDeveloppement: string[]

    /** Points de vigilance */
    pointsVigilance: string[]
  }
}

/**
 * Interface pour les statistiques de performance par période
 */
export interface IPartnerPerformancePeriodStats {
  /** Période concernée */
  periode: {
    dateDebut: Date
    dateFin: Date
    type: 'SEMAINE' | 'MOIS' | 'TRIMESTRE' | 'SEMESTRE' | 'ANNEE'
  }

  /** Évolutions des indicateurs */
  evolutions: {
    /** Évolution du nombre de partenaires */
    nombrePartenaires: {
      debut: number
      fin: number
      variation: number
      variationPourcentage: number
    }

    /** Évolution du montant d'affaires */
    montantAffaires: {
      debut: number
      fin: number
      variation: number
      variationPourcentage: number
    }

    /** Évolution de la performance moyenne */
    performanceMoyenne: {
      debut: number
      fin: number
      variation: number
    }

    /** Évolution du nombre de commandes */
    nombreCommandes: {
      debut: number
      fin: number
      variation: number
      variationPourcentage: number
    }
  }

  /** Comparaison avec la période précédente */
  comparaisonPeriodePrecedente: {
    /** Variation du CA (%) */
    variationCA: number

    /** Variation du nombre de commandes (%) */
    variationCommandes: number

    /** Variation de la performance (%) */
    variationPerformance: number

    /** Nouveaux partenaires */
    nouveauxPartenaires: number

    /** Partenaires perdus */
    partenairesObsoletes: number
  }

  /** Tendances identifiées */
  tendances: {
    /** Tendance générale du CA */
    tendanceCA: 'HAUSSE' | 'BAISSE' | 'STABLE'

    /** Tendance performance */
    tendancePerformance: 'AMELIORATION' | 'DETERIORATION' | 'STABLE'

    /** Secteurs en croissance */
    secteursEnCroissance: string[]

    /** Secteurs en déclin */
    secteursEnDeclin: string[]

    /** Régions performantes */
    regionsPerformantes: string[]
  }
}

/**
 * Interface pour les paramètres de calcul des statistiques partenaires
 */
export interface IPartnerStatsParams {
  /** Période d'analyse */
  periode?: {
    dateDebut: Date
    dateFin: Date
  }

  /** Inclure les partenaires inactifs */
  inclureInactifs?: boolean

  /** Filtrer par types de partenaires */
  typesPartenaires?: string[]

  /** Filtrer par régions */
  regions?: string[]

  /** Filtrer par secteurs d'activité */
  secteursActivite?: string[]

  /** Inclure les statistiques de performance */
  inclurePerformance?: boolean

  /** Inclure les prévisions */
  inclurePrevisions?: boolean

  /** Inclure l'analyse comparative */
  inclureComparatif?: boolean

  /** Niveau de détail */
  niveauDetail?: 'RESUME' | 'DETAILLE' | 'COMPLET'

  /** Devise pour les calculs financiers */
  devise?: string

  /** Seuils pour la classification ABC */
  seuilsABC?: {
    seuilA: number // Pourcentage du CA pour la classe A
    seuilB: number // Pourcentage du CA pour la classe B
  }
}
