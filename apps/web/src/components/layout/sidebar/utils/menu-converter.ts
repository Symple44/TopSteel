/**
 * Menu Converter Utilities Module
 *
 * This module provides utilities for converting dynamic menu data from
 * the database into the NavItem format used by the sidebar. It handles
 * user preferences, menu item types, and icon resolution.
 *
 * @module sidebar/utils/menu-converter
 */

import { Settings } from 'lucide-react'
import { getTranslatedTitle } from '../../../../utils/menu-translations'
import { iconMap } from '../constants/icon-map'
import type { DynamicMenuItem, NavItem } from '../types'

/**
 * Convert dynamic menu items from database to NavItem format for sidebar.
 *
 * This function transforms menu items loaded from the database into the
 * NavItem structure used by the sidebar component. It handles:
 * - User customization preferences (custom titles, icons, badges, colors)
 * - Different menu item types (Program, Link, DataView, Folder)
 * - Icon name to component resolution
 * - Recursive conversion of nested children
 * - Role-based visibility
 * - Favorite and pinned status
 *
 * Menu item types determine how hrefs are generated:
 * - 'P' (Program): Uses programId as href
 * - 'L' (Link): Uses externalUrl as href
 * - 'D' (DataView): Generates query builder view URL
 * - 'M' (Folder): No href, contains children
 *
 * @param {DynamicMenuItem[]} items - Menu items from database
 * @param {Function} t - Translation function for localization
 * @returns {NavItem[]} Converted navigation items ready for rendering
 *
 * @example
 * ```tsx
 * function Sidebar() {
 *   const { t } = useTranslation()
 *   const [dynamicMenu, setDynamicMenu] = useState([])
 *
 *   useEffect(() => {
 *     fetchMenu().then(data => setDynamicMenu(data))
 *   }, [])
 *
 *   const navItems = convertDynamicToNavItem(dynamicMenu, t)
 *
 *   return (
 *     <nav>
 *       {navItems.map(item => (
 *         <NavItem key={item.href} {...item} />
 *       ))}
 *     </nav>
 *   )
 * }
 *
 * // Example conversion
 * const dbItem = {
 *   type: 'P',
 *   programId: '/dashboard',
 *   icon: 'Home',
 *   titleKey: 'nav.home',
 *   userPreferences: {
 *     customTitle: 'My Dashboard',
 *     customIcon: 'LayoutDashboard',
 *     customColor: '#3b82f6',
 *     isFavorite: true
 *   },
 *   children: []
 * }
 *
 * const navItem = convertDynamicToNavItem([dbItem], t)[0]
 * // Returns NavItem with:
 * // - title: 'My Dashboard'
 * // - href: '/dashboard'
 * // - icon: LayoutDashboard component
 * // - customIconColor: '#3b82f6'
 * // - isFavorite: true
 * ```
 */
export const convertDynamicToNavItem = (
  items: DynamicMenuItem[],
  t: (key: string) => string
): NavItem[] => {
  if (!Array.isArray(items)) {
    return []
  }

  const converted = items?.map((item: DynamicMenuItem) => {
    // Appliquer les préférences utilisateur si disponibles
    const displayTitle =
      item.userPreferences?.customTitle ||
      (item.titleKey ? t(item.titleKey) : getTranslatedTitle(item))
    const displayIcon = item.userPreferences?.customIcon || item.icon
    const displayBadge = item.userPreferences?.customBadge || item.badge

    // Générer le href basé sur le type de menu du nouveau système
    let href: string | undefined

    switch (item.type) {
      case 'P': // Programme
        href = item.programId
        break
      case 'L': // Lien externe
        href = item.externalUrl
        break
      case 'D': // Vue Data
        href = item.queryBuilderId ? `/query-builder/${item.queryBuilderId}/view` : undefined
        break
      default:
        href = item.href // Fallback pour compatibilité
        break
    }

    return {
      title: displayTitle,
      href,
      icon: displayIcon
        ? typeof displayIcon === 'string'
          ? iconMap[displayIcon] || Settings
          : displayIcon
        : Settings, // Fallback icon when displayIcon is undefined
      badge: displayBadge,
      gradient: item.gradient,
      customIconColor: item.userPreferences?.customColor, // Ajouter la couleur personnalisée
      children: item.children ? convertDynamicToNavItem(item.children, t) : undefined,
      roles: item.roles,
      // Ajouter des indicateurs visuels pour les préférences
      isFavorite: item.userPreferences?.isFavorite,
      isPinned: item.userPreferences?.isPinned,
      isCustomized: !!(
        item.userPreferences?.customTitle ||
        item.userPreferences?.customIcon ||
        item.userPreferences?.customBadge
      ),
    }
  })

  return converted
}
