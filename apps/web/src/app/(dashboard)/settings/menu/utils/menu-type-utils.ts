/**
 * Menu Type Utilities Module
 *
 * This module provides utilities for working with menu item types.
 * Menu items can be of different types (Folder, Program, Link, DataView),
 * each with its own visual representation and behavior.
 *
 * Type codes:
 * - 'M': Menu/Folder - Container for other menu items
 * - 'P': Program - Link to an application program
 * - 'L': Link - External URL link
 * - 'D': DataView - Link to a query builder data view
 *
 * @module menu/utils/menu-type-utils
 */

import type React from 'react'
import { BarChart3, ExternalLink, FolderOpen, LayoutDashboard, Settings } from 'lucide-react'
import type { TranslationFunction } from '../../../../../lib/i18n/types'

/**
 * Get the localized label for a menu item type.
 *
 * Converts a single-letter type code into a human-readable,
 * localized label. This is useful for displaying type information
 * in the UI.
 *
 * @param {string} type - Menu item type code ('M', 'P', 'L', 'D')
 * @param {TranslationFunction} t - Translation function
 * @returns {string} Localized type label
 *
 * @example
 * ```tsx
 * function MenuItemBadge({ type }) {
 *   const { t } = useTranslation()
 *   const label = getTypeLabel(type, t)
 *
 *   return <span className="badge">{label}</span>
 * }
 *
 * getTypeLabel('M', t) // Returns: "Folder"
 * getTypeLabel('P', t) // Returns: "Program"
 * getTypeLabel('L', t) // Returns: "Link"
 * getTypeLabel('D', t) // Returns: "Data View"
 * ```
 */
export const getTypeLabel = (type: string, t: TranslationFunction) => {
  switch (type) {
    case 'M':
      return t('menu.elementTypes.folder')
    case 'P':
      return t('menu.elementTypes.program')
    case 'L':
      return t('menu.elementTypes.link')
    case 'D':
      return t('menu.elementTypes.dataView')
    default:
      return type
  }
}

/**
 * Get the Tailwind CSS background color class for a menu item type.
 *
 * Returns a color-coded badge class to visually distinguish different
 * menu item types. Colors are chosen to be intuitive:
 * - Blue for folders (container)
 * - Green for programs (active/go)
 * - Purple for links (external)
 * - Orange for data views (analytics/data)
 *
 * @param {string} type - Menu item type code ('M', 'P', 'L', 'D')
 * @returns {string} Tailwind CSS background color class
 *
 * @example
 * ```tsx
 * function TypeBadge({ type, label }) {
 *   const colorClass = getTypeBadgeColor(type)
 *
 *   return (
 *     <span className={`badge ${colorClass} text-white`}>
 *       {label}
 *     </span>
 *   )
 * }
 *
 * getTypeBadgeColor('M') // Returns: 'bg-blue-500'
 * getTypeBadgeColor('P') // Returns: 'bg-green-500'
 * getTypeBadgeColor('L') // Returns: 'bg-purple-500'
 * getTypeBadgeColor('D') // Returns: 'bg-orange-500'
 * ```
 */
export const getTypeBadgeColor = (type: string) => {
  switch (type) {
    case 'M':
      return 'bg-blue-500'
    case 'P':
      return 'bg-green-500'
    case 'L':
      return 'bg-purple-500'
    case 'D':
      return 'bg-orange-500'
    default:
      return 'bg-gray-500'
  }
}

/**
 * Get the icon component for a menu item type.
 *
 * Returns the appropriate Lucide icon component based on the menu item type.
 * Icons provide visual cues about the nature of each menu item:
 * - FolderOpen for folders (can contain children)
 * - LayoutDashboard for programs (application)
 * - ExternalLink for links (opens external URL)
 * - BarChart3 for data views (query results)
 *
 * If the type is unknown, returns Settings as a fallback icon.
 *
 * @param {string} type - Menu item type code ('M', 'P', 'L', 'D')
 * @returns {React.ComponentType} Icon component that accepts className and style props
 *
 * @example
 * ```tsx
 * function MenuItemIcon({ type, customColor }) {
 *   const IconComponent = getTypeIcon(type)
 *
 *   return (
 *     <IconComponent
 *       className="w-4 h-4"
 *       style={{ color: customColor }}
 *     />
 *   )
 * }
 *
 * // Folder icon
 * const FolderIcon = getTypeIcon('M')
 * <FolderIcon className="text-blue-500" />
 *
 * // Program icon
 * const ProgramIcon = getTypeIcon('P')
 * <ProgramIcon className="text-green-500" />
 * ```
 */
export const getTypeIcon = (
  type: string
): React.ComponentType<{ className?: string; style?: React.CSSProperties }> => {
  switch (type) {
    case 'M':
      return FolderOpen
    case 'P':
      return LayoutDashboard
    case 'L':
      return ExternalLink
    case 'D':
      return BarChart3
    default:
      return Settings
  }
}
