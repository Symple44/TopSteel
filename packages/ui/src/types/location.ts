/**
 * @fileoverview Robust location type system with discriminated unions
 * Provides type-safe location handling for warehouse, address, and GPS locations
 */

import type { DeepPartial, DiscriminatedType, Maybe, Result } from './helpers'

// ============================================================================
// BASE LOCATION TYPES
// ============================================================================

/**
 * GPS coordinates with optional metadata
 */
export interface GPSCoordinates {
  latitude: number
  longitude: number
  accuracy?: number
  altitude?: number
  timestamp?: Date
}

/**
 * Physical address structure
 */
export interface LocationAddress {
  street: string
  city: string
  postalCode: string
  region?: string
  country: string
  additionalInfo?: string
}

/**
 * Warehouse location with detailed positioning
 */
export interface WarehouseLocation {
  warehouseId: string
  warehouseName: string
  zone?: string
  aisle?: string
  rack?: string
  shelf?: string
  bin?: string
  level?: number
  section?: string
}

// ============================================================================
// DISCRIMINATED UNION FOR LOCATION TYPES
// ============================================================================

/**
 * Location type variants
 */
export type LocationType = 'warehouse' | 'address' | 'gps' | 'hybrid'

/**
 * Base location with common fields
 */
interface BaseLocation extends DiscriminatedType<LocationType> {
  id?: string
  name?: string
  description?: string
  isDefault?: boolean
  metadata?: Record<string, unknown>
}

/**
 * Warehouse-specific location
 */
export interface WarehouseLocationValue extends BaseLocation {
  type: 'warehouse'
  warehouse: WarehouseLocation
  address?: never
  gps?: never
}

/**
 * Address-specific location
 */
export interface AddressLocationValue extends BaseLocation {
  type: 'address'
  address: LocationAddress
  warehouse?: never
  gps?: never
}

/**
 * GPS-specific location
 */
export interface GPSLocationValue extends BaseLocation {
  type: 'gps'
  gps: GPSCoordinates
  warehouse?: never
  address?: never
}

/**
 * Hybrid location with multiple data types
 */
export interface HybridLocationValue extends BaseLocation {
  type: 'hybrid'
  warehouse?: WarehouseLocation
  address?: LocationAddress
  gps?: GPSCoordinates
}

/**
 * Main location value type (discriminated union)
 */
export type LocationValue =
  | WarehouseLocationValue
  | AddressLocationValue
  | GPSLocationValue
  | HybridLocationValue

// ============================================================================
// LOCATION UPDATE TYPES
// ============================================================================

/**
 * Type for partial location updates
 */
export type LocationUpdate = DeepPartial<LocationValue>

/**
 * Type for location form data
 */
