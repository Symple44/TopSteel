/**
 * @fileoverview Central export point for all type utilities
 * This module provides a comprehensive type system for the UI package
 */

import type React from 'react'

// ============================================================================
// LEGACY TYPES (preserved for compatibility)
// ============================================================================

export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export type ComponentVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link'
  | 'success'
  | 'warning'

export type ComponentSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ComponentWithVariant {
  variant?: ComponentVariant
}

export interface ComponentWithSize {
  size?: ComponentSize
}

// Types pour les toasts
export interface ToastProps extends BaseComponentProps {
  variant?: ComponentVariant
  duration?: number
  title?: string
  description?: string
}

// Types pour les formulaires
export interface FormFieldProps extends BaseComponentProps {
  error?: string
  label?: string
  required?: boolean
  disabled?: boolean
}

// ============================================================================
// NEW TYPE SYSTEM EXPORTS
// ============================================================================

// Re-export common types from existing files
export * from './common'
// Advanced filtering system
export * from './filters'
export { FilterUtils } from './filters'
// Core type helpers
export * from './helpers'
export { TypeHelpers } from './helpers'
// Location system with discriminated unions
export * from './location'
export { LocationUtils } from './location'
// Variant mapping system
export * from './variants'
export { VariantUtils } from './variants'

// ============================================================================
// COMPOSITE EXPORTS
// ============================================================================

import { FilterUtils } from './filters'
import { TypeHelpers } from './helpers'
import { LocationUtils } from './location'
import { VariantUtils } from './variants'

/**
 * Complete type utilities collection
 */
export const UITypes = {
  ...TypeHelpers,
  ...LocationUtils,
  ...VariantUtils,
  ...FilterUtils,
} as const

/**
 * Type guards collection
 */
export const TypeGuards = {
  isDefined: TypeHelpers.isDefined,
  isNonEmptyString: TypeHelpers.isNonEmptyString,
  isValidNumber: TypeHelpers.isValidNumber,
  hasProperty: TypeHelpers.hasProperty,
  isWarehouseLocation: LocationUtils.isWarehouseLocation,
  isAddressLocation: LocationUtils.isAddressLocation,
  isGPSLocation: LocationUtils.isGPSLocation,
  isHybridLocation: LocationUtils.isHybridLocation,
} as const

/**
 * Builders collection
 */
export const Builders = {
  createVariantMapper: TypeHelpers.createVariantMapper,
  createLoadingState: TypeHelpers.createLoadingState,
  createWarehouseLocation: LocationUtils.createWarehouseLocation,
  createAddressLocation: LocationUtils.createAddressLocation,
  createGPSLocation: LocationUtils.createGPSLocation,
  createHybridLocation: LocationUtils.createHybridLocation,
  createSimpleFilter: FilterUtils.createSimpleFilter,
  createCompoundFilter: FilterUtils.createCompoundFilter,
  createCustomFilter: FilterUtils.createCustomFilter,
} as const

/**
 * Validators collection
 */
export const Validators = {
  composeValidators: TypeHelpers.composeValidators,
  validateGPSCoordinates: LocationUtils.validateGPSCoordinates,
  validateAddress: LocationUtils.validateAddress,
  validateWarehouseLocation: LocationUtils.validateWarehouseLocation,
  validateFilterValue: FilterUtils.validateFilterValue,
} as const
