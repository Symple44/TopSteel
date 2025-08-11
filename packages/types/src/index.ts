/**
 * 📦 @erp/types - EXPORTS PRINCIPAUX
 * Types et interfaces pour l'ERP TopSteel (legacy et spécifiques app)
 */

// ===== EXPORTS MODULAIRES =====
export * from './core'
export * from './cross-cutting'
export * from './infrastructure'
// export * from './domains' // DEPRECATED: Types migrés vers @erp/domains
export * from './ui'
export * from './partners'

// ===== RE-EXPORTS ESSENTIELS =====

// Common types
export type {
  Address,
  Color,
  Contact,
  Currency,
  GenericStatus,
  Position,
  Size,
  Unit,
} from './core/common'
// Core utilities
export type {
  AnyFunction,
  ArrayElement,
  Constructor,
  DeepPartial,
  DeepRequired,
  EnumValues,
  Except,
  Indexable,
  KeysOfType,
  Merge,
  Nullable,
  Optional,
  PartialBy,
  PromiseType,
  RequiredBy,
} from './core/utilities'
// API types
export type {
  ApiResponse,
  ErrorResponse,
  PaginationMetaDto,
  PaginationResultDto,
  SuccessResponse,
} from './infrastructure/api'
// Store types (app-specific)
export type {
  AppState,
  AppStore,
  AppStoreActions,
  BaseStoreActions,
  BaseStoreState,
  InitialState,
  ProjetState,
  ProjetStore,
  ProjetStoreActions,
  StoreConfig,
  StoreCreator,
} from './infrastructure/stores'