export interface LocationFormData {
  type: LocationType
  warehouse?: DeepPartial<WarehouseLocation>
  address?: DeepPartial<LocationAddress>
  gps?: DeepPartial<GPSCoordinates>
  description?: string
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if location is warehouse type
 */
export function isWarehouseLocation(location: LocationValue): location is WarehouseLocationValue {
  return location.type === 'warehouse'
}

/**
 * Check if location is address type
 */
export function isAddressLocation(location: LocationValue): location is AddressLocationValue {
  return location.type === 'address'
}

/**
 * Check if location is GPS type
 */
export function isGPSLocation(location: LocationValue): location is GPSLocationValue {
  return location.type === 'gps'
}

/**
 * Check if location is hybrid type
 */
export function isHybridLocation(location: LocationValue): location is HybridLocationValue {
  return location.type === 'hybrid'
}

/**
 * Check if location has warehouse data
 */
export function hasWarehouseData(location: LocationValue): boolean {
  return isWarehouseLocation(location) || (isHybridLocation(location) && !!location.warehouse)
}

/**
 * Check if location has address data
 */
export function hasAddressData(location: LocationValue): boolean {
  return isAddressLocation(location) || (isHybridLocation(location) && !!location.address)
}

/**
 * Check if location has GPS data
 */
export function hasGPSData(location: LocationValue): boolean {
  return isGPSLocation(location) || (isHybridLocation(location) && !!location.gps)
}

// ============================================================================
// LOCATION BUILDERS
// ============================================================================

/**
 * Create a warehouse location
 */
export function createWarehouseLocation(
  warehouse: WarehouseLocation,
  options?: Partial<Omit<BaseLocation, 'type'>>
): WarehouseLocationValue {
  return {
    ...options,
    type: 'warehouse' as const,
    warehouse,
  }
}

/**
 * Create an address location
 */
export function createAddressLocation(
  address: LocationAddress,
  options?: Partial<Omit<BaseLocation, 'type'>>
): AddressLocationValue {
  return {
    ...options,
    type: 'address' as const,
    address,
  }
}

/**
 * Create a GPS location
 */
export function createGPSLocation(
  gps: GPSCoordinates,
  options?: Partial<Omit<BaseLocation, 'type'>>
): GPSLocationValue {
  return {
    ...options,
    type: 'gps' as const,
    gps,
  }
}

/**
 * Create a hybrid location
 */
export function createHybridLocation(
  data: {
    warehouse?: WarehouseLocation
    address?: LocationAddress
    gps?: GPSCoordinates
  },
  options?: Partial<Omit<BaseLocation, 'type'>>
): HybridLocationValue {
  return {
    ...options,
    ...data,
    type: 'hybrid' as const,
  }
}

// ============================================================================
// LOCATION TRANSFORMERS
// ============================================================================

/**
 * Convert form data to location value
 */
export function formDataToLocation(formData: LocationFormData): Result<LocationValue> {
  try {
    switch (formData.type) {
      case 'warehouse':
        if (!formData.warehouse?.warehouseId || !formData.warehouse?.warehouseName) {
          return { success: false, error: new Error('Warehouse ID and name are required') }
        }
        return {
          success: true,
          data: createWarehouseLocation(formData.warehouse as WarehouseLocation, {
            description: formData.description,
          }),
        }

      case 'address':
        if (!formData.address?.street || !formData.address?.city || !formData.address?.country) {
          return { success: false, error: new Error('Street, city, and country are required') }
        }
        return {
          success: true,
          data: createAddressLocation(formData.address as LocationAddress, {
            description: formData.description,
          }),
        }

      case 'gps':
        if (formData.gps?.latitude === undefined || formData.gps?.longitude === undefined) {
          return { success: false, error: new Error('Latitude and longitude are required') }
        }
        return {
          success: true,
          data: createGPSLocation(formData.gps as GPSCoordinates, {
            description: formData.description,
          }),
        }

      case 'hybrid':
        return {
          success: true,
          data: createHybridLocation(
            {
              warehouse: formData.warehouse as WarehouseLocation | undefined,
              address: formData.address as LocationAddress | undefined,
              gps: formData.gps as GPSCoordinates | undefined,
            },
            { description: formData.description }
          ),
        }

      default:
        return { success: false, error: new Error(`Unknown location type: ${formData.type}`) }
    }
  } catch (error) {
    return { success: false, error: error as Error }
  }
}

/**
 * Convert location value to form data
 */
export function locationToFormData(location: LocationValue): LocationFormData {
  const base: LocationFormData = {
    type: location.type,
    description: location.description,
  }

  if (isWarehouseLocation(location)) {
    return { ...base, warehouse: location.warehouse }
  }

  if (isAddressLocation(location)) {
    return { ...base, address: location.address }
  }

  if (isGPSLocation(location)) {
    return { ...base, gps: location.gps }
  }

  if (isHybridLocation(location)) {
    return {
      ...base,
      warehouse: location.warehouse,
      address: location.address,
      gps: location.gps,
    }
  }

  return base
}

// ============================================================================
// LOCATION VALIDATORS
// ============================================================================

/**
 * Validate GPS coordinates
 */
export function validateGPSCoordinates(gps: Maybe<DeepPartial<GPSCoordinates>>): string[] {
  const errors: string[] = []

  if (!gps) {
    errors.push('GPS coordinates are required')
    return errors
  }

  if (gps.latitude === undefined || gps.latitude < -90 || gps.latitude > 90) {
    errors.push('Latitude must be between -90 and 90')
  }

  if (gps.longitude === undefined || gps.longitude < -180 || gps.longitude > 180) {
    errors.push('Longitude must be between -180 and 180')
  }

  if (gps.accuracy !== undefined && gps.accuracy < 0) {
    errors.push('Accuracy must be positive')
  }

  return errors
}

/**
 * Validate address
 */
export function validateAddress(address: Maybe<DeepPartial<LocationAddress>>): string[] {
  const errors: string[] = []

  if (!address) {
    errors.push('Address is required')
    return errors
  }

  if (!address.street?.trim()) {
    errors.push('Street is required')
  }

  if (!address.city?.trim()) {
    errors.push('City is required')
  }

  if (!address.postalCode?.trim()) {
    errors.push('Postal code is required')
  }

  if (!address.country?.trim()) {
    errors.push('Country is required')
  }

  return errors
}

/**
 * Validate warehouse location
 */
export function validateWarehouseLocation(
  warehouse: Maybe<DeepPartial<WarehouseLocation>>
): string[] {
  const errors: string[] = []

  if (!warehouse) {
    errors.push('Warehouse location is required')
    return errors
  }

  if (!warehouse.warehouseId?.trim()) {
    errors.push('Warehouse ID is required')
  }

  if (!warehouse.warehouseName?.trim()) {
    errors.push('Warehouse name is required')
  }

  if (warehouse.level !== undefined && warehouse.level < 0) {
    errors.push('Level must be positive')
  }

  return errors
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export const LocationUtils = {
  // Type guards
  isWarehouseLocation,
  isAddressLocation,
  isGPSLocation,
  isHybridLocation,
  hasWarehouseData,
  hasAddressData,
  hasGPSData,

  // Builders
  createWarehouseLocation,
  createAddressLocation,
  createGPSLocation,
  createHybridLocation,

  // Transformers
  formDataToLocation,
  locationToFormData,

  // Validators
  validateGPSCoordinates,
  validateAddress,
  validateWarehouseLocation,
} as const
