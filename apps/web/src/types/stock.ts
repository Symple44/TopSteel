// ✅ TYPES STOCK MODERNES - VERSION ÉVOLUÉE

/**
 * Interface pour les statistiques de mouvements
 * Version moderne avec support ISO dates et métadonnées
 */
export interface MouvementStats {
  /** Date au format ISO string pour compatibilité JSON/API */
  date: string
  /** Nom lisible de la période */
  name: string
  /** Nombre d'entrées */
  entrees: number
  /** Nombre de sorties */
  sorties: number
  /** Nombre de transferts */
  transferts: number
  /** Valeur totale des entrées en euros */
  valeurEntrees: number
  /** Valeur totale des sorties en euros */
  valeurSorties: number
  /** Métadonnées optionnelles pour extensions futures */
  metadata?: Record<string, unknown>
}

/**
 * Interface pour un mouvement individuel
 * Version évoluée avec traçabilité et audit
 */
export interface Mouvement {
  /** Identifiant unique */
  id: string
  /** Type de mouvement */
  type: 'ENTREE' | 'SORTIE' | 'TRANSFERT' | 'AJUSTEMENT' | 'RETOUR'
  /** Date au format ISO */
  date: string
  /** Quantité (peut être négative pour ajustements) */
  quantite: number
  /** Valeur unitaire en euros */
  valeurUnitaire: number
  /** Valeur totale calculée */
  valeurTotale: number
  /** Référence de l'article */
  reference: string
  /** Description optionnelle */
  description?: string
  /** Utilisateur responsable du mouvement */
  userId?: string
  /** Numéro de document associé (commande, facture, etc.) */
  documentRef?: string
  /** Statut du mouvement */
  statut: 'VALIDE' | 'PENDING' | 'ANNULE'
  /** Données d'audit */
  audit: {
    createdAt: string
    createdBy: string
    updatedAt?: string
    updatedBy?: string
  }
}

/**
 * Interface pour l'état du stock
 * Version moderne avec alertes et optimisations
 */
export interface Stock {
  /** Identifiant unique */
  id: string
  /** Référence de l'article */
  reference: string
  /** Nom de l'article */
  nom: string
  /** Description détaillée */
  description?: string
  /** Quantité actuelle en stock */
  quantite: number
  /** Quantité minimum (seuil d'alerte) */
  quantiteMin: number
  /** Quantité maximum recommandée */
  quantiteMax?: number
  /** Quantité réservée (non disponible) */
  quantiteReservee: number
  /** Quantité disponible (calculée) */
  quantiteDisponible: number
  /** Unité de mesure */
  unite: string
  /** Valeur unitaire actuelle */
  valeurUnitaire: number
  /** Valeur totale du stock */
  valeurTotale: number
  /** Emplacement de stockage */
  emplacement?: string
  /** Code-barres ou QR code */
  codeBarres?: string
  /** Catégorie de l'article */
  categorie?: string
  /** Dernière date de mouvement */
  dernierMouvement?: string
  /** Statut de l'article */
  statut: 'ACTIF' | 'OBSOLETE' | 'SUSPENDU'
  /** Niveau d'alerte calculé */
  niveauAlerte: 'OK' | 'BAS' | 'CRITIQUE' | 'RUPTURE'
  /** Données d'audit */
  audit: {
    createdAt: string
    updatedAt: string
  }
}




