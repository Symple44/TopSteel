import { translator } from '@/lib/i18n/translator'

export interface TranslatableMenuItem {
  title: string
  customTitle?: string
  titleTranslations?: Record<string, string>
}

/**
 * Obtient le titre traduit d'un élément de menu selon la langue courante
 * Priorité : traduction courante > customTitle > title par défaut
 */
export function getTranslatedTitle(item: TranslatableMenuItem): string {
  const currentLanguage = translator?.getCurrentLanguage()

  // 1. Vérifier s'il y a une traduction pour la langue courante
  if (item.titleTranslations?.[currentLanguage]) {
    return item.titleTranslations[currentLanguage]
  }

  // 2. Utiliser le titre personnalisé si disponible
  if (item.customTitle?.trim()) {
    return item.customTitle
  }

  // 3. Utiliser le titre par défaut
  return item.title
}

/**
 * Vérifie si un élément de menu a des traductions disponibles
 */
export function hasTranslations(item: TranslatableMenuItem): boolean {
  return !!(item.titleTranslations && Object.keys(item.titleTranslations).length > 0)
}

/**
 * Obtient toutes les traductions disponibles pour un élément
 */
export function getAvailableTranslations(item: TranslatableMenuItem): Record<string, string> {
  return item.titleTranslations || {}
}

/**
 * Met à jour les traductions d'un élément de menu
 */
export function updateItemTranslations(
  item: TranslatableMenuItem,
  translations: Record<string, string>
): TranslatableMenuItem {
  return {
    ...item,
    titleTranslations: translations,
  }
}
