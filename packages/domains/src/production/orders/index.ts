/**
 * 🏭 ORDERS - DOMAINE PRODUCTION
 * Exports pour les ordres de fabrication
 */

// ===== ENTITÉS ET TYPES =====
export type {
  ControleQualite,
  MaterialOrder,
  MaterialRequirement,
  Operation,
  OrdreFabrication,
  ProductionFilters,
  ProductionSchedule,
  ProductionStats,
  QualityRequirements,
} from './domain/entities'
// ===== ENUMS =====
// ===== ALIASES ANGLAIS POUR COMPATIBILITÉ =====
export {
  MaterialStatus,
  OperationStatut,
  OrdrePriorite,
  OrdreStatut,
  PrioriteProduction,
  PrioriteProduction as ProductionPriority,
  QualiteStatut,
  StatutProduction,
  StatutProduction as ProductionStatus,
  TypeOperation,
} from './domain/entities'
