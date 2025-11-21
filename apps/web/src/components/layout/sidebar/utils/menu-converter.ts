// apps/web/src/components/layout/sidebar/utils/menu-converter.ts
import { Settings } from 'lucide-react'
import { getTranslatedTitle } from '../../../../utils/menu-translations'
import { iconMap } from '../constants/icon-map'
import type { DynamicMenuItem, NavItem } from '../types'

/**
 * Convertit un menu dynamique (depuis la DB) au format NavItem
 * @param items - Liste des éléments dynamiques
 * @param t - Fonction de traduction
 * @returns Liste des éléments convertis
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
