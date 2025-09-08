/**
 * 📄 ARTICLES - TopSteel ERP
 * Types pour la gestion des articles
 */

import type { BaseEntity } from './base'

/**
 * Types d'articles
 */
export enum ArticleType {
  MATIERE_PREMIERE = 'MATIERE_PREMIERE',
  PRODUIT_FINI = 'PRODUIT_FINI',
  PRODUIT_SEMI_FINI = 'PRODUIT_SEMI_FINI',
  FOURNITURE = 'FOURNITURE',
  CONSOMMABLE = 'CONSOMMABLE',
  SERVICE = 'SERVICE',
}

/**
 * Statuts des articles
 */
export enum ArticleStatus {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF',
  OBSOLETE = 'OBSOLETE',
  EN_COURS_CREATION = 'EN_COURS_CREATION',
  EN_ATTENTE = 'EN_ATTENTE',
}

/**
 * Interface principale pour les articles
 */
export interface Article extends BaseEntity {
  reference: string
  designation: string
  type: ArticleType
  status: ArticleStatus
  description?: string
  famille?: string
  sousFamille?: string
  marque?: string
  modele?: string
  uniteStock: string
  uniteAchat?: string
  uniteVente?: string
  coefficientAchat: number
  coefficientVente: number
  gereEnStock: boolean
  stockPhysique?: number
  stockReserve?: number
  stockDisponible?: number
  stockMini?: number
  stockMaxi?: number
  stockSecurite?: number
  methodeValorisation: string
  prixAchatStandard?: number
  prixAchatMoyen?: number
  prixVenteHT?: number
  tauxTVA?: number
  tauxMarge?: number
  fournisseurPrincipalId?: string
  referenceFournisseur?: string
  delaiApprovisionnement?: number
  quantiteMiniCommande?: number
  quantiteMultipleCommande?: number
  poids?: number
  volume?: number
  longueur?: number
  largeur?: number
  hauteur?: number
  couleur?: string
  compteComptableAchat?: string
  compteComptableVente?: string
  compteComptableStock?: string
  codeDouanier?: string
  codeEAN?: string
  caracteristiquesTechniques?: Record<string, unknown>
  informationsLogistiques?: Record<string, unknown>
  metadonnees?: Record<string, unknown>
  dateCreationFiche?: string
  dateDerniereModification?: string
  dateDernierInventaire?: string
}

/**
 * Filtres pour les articles
 */
export interface ArticleFilters {
  page?: number
  limit?: number
  search?: string
  type?: ArticleType
  status?: ArticleStatus
  famille?: string
  marque?: string
  stockCondition?: 'rupture' | 'sous_mini' | 'normal' | 'surstock'
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * Statistiques des articles
 */
export interface ArticleStatistics {
  totalArticles: number
  repartitionParType: Record<ArticleType, number>
  repartitionParStatus: Record<ArticleStatus, number>
  repartitionParFamille: Record<string, number>
  articlesGeresEnStock: number
  valeurTotaleStock: number
  articlesEnRupture: number
  articlesSousStockMini: number
  articlesObsoletes: number
}

/**
 * DTO pour créer un article
 */
export interface CreateArticleDto {
  reference: string
  designation: string
  type: ArticleType
  status?: ArticleStatus
  description?: string
  famille?: string
  sousFamille?: string
  marque?: string
  modele?: string
  uniteStock: string
  uniteAchat?: string
  uniteVente?: string
  coefficientAchat?: number
  coefficientVente?: number
  gereEnStock?: boolean
  stockMini?: number
  stockMaxi?: number
  stockSecurite?: number
  methodeValorisation?: string
  prixAchatStandard?: number
  prixVenteHT?: number
  tauxTVA?: number
  tauxMarge?: number
  fournisseurPrincipalId?: string
  referenceFournisseur?: string
  delaiApprovisionnement?: number
  quantiteMiniCommande?: number
  quantiteMultipleCommande?: number
  poids?: number
  volume?: number
  longueur?: number
  largeur?: number
  hauteur?: number
  couleur?: string
  compteComptableAchat?: string
  compteComptableVente?: string
  compteComptableStock?: string
  codeDouanier?: string
  codeEAN?: string
  caracteristiquesTechniques?: Record<string, unknown>
  informationsLogistiques?: Record<string, unknown>
  metadonnees?: Record<string, unknown>
}

/**
 * DTO pour mettre à jour un article
 */
export interface UpdateArticleDto extends Partial<CreateArticleDto> {
  id: string
}
