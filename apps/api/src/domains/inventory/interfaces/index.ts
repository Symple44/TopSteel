/**
 * Export des interfaces du module Inventory
 */

// Interfaces des mouvements de stock
export {
  IStockMovement,
  IStockMovementFilters,
  IStockMovementSortOptions,
  IStockMovementPagination,
  IStockMovementPageResult,
  ICreateStockMovement,
  IUpdateStockMovement,
  StockMovementType,
  StockMovementReason,
  StockMovementStatus,
} from './stock-movement.interface'

// Interfaces des statistiques d'inventaire
export {
  IInventoryStats,
  IArticleStats,
  IInventoryPeriodStats,
  IInventoryPerformanceStats,
  IInventoryStatsParams,
} from './inventory-stats.interface'

// Interfaces des filtres de recherche d'articles
export {
  IArticleSearchFilters,
  IArticleSortOptions,
  IArticlePagination,
  IArticleAggregationOptions,
  IArticleAggregationResult,
  IArticleSearchResult,
} from './article-search-filters.interface'