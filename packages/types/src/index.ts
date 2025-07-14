/**
 * 📦 @erp/types - EXPORTS PRINCIPAUX  
 * Types et interfaces pour l'ERP TopSteel (legacy et spécifiques app)
 */

// ===== EXPORTS MODULAIRES =====
export * from './core'
export * from './infrastructure'
// export * from './domains' // DEPRECATED: Types migrés vers @erp/domains
export * from './ui'
export * from './cross-cutting'

// ===== RE-EXPORTS ESSENTIELS =====

// Core utilities
export type {
  DeepPartial,
  DeepRequired,
  KeysOfType,
  Except,
  Merge,
  PartialBy,
  RequiredBy,
  Indexable,
  AnyFunction,
  Constructor,
  EnumValues,
  PromiseType,
  ArrayElement,
  Nullable,
  Optional
} from './core/utilities'

// Common types
export type {
  Address,
  Contact,
  Currency,
  Unit,
  Color,
  Size,
  Position,
  GenericStatus
} from './core/common'

// Store types (app-specific)
export type {
  BaseStoreState,
  BaseStoreActions,
  InitialState,
  StoreConfig,
  StoreCreator,
  AppStore,
  AppState,
  AppStoreActions,
  ProjetStore,
  ProjetState,
  ProjetStoreActions
} from './infrastructure/stores'

// API types
export type {
  ApiResponse,
  PaginationMetaDto,
  PaginationResultDto,
  ErrorResponse,
  SuccessResponse
} from './infrastructure/api'
