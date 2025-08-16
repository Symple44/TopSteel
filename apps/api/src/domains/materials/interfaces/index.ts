/**
 * Export des interfaces du module Materials
 */

// Interfaces des mouvements de matériaux
export {
  IMaterialMovement,
  IMaterialMovementFilters,
  IMaterialMovementSortOptions,
  ICreateMaterialMovement,
  IMaterialTraceabilityInfo,
  IMaterialTransformationInfo,
  MaterialMovementType,
  MaterialMovementReason,
  MaterialMovementStatus,
  MaterialMovementPriority,
} from './material-movement.interface'

// Interfaces des statistiques de matériaux
export {
  IMaterialStats,
  ISpecificMaterialStats,
  IMaterialPerformanceStats,
  IMaterialStatsParams,
} from './material-stats.interface'

// Interfaces des filtres de recherche de matériaux
export {
  IMaterialSearchFilters,
  IMaterialSortOptions,
  IMaterialPagination,
  IMaterialAggregationOptions,
  IMaterialSearchResult,
} from './material-search-filters.interface'