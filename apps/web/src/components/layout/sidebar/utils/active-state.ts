// apps/web/src/components/layout/sidebar/utils/active-state.ts
import type { NavItem } from '../types'

/**
 * Détermine si un élément de navigation est actif
 * @param href - URL de l'élément
 * @param pathname - Pathname actuel
 * @returns true si l'élément est actif
 */
export const isActive = (href: string | undefined, pathname: string): boolean => {
  if (!href) return false

  // Correspondance exacte uniquement - pas de startsWith
  return pathname === href
}

/**
 * Détermine si un élément parent a un enfant actif
 * @param item - Élément de navigation
 * @param pathname - Pathname actuel
 * @returns true si un enfant est actif
 */
export const isParentActive = (item: NavItem, pathname: string): boolean => {
  // L'accueil (/dashboard) est traité comme un élément indépendant, pas un parent
  if (item.href === '/dashboard') return false

  if (isActive(item.href, pathname)) return true

  return item.children?.some((child) => isActive(child.href, pathname)) || false
}
