/**
 * Export des interfaces du module Partners
 */

// Interfaces des interactions avec les partenaires
export {
  ICreatePartnerInteraction,
  IPartnerInteraction,
  IPartnerInteractionFilters,
  IUpdatePartnerInteraction,
  PartnerInteractionDirection,
  PartnerInteractionPriority,
  PartnerInteractionResult,
  PartnerInteractionStatus,
  PartnerInteractionType,
} from './partner-interaction.interface'
// Interfaces des filtres de recherche de partenaires
export {
  IPartnerAggregationOptions,
  IPartnerAggregationResult,
  IPartnerPagination,
  IPartnerSearchFilters,
  IPartnerSearchResult,
  IPartnerSortOptions,
} from './partner-search-filters.interface'
// Interfaces des statistiques de partenaires
export {
  IPartnerPerformancePeriodStats,
  IPartnerStats,
  IPartnerStatsParams,
  ISpecificPartnerStats,
} from './partner-stats.interface'
