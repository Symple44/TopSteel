/**
 * @fileoverview Centralized variant mapping system for UI components
 * Provides consistent styling across the application
 */

import { type BadgeVariant, createVariantMapper } from './helpers'

// ============================================================================
// BADGE VARIANTS MAPPING
// ============================================================================

/**
 * Status types used across the application
 */
export type StatusType =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'pending'
  | 'active'
  | 'inactive'
  | 'completed'
  | 'failed'
  | 'processing'

/**
 * Map status to badge variant
 */
export const statusToBadgeVariant = createVariantMapper<StatusType>(
  {
    success: 'default',
    warning: 'secondary',
    error: 'destructive',
    info: 'outline',
    pending: 'secondary',
    active: 'default',
    inactive: 'outline',
    completed: 'default',
    failed: 'destructive',
    processing: 'secondary',
  },
  'default'
)

// ============================================================================
// DASHBOARD WIDGET VARIANTS
// ============================================================================

export type WidgetStatus = 'default' | 'secondary' | 'destructive' | 'success' | 'warning'

/**
 * Map widget status to badge variant
 */
export function mapWidgetStatusToBadge(status: WidgetStatus): BadgeVariant {
  const mapping: Record<WidgetStatus, BadgeVariant> = {
    default: 'default',
    secondary: 'secondary',
    destructive: 'destructive',
    success: 'default', // Map success to default
    warning: 'secondary', // Map warning to secondary
  }
  return mapping[status] || 'default'
}

// ============================================================================
// HAZARD LEVEL MAPPING
// ============================================================================

export type HazardLevel = 'low' | 'medium' | 'high' | 'critical'

export interface Hazard {
  id: string
  name: string
  severity: HazardLevel
  description?: string
  icon?: string
  color?: string
}

/**
 * Get the maximum hazard level from an array
 */
export function getMaxHazardLevel(hazards: Hazard[]): HazardLevel {
  if (!hazards.length) return 'low'

  const levelOrder: Record<HazardLevel, number> = {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3,
  }

  return hazards.reduce((maxLevel, hazard) => {
    return levelOrder[hazard.severity] > levelOrder[maxLevel] ? hazard.severity : maxLevel
  }, 'low' as HazardLevel)
}

/**
 * Map hazard level to badge variant
 */
export const hazardToBadgeVariant = createVariantMapper<HazardLevel>(
  {
    low: 'outline',
    medium: 'secondary',
    high: 'secondary',
    critical: 'destructive',
  },
  'default'
)

/**
 * Map hazard level to color
 */
export function hazardToColor(level: HazardLevel): string {
  const colors: Record<HazardLevel, string> = {
    low: 'text-success bg-success/10',
    medium: 'text-warning bg-warning/10',
    high: 'text-orange-600 bg-orange-50',
    critical: 'text-destructive bg-destructive/10',
  }
  return colors[level] || 'text-gray-600 bg-gray-50'
}

// ============================================================================
// MATERIAL PROPERTIES CATEGORIES
// ============================================================================

export type MaterialPropertyCategory =
  | 'mechanical'
  | 'chemical'
  | 'thermal'
  | 'physical'
  | 'electrical'

/**
 * Validate and normalize property category
 */
export function normalizeMaterialCategory(category: string): MaterialPropertyCategory {
  const normalizedCategory = category.toLowerCase().trim()
  const validCategories: MaterialPropertyCategory[] = [
    'mechanical',
    'chemical',
    'thermal',
    'physical',
    'electrical',
  ]

  return validCategories.includes(normalizedCategory as MaterialPropertyCategory)
    ? (normalizedCategory as MaterialPropertyCategory)
    : 'physical' // Default fallback
}

/**
 * Get color for material property category
 */
export function getCategoryColor(category: MaterialPropertyCategory): string {
  const colors: Record<MaterialPropertyCategory, string> = {
    mechanical: 'text-info bg-info/10 border-info/30',
    chemical: 'text-purple-700 bg-purple-50 border-purple-200',
    thermal: 'text-orange-700 bg-orange-50 border-orange-200',
    physical: 'text-success bg-success/10 border-success/30',
    electrical: 'text-warning bg-warning/10 border-warning/30',
  }
  return colors[category] || 'text-gray-700 bg-gray-50 border-gray-200'
}

/**
 * Get icon for material property category
 */
