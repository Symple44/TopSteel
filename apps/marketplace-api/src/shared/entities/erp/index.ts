/**
 * Entités ERP - API Marketplace
 * 
 * Les entités sont maintenant partagées via le package @erp/entities
 * pour éviter la duplication entre l'API marketplace et l'API principale.
 * 
 * Architecture:
 * - Package partagé: packages/erp-entities/
 * - Re-export local: pour maintenir la compatibilité des imports existants
 * - Synchronisation: les deux APIs utilisent exactement les mêmes définitions
 * 
 * Entités disponibles:
 * - Article: Gestion des articles avec marketplace settings
 * - Societe: Gestion des sociétés avec configuration marketplace
 */

export * from './article.entity'
export * from './societe.entity'