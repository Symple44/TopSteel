/**
 * Color Utilities Module
 *
 * This module provides color management utilities for the menu editor,
 * including predefined color palettes and color styling helpers.
 * Colors are based on Tailwind CSS color scheme.
 *
 * @module menu/utils/color-utils
 */

import type { TranslationFunction } from '../../../../../lib/i18n/types'

/**
 * Get all available colors for menu icon customization.
 *
 * Returns an object mapping localized color names to their hex values.
 * The color palette is based on Tailwind CSS colors at the 500 shade level,
 * providing a consistent and accessible color system.
 *
 * Available colors include:
 * - Primary colors: Blue, Green, Red
 * - Secondary colors: Purple, Pink, Orange
 * - Neutral colors: Gray, Slate, Zinc
 * - Accent colors: Cyan, Indigo, Emerald, Lime, Amber, Yellow
 *
 * @param {TranslationFunction} t - Translation function for color names
 * @returns {Record<string, string>} Object mapping localized color names to hex values
 *
 * @example
 * ```tsx
 * function ColorPicker() {
 *   const { t } = useTranslation()
 *   const colors = getAvailableColors(t)
 *
 *   return (
 *     <div className="color-palette">
 *       {Object.entries(colors).map(([name, hex]) => (
 *         <button
 *           key={hex}
 *           style={{ backgroundColor: hex }}
 *           title={name}
 *           onClick={() => onSelectColor(hex)}
 *         >
 *           {name}
 *         </button>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
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

/**
 * Convert a color hex value to a React style object.
 *
 * Creates a style object with the color property set to the provided hex value.
 * If no color is provided, returns an empty object. This is useful for applying
 * custom icon colors to menu items.
 *
 * @param {string} [color] - Hex color value (e.g., '#3b82f6')
 * @returns {Object} Style object with color property, or empty object if no color
 *
 * @example
 * ```tsx
 * function MenuIcon({ icon, customColor }) {
 *   const IconComponent = getIconComponent(icon)
 *   const colorStyle = getColorStyle(customColor)
 *
 *   return <IconComponent style={colorStyle} />
 * }
 *
 * // With custom color
 * getColorStyle('#3b82f6')
 * // Returns: { color: '#3b82f6' }
 *
 * // Without color
 * getColorStyle()
 * // Returns: {}
 *
 * // Usage in menu item
 * <Icon
 *   style={getColorStyle(menuItem.customIconColor)}
 *   className="w-5 h-5"
 * />
 * ```
 */
export const getColorStyle = (color?: string) => {
  if (!color) return {}
  return { color: color }
}
