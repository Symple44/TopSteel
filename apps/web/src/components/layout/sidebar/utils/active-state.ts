/**
 * Active State Utilities Module
 *
 * This module provides utilities for determining active navigation states
 * in the sidebar. It handles both direct route matching and parent-child
 * relationships for nested navigation items.
 *
 * @module sidebar/utils/active-state
 */

import type { NavItem } from '../types'

/**
 * Determine if a navigation item is currently active.
 *
 * Uses exact pathname matching to determine if a navigation item should
 * be highlighted as active. This avoids false positives from prefix matching
 * (e.g., '/dashboard' wouldn't match '/dashboard/settings').
 *
 * @param {string | undefined} href - URL of the navigation item
 * @param {string} pathname - Current pathname from router
 * @returns {boolean} True if the item is active, false otherwise
 *
 * @example
 * ```typescript
 * const pathname = '/dashboard/settings'
 *
 * isActive('/dashboard/settings', pathname)  // true - exact match
 * isActive('/dashboard', pathname)           // false - not exact match
 * isActive(undefined, pathname)              // false - no href
 *
 * // Use in navigation component
 * function NavLink({ href, title }) {
 *   const pathname = usePathname()
 *   const active = isActive(href, pathname)
 *
 *   return (
 *     <a
 *       href={href}
 *       className={active ? 'text-blue-600' : 'text-gray-600'}
 *     >
 *       {title}
 *     </a>
 *   )
 * }
 * ```
 */
export const isActive = (href: string | undefined, pathname: string): boolean => {
  if (!href) return false

  // Exact match only - no prefix matching (startsWith)
  return pathname === href
}

/**
 * Determine if a parent navigation item has an active child.
 *
 * Checks if any of the item's children are active, which is useful for
 * highlighting parent items and keeping folders expanded when a child
 * route is active.
 *
 * Special case: The dashboard home (/dashboard) is treated as an independent
 * item, not a parent, even if other routes start with '/dashboard'.
 *
 * @param {NavItem} item - Navigation item to check (with potential children)
 * @param {string} pathname - Current pathname from router
 * @returns {boolean} True if item or any child is active
 *
 * @example
 * ```typescript
 * const settingsItem = {
 *   title: 'Settings',
 *   href: '/dashboard/settings',
 *   children: [
 *     { title: 'Profile', href: '/dashboard/settings/profile' },
 *     { title: 'Security', href: '/dashboard/settings/security' }
 *   ]
 * }
 *
 * const pathname = '/dashboard/settings/profile'
 *
 * isParentActive(settingsItem, pathname)  // true - child is active
 *
 * // Use in collapsible menu
 * function MenuFolder({ item }) {
 *   const pathname = usePathname()
 *   const isExpanded = isParentActive(item, pathname)
 *
 *   return (
 *     <div>
 *       <button
 *         className={isExpanded ? 'font-bold' : 'font-normal'}
 *       >
 *         {item.title}
 *       </button>
 *       {isExpanded && (
 *         <ul>
 *           {item.children.map(child => <MenuItem {...child} />)}
 *         </ul>
 *       )}
 *     </div>
 *   )
 * }
 *
 * // Dashboard home is special-cased
 * const dashboardItem = { href: '/dashboard' }
 * isParentActive(dashboardItem, '/dashboard/settings')  // false
 * ```
 */
export const isParentActive = (item: NavItem, pathname: string): boolean => {
  // Dashboard home (/dashboard) is treated as an independent item, not a parent
  if (item.href === '/dashboard') return false

  if (isActive(item.href, pathname)) return true

  return item.children?.some((child) => isActive(child.href, pathname)) || false
}
