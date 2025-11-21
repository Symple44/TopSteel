/**
 * Icon Utilities Module
 *
 * This module provides icon management utilities for the menu editor,
 * including icon mapping, categorization, and retrieval functions.
 * It uses Lucide React icons as the icon library.
 *
 * @module menu/utils/icon-utils
 */

import type React from 'react'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Briefcase,
  Building,
  Building2,
  Calendar,
  Check,
  CheckCircle,
  CreditCard,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileText,
  FolderOpen,
  Globe,
  Home,
  Key,
  LayoutDashboard,
  Lock,
  Mail,
  MapPin,
  Monitor,
  Package,
  Phone,
  PieChart,
  RefreshCw,
  Search,
  Settings,
  Shield,
  TrendingUp,
  Truck,
  Upload,
  User,
  Users,
  Wrench,
} from 'lucide-react'
import type { TranslationFunction } from '../../../../../lib/i18n/types'

/**
 * Map of icon names to their corresponding Lucide React icon components.
 *
 * This map provides a centralized registry of all available icons for
 * menu items. Each icon component accepts className and style props
 * for customization.
 *
 * Categories include:
 * - Navigation & Structure (Home, LayoutDashboard, etc.)
 * - Administration & Security (Shield, Users, etc.)
 * - Enterprise & Organization (Building, Globe, etc.)
 * - Data & Reports (Database, BarChart3, etc.)
 * - Production & Stock (Package, Wrench, Truck)
 * - Communication & Documents (Mail, Phone, etc.)
 * - Actions & States (Download, Upload, etc.)
 * - Finance (CreditCard)
 * - Technical (Monitor, ExternalLink, etc.)
 *
 * @type {Record<string, React.ComponentType>}
 */
export const iconMap: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  // Navigation & Structure
  Home,
  LayoutDashboard,
  FolderOpen,
  Settings,
  Search,
  Eye,

  // Administration & Sécurité
  Shield,
  Users,
  User,
  Key,
  Lock,

  // Entreprise & Organisation
  Building,
  Building2,
  Globe,
  Briefcase,

  // Données & Rapports
  Database,
  BarChart3,
  PieChart,
  Activity,
  TrendingUp,
  FileText,

  // Production & Stock
  Package,
  Wrench,
  Truck,

  // Communication & Documents
  Mail,
  Phone,
  Calendar,
  Bell,

  // Actions & États
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  RefreshCw,

  // Finance
  CreditCard,

  // Technique
  Monitor,
  ExternalLink,
  MapPin,
  Check,
}

/**
 * Get a sorted list of all available icon names.
 *
 * Returns an alphabetically sorted array of icon names that can be used
 * in menu items. Useful for populating icon selection dropdowns or
 * autocomplete fields in the menu editor.
 *
 * @returns {string[]} Sorted array of icon names
 *
 * @example
 * ```typescript
 * const iconNames = getAvailableIcons()
 * // Returns: ['Activity', 'AlertTriangle', 'BarChart3', ...]
 *
 * // Use in a dropdown
 * iconNames.map(name => (
 *   <option key={name} value={name}>{name}</option>
 * ))
 * ```
 */
export const getAvailableIcons = () => {
  return Object.keys(iconMap).sort()
}

/**
 * Get icons organized by semantic categories.
 *
 * Returns an object where keys are localized category names and values
 * are arrays of icon names belonging to that category. This is useful
 * for creating categorized icon pickers in the menu editor UI.
 *
 * Categories include:
 * - Navigation: Home, dashboard, folder, settings, etc.
 * - Security: Shield, users, authentication icons
 * - Enterprise: Building, company, business icons
 * - Data: Database, charts, reports, analytics
 * - Production: Package, tools, logistics
 * - Communication: Mail, phone, calendar
 * - Actions: Upload, download, status indicators
 * - Finance: Payment and financial icons
 *
 * @param {TranslationFunction} t - Translation function for category names
 * @returns {Record<string, string[]>} Object mapping category names to icon arrays
 *
 * @example
 * ```tsx
 * function IconPicker() {
 *   const { t } = useTranslation()
 *   const iconCategories = getIconsByCategory(t)
 *
 *   return (
 *     <div>
 *       {Object.entries(iconCategories).map(([category, icons]) => (
 *         <div key={category}>
 *           <h3>{category}</h3>
 *           <div className="icon-grid">
 *             {icons.map(iconName => (
 *               <IconButton key={iconName} iconName={iconName} />
 *             ))}
 *           </div>
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export const getIconsByCategory = (t: TranslationFunction) => {
  return {
    [t('settings.menu.iconCategories.navigation')]: [
      'Home',
      'LayoutDashboard',
      'FolderOpen',
      'Settings',
      'Search',
      'Eye',
    ],
    [t('settings.menu.iconCategories.security')]: ['Shield', 'Users', 'User', 'Key', 'Lock'],
    [t('settings.menu.iconCategories.enterprise')]: [
      'Building',
      'Building2',
      'Globe',
      'Briefcase',
    ],
    [t('settings.menu.iconCategories.data')]: [
      'Database',
      'BarChart3',
      'PieChart',
      'Activity',
      'TrendingUp',
      'FileText',
    ],
    [t('settings.menu.iconCategories.production')]: ['Package', 'Wrench', 'Truck'],
    [t('settings.menu.iconCategories.communication')]: ['Mail', 'Phone', 'Calendar', 'Bell'],
    [t('settings.menu.iconCategories.actions')]: [
      'Download',
      'Upload',
      'CheckCircle',
      'AlertTriangle',
      'RefreshCw',
    ],
    [t('settings.menu.iconCategories.finance')]: [
      'CreditCard',
      'Monitor',
      'ExternalLink',
      'MapPin',
      'Check',
    ],
  }
}

/**
 * Get the icon component for a given icon name.
 *
 * Retrieves the React component corresponding to the specified icon name.
 * If the icon name doesn't exist in the map, returns the Settings icon
 * as a fallback.
 *
 * This function is the primary way to resolve icon names to actual
 * renderable components in menu items.
 *
 * @param {string} iconName - Name of the icon to retrieve
 * @returns {React.ComponentType} Icon component that accepts className and style props
 *
 * @example
 * ```tsx
 * function MenuItem({ icon, title }) {
 *   const IconComponent = getIconComponent(icon)
 *
 *   return (
 *     <div>
 *       <IconComponent className="w-5 h-5" />
 *       <span>{title}</span>
 *     </div>
 *   )
 * }
 *
 * // With custom styling
 * const HomeIcon = getIconComponent('Home')
 * <HomeIcon style={{ color: '#3b82f6' }} className="mr-2" />
 *
 * // Fallback for unknown icon
 * const UnknownIcon = getIconComponent('NonExistent')
 * // Returns Settings icon
 * ```
 */
export const getIconComponent = (
  iconName: string
): React.ComponentType<{ className?: string; style?: React.CSSProperties }> => {
  return iconMap[iconName] || Settings
}
