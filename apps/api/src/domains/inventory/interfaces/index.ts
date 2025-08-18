/**
 * Export des interfaces du module Inventory
 */

// Interfaces des filtres de recherche d'articles
export {
  IArticleAggregationOptions,
  IArticleAggregationResult,
  IArticlePagination,
  IArticleSearchFilters,
  IArticleSearchResult,
  IArticleSortOptions,
} from './article-search-filters.interface'

// Interfaces des statistiques d'inventaire
export {
  IArticleStats,
  IInventoryPerformanceStats,
  IInventoryPeriodStats,
  IInventoryStats,
  IInventoryStatsParams,
} from './inventory-stats.interface'
// Interfaces des mouvements de stock
export {
  ICreateStockMovement,
  IStockMovement,
  IStockMovementFilters,
  IStockMovementPageResult,
  IStockMovementPagination,
  IStockMovementSortOptions,
  IUpdateStockMovement,
  StockMovementReason,
  StockMovementStatus,
  StockMovementType,
} from './stock-movement.interface'
