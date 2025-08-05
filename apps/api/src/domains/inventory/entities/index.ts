/**
 * Entités Inventory - API Principale
 * 
 * Les entités sont maintenant partagées via le package @erp/entities
 * pour éviter la duplication entre l'API principale et l'API marketplace.
 * 
 * Architecture:
 * - Package partagé: packages/erp-entities/
 * - Re-export local: pour maintenir la compatibilité des imports existants
 * - Synchronisation: les deux APIs utilisent exactement les mêmes définitions
 */

export * from './article.entity'