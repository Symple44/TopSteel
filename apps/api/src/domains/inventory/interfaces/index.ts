/**
 * Export des interfaces du module Inventory
 */

// Interfaces des filtres de recherche d'articles
export type {
  IArticleAggregationOptions,
  IArticleAggregationResult,
  IArticlePagination,
  IArticleSearchFilters,
  IArticleSearchResult,
  IArticleSortOptions,
} from './article-search-filters.interface'

// Interfaces des statistiques d'inventaire
export type {
  IArticleStats,
  IInventoryPerformanceStats,
  IInventoryPeriodStats,
  IInventoryStats,
  IInventoryStatsParams,
} from './inventory-stats.interface'
// Interfaces des mouvements de stock
export {
  StockMovementReason,
  StockMovementStatus,
  StockMovementType,
} from './stock-movement.interface'
export type {
  ICreateStockMovement,
  IStockMovement,
  IStockMovementFilters,
  IStockMovementPageResult,
  IStockMovementPagination,
  IStockMovementSortOptions,
  IUpdateStockMovement,
} from './stock-movement.interface'
