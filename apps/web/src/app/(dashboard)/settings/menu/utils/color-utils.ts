import type { TranslationFunction } from '../../../../../lib/i18n/types'

export const getAvailableColors = (t: TranslationFunction) => {
  return {
    [t('settings.menu.colors.blue')]: '#3b82f6',
    [t('settings.menu.colors.green')]: '#10b981',
    [t('settings.menu.colors.orange')]: '#f97316',
    [t('settings.menu.colors.red')]: '#ef4444',
    [t('settings.menu.colors.purple')]: '#8b5cf6',
    [t('settings.menu.colors.pink')]: '#ec4899',
    [t('settings.menu.colors.yellow')]: '#eab308',
    [t('settings.menu.colors.cyan')]: '#06b6d4',
    [t('settings.menu.colors.gray')]: '#6b7280',
    [t('settings.menu.colors.slate')]: '#475569',
    [t('settings.menu.colors.zinc')]: '#52525b',
    [t('settings.menu.colors.indigo')]: '#6366f1',
    [t('settings.menu.colors.emerald')]: '#059669',
    [t('settings.menu.colors.lime')]: '#65a30d',
    [t('settings.menu.colors.amber')]: '#d97706',
  }
}

export const getColorStyle = (color?: string) => {
  if (!color) return {}
  return { color: color }
}
