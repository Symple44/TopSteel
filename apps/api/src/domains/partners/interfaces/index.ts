/**
 * Export des interfaces du module Partners
 */

// Interfaces des filtres de recherche de partenaires
export {
  IPartnerSearchFilters,
  IPartnerSortOptions,
  IPartnerPagination,
  IPartnerAggregationOptions,
  IPartnerAggregationResult,
  IPartnerSearchResult,
} from './partner-search-filters.interface'

// Interfaces des statistiques de partenaires
export {
  IPartnerStats,
  ISpecificPartnerStats,
  IPartnerPerformancePeriodStats,
  IPartnerStatsParams,
} from './partner-stats.interface'

// Interfaces des interactions avec les partenaires
export {
  IPartnerInteraction,
  IPartnerInteractionFilters,
  ICreatePartnerInteraction,
  IUpdatePartnerInteraction,
  PartnerInteractionType,
  PartnerInteractionStatus,
  PartnerInteractionPriority,
  PartnerInteractionDirection,
  PartnerInteractionResult,
} from './partner-interaction.interface'