export function getCategoryIcon(category: MaterialPropertyCategory): string {
  const icons: Record<MaterialPropertyCategory, string> = {
    mechanical: 'Wrench',
    chemical: 'Flask',
    thermal: 'Thermometer',
    physical: 'Ruler',
    electrical: 'Zap',
  }
  return icons[category] || 'Info'
}

// ============================================================================
// CLIENT STATUS MAPPING
// ============================================================================

export type ClientStatusDisplay =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'suspended'
  | 'new'
  | 'vip'
  | 'blacklisted'

export type ClientStatusFilter = 'active' | 'inactive' | 'pending' | 'blocked'

/**
 * Map display status to filter status
 */
export function mapClientStatusToFilter(status: ClientStatusDisplay): ClientStatusFilter {
  const mapping: Record<ClientStatusDisplay, ClientStatusFilter> = {
    active: 'active',
    inactive: 'inactive',
    pending: 'pending',
    suspended: 'blocked',
    new: 'pending',
    vip: 'active',
    blacklisted: 'blocked',
  }
  return mapping[status] || 'inactive'
}

/**
 * Map filter status to display status
 */
export function mapFilterToClientStatus(filter: ClientStatusFilter): ClientStatusDisplay {
  const mapping: Record<ClientStatusFilter, ClientStatusDisplay> = {
    active: 'active',
    inactive: 'inactive',
    pending: 'pending',
    blocked: 'suspended',
  }
  return mapping[filter] || 'inactive'
}

// ============================================================================
// INVOICE STATUS MAPPING
// ============================================================================

export type InvoiceStatusDisplay =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'paid'
  | 'partial'
  | 'overdue'
  | 'cancelled'
  | 'refunded'

export type InvoiceStatusFilter = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled'

/**
 * Map invoice display status to filter status
 */
export function mapInvoiceStatusToFilter(status: InvoiceStatusDisplay): InvoiceStatusFilter {
  const mapping: Record<InvoiceStatusDisplay, InvoiceStatusFilter> = {
    draft: 'draft',
    sent: 'pending',
    viewed: 'pending',
    paid: 'paid',
    partial: 'pending',
    overdue: 'overdue',
    cancelled: 'cancelled',
    refunded: 'paid',
  }
  return mapping[status] || 'pending'
}

// ============================================================================
// PROJECT STATUS MAPPING
// ============================================================================

export type ProjectStatusDisplay =
  | 'planning'
  | 'active'
  | 'on_hold'
  | 'completed'
  | 'cancelled'
  | 'archived'

export type ProjectStatusFilter = 'active' | 'inactive' | 'completed' | 'archived'

/**
 * Map project display status to filter status
 */
export function mapProjectStatusToFilter(status: ProjectStatusDisplay): ProjectStatusFilter {
  const mapping: Record<ProjectStatusDisplay, ProjectStatusFilter> = {
    planning: 'active',
    active: 'active',
    on_hold: 'inactive',
    completed: 'completed',
    cancelled: 'archived',
    archived: 'archived',
  }
  return mapping[status] || 'inactive'
}

// ============================================================================
// PRIORITY LEVELS
// ============================================================================

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical'

/**
 * Map priority to badge variant
 */
export const priorityToBadgeVariant = createVariantMapper<PriorityLevel>(
  {
    low: 'outline',
    medium: 'secondary',
    high: 'default',
    critical: 'destructive',
  },
  'secondary'
)

/**
 * Map priority to color
 */
export function priorityToColor(priority: PriorityLevel): string {
  const colors: Record<PriorityLevel, string> = {
    low: 'text-gray-600 bg-gray-50',
    medium: 'text-blue-600 bg-blue-50',
    high: 'text-orange-600 bg-orange-50',
    critical: 'text-red-600 bg-red-50',
  }
  return colors[priority] || 'text-gray-600 bg-gray-50'
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

// Types are already exported inline, no need to re-export them

// ============================================================================
// EXPORT UTILITIES COLLECTION
// ============================================================================

export const VariantUtils = {
  // Status mappings
  statusToBadgeVariant,
  mapWidgetStatusToBadge,

  // Hazard mappings
  getMaxHazardLevel,
  hazardToBadgeVariant,
  hazardToColor,

  // Material categories
  normalizeMaterialCategory,
  getCategoryColor,
  getCategoryIcon,

  // Client status
  mapClientStatusToFilter,
  mapFilterToClientStatus,

  // Invoice status
  mapInvoiceStatusToFilter,

  // Project status
  mapProjectStatusToFilter,

  // Priority
  priorityToBadgeVariant,
  priorityToColor,
} as const
