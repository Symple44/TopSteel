/**
 * Export des interfaces du module Materials
 */

// Interfaces des mouvements de matériaux
export {
  ICreateMaterialMovement,
  IMaterialMovement,
  IMaterialMovementFilters,
  IMaterialMovementSortOptions,
  IMaterialTraceabilityInfo,
  IMaterialTransformationInfo,
  MaterialMovementPriority,
  MaterialMovementReason,
  MaterialMovementStatus,
  MaterialMovementType,
} from './material-movement.interface'
// Interfaces des filtres de recherche de matériaux
export {
  IMaterialAggregationOptions,
  IMaterialPagination,
  IMaterialSearchFilters,
  IMaterialSearchResult,
  IMaterialSortOptions,
} from './material-search-filters.interface'
// Interfaces des statistiques de matériaux
export {
  IMaterialPerformanceStats,
  IMaterialStats,
  IMaterialStatsParams,
  ISpecificMaterialStats,
} from './material-stats.interface'
