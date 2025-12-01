/**
 * Data Adapter System
 * Exports all adapters, types, and utilities for data abstraction
 */

// Types
export type {
  DataAdapter,
  DataQuery,
  DataResponse,
  FilterValue,
  SortQuery,
  AdapterConfig,
  RestAdapterConfig,
  GraphQLAdapterConfig,
  SupabaseAdapterConfig,
  LocalAdapterConfig,
} from './types'

export {
  AdapterError,
  NetworkError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
} from './types'

// Adapters
export { LocalAdapter } from './LocalAdapter'
export { RestAdapter } from './RestAdapter'
export { GraphQLAdapter } from './GraphQLAdapter'
export { SupabaseAdapter } from './SupabaseAdapter'

// Hooks
export { useDataAdapter } from './useDataAdapter'
export type { default as UseDataAdapterReturn } from './useDataAdapter'
