import React from 'react'
import type { ColumnConfig } from './types'

/**
 * Utilitaires pour le rendu sécurisé des cellules
 */
export class RenderUtils {
  /**
   * Convertit de manière sécurisée une valeur en string pour l'affichage React
   */
  static safeRender(value: unknown, column: ColumnConfig): string {
    // Valeurs nulles/undefined
    if (value === null || value === undefined) {
      return ''
    }

    // Déjà une string
    if (typeof value === 'string') {
      return value
    }

    // Boolean
    if (typeof value === 'boolean') {
      return column.type === 'boolean' ? '' : value ? 'Oui' : 'Non'
    }

    // Number
    if (typeof value === 'number') {
      if (Number.isNaN(value)) return '0'

      // Appliquer le formatage de colonne si disponible
      if (column.format) {
        return RenderUtils.formatNumber(value, column.format)
      }

      return value.toString()
    }

    // Date
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) return ''

      switch (column.type) {
        case 'date':
          return value.toLocaleDateString('fr-FR')
        case 'datetime':
          return value.toLocaleString('fr-FR')
        default:
          return value.toLocaleDateString('fr-FR')
      }
    }

    // Arrays (pour multiselect par exemple)
    if (Array.isArray(value)) {
      return value.map((v) => String(v)).join(', ')
    }

    // Objets
    if (typeof value === 'object') {
      try {
        // Cas spécial pour les traductions (objet avec des codes de langue)
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const keys = Object.keys(value as Record<string, unknown>)
          // Si c'est un objet de traductions avec des codes de langue
          if (
            keys.length <= 3 &&
            keys.every((key) => key.length === 2 || key === 'fr' || key === 'en' || key === 'es')
          ) {
            const translations = keys
              .map((key) => `${key}: "${(value as Record<string, unknown>)[key]}"`)
              .join(', ')
            return `{${translations}}`
          }
          // Pour d'autres objets simples
          if (keys.length < 5) {
            return JSON.stringify(value, null, 0)
          }
        }
        return '[Object]'
      } catch {
        return '[Object]'
      }
    }

    // Autres types - conversion en string
    return String(value)
  }

  /**
   * Formate un nombre selon la configuration de la colonne
   */
  private static formatNumber(value: number, format: NonNullable<ColumnConfig['format']>): string {
    let result = value.toString()

    // Décimales
    if (format.decimals !== undefined) {
      result = value.toFixed(format.decimals)
    }

    // Devise
    if (format.currency) {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: format.currency,
      }).format(value)
    }

    // Préfixe/Suffixe
    if (format.prefix) result = format.prefix + result
    if (format.suffix) result = result + format.suffix

    return result
  }

  /**
   * Vérifie si une valeur peut être rendue de manière sécurisée par React
   */
  static isReactSafe(value: unknown): boolean {
    return (
      value === null ||
      value === undefined ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      // Vérifier si c'est un élément React valide
      React.isValidElement(value) ||
      // Vérifier si c'est un tableau d'éléments React valides
      (Array.isArray(value) &&
        value.every(
          (item) =>
            React.isValidElement(item) ||
            typeof item === 'string' ||
            typeof item === 'number' ||
            typeof item === 'boolean' ||
            item === null ||
            item === undefined
        ))
    )
  }

  /**
   * Convertit une valeur pour qu'elle soit sécurisée pour React
   */
  static makeReactSafe(value: unknown, column: ColumnConfig): React.ReactNode {
    if (RenderUtils.isReactSafe(value)) {
      // Si c'est une Date ou un Object, on les convertit
      if (value instanceof Date || (typeof value === 'object' && value !== null)) {
        return RenderUtils.safeRender(value, column)
      }
      return value as React.ReactNode
    }

    return RenderUtils.safeRender(value, column)
  }

  /**
   * Rend la valeur d'une cellule avec support pour l'édition
   */
  static renderCellValue(
    value: unknown,
    column: ColumnConfig,
    item: unknown,
    readonly: boolean = false,
    onValueChange?: (newValue: unknown) => void
  ): React.ReactNode {
    // Si readonly ou pas d'édition possible, rendu simple
    if (readonly || !column.editable || !onValueChange) {
      return RenderUtils.makeReactSafe(value, column)
    }

    // Pour l'édition, on retourne un composant éditable selon le type
    return RenderUtils.renderEditableCell(value, column, item, onValueChange)
  }

  /**
   * Rend une cellule éditable selon son type
   */
  private static renderEditableCell(
    value: unknown,
    column: ColumnConfig,
    _item: unknown,
    onValueChange: (newValue: unknown) => void
  ): React.ReactNode {
    const handleChange = (newValue: unknown) => {
      // Validation basique selon le type
      let validatedValue = newValue

      switch (column.type) {
        case 'number':
          validatedValue = parseFloat(String(newValue)) || 0
          break
        case 'boolean':
          validatedValue = Boolean(newValue)
          break
        case 'date':
        case 'datetime':
          if (newValue && !(newValue instanceof Date)) {
            validatedValue = new Date(newValue as string | number | Date)
          }
          break
        default:
          validatedValue = String(newValue || '')
      }

      onValueChange(validatedValue)
    }

    // Rendu selon le type de colonne
    switch (column.type) {
      case 'boolean':
        return React.createElement('input', {
          type: 'checkbox',
          checked: Boolean(value),
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.checked),
          className:
            'h-4 w-4 text-primary rounded border-input bg-transparent transition-colors focus-visible:ring-1 focus-visible:ring-ring',
        })

      case 'select':
        if (column.options) {
          return React.createElement(
            'select',
            {
              value: value || '',
              onChange: (e: React.ChangeEvent<HTMLSelectElement>) => handleChange(e.target.value),
              className:
                'w-full h-8 px-2 text-xs border border-input bg-transparent rounded-md shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring',
            },
            [
              React.createElement('option', { key: '', value: '' }, ''),
              ...column.options.map((option) =>
                React.createElement(
                  'option',
                  {
                    key: typeof option === 'object' ? String(option.value) : String(option),
                    value: typeof option === 'object' ? String(option.value) : String(option),
                  },
                  typeof option === 'object' ? option.label : option
                )
              ),
            ]
          )
        }
        break

      case 'multiselect':
        if (column.options) {
          const currentValues = Array.isArray(value) ? value : []
          return React.createElement(
            'div',
            {
              className:
                'flex flex-wrap gap-1 p-1 min-h-8 border border-input bg-transparent rounded-md',
            },
            column.options.map((option) => {
              const optionValue = typeof option === 'object' ? option.value : option
              const optionLabel = typeof option === 'object' ? option.label : option
              const isSelected = currentValues.includes(optionValue)

              return React.createElement(
                'label',
                {
                  key: String(optionValue),
                  className:
                    'inline-flex items-center space-x-1 text-xs cursor-pointer hover:bg-accent/50 rounded px-1 transition-colors',
                },
                [
                  React.createElement('input', {
                    type: 'checkbox',
                    checked: isSelected,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      const newValues = e.target.checked
                        ? [...currentValues, optionValue]
                        : currentValues.filter((v) => v !== optionValue)
                      handleChange(newValues)
                    },
                    className:
                      'h-3 w-3 text-primary rounded border-input bg-transparent transition-colors focus-visible:ring-1 focus-visible:ring-ring',
                  }),
                  React.createElement('span', { className: 'text-foreground' }, optionLabel),
                ]
              )
            })
          )
        }
        break

      case 'number':
        return React.createElement('input', {
          type: 'number',
          value: value || '',
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value),
          className:
            'w-full h-8 px-2 text-xs border border-input bg-transparent rounded-md shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring',
          step: column.format?.decimals ? `0.${'0'.repeat(column.format.decimals - 1)}1` : '1',
        })

      case 'date': {
        const dateValue = value instanceof Date ? value.toISOString().split('T')[0] : ''
        return React.createElement('input', {
          type: 'date',
          value: dateValue,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value),
          className:
            'w-full h-8 px-2 text-xs border border-input bg-transparent rounded-md shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring',
        })
      }

      case 'datetime': {
        const datetimeValue = value instanceof Date ? value.toISOString().slice(0, 16) : ''
        return React.createElement('input', {
          type: 'datetime-local',
          value: datetimeValue,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value),
          className:
            'w-full h-8 px-2 text-xs border border-input bg-transparent rounded-md shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring',
        })
      }

      case 'richtext':
        return React.createElement('div', {
          contentEditable: true,
          dangerouslySetInnerHTML: { __html: value || '' },
          onBlur: (e: React.FocusEvent<HTMLDivElement>) => handleChange(e.target.innerHTML),
          className:
            'w-full px-2 py-1 text-xs border border-input bg-transparent rounded-md shadow-sm min-h-8 transition-colors focus-visible:ring-1 focus-visible:ring-ring',
        })

      default:
        // Type text par défaut
        return React.createElement('input', {
          type: 'text',
          value: value || '',
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value),
          className:
            'w-full h-8 px-2 text-xs border border-input bg-transparent rounded-md shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring',
        })
    }

    // Fallback si aucun type ne correspond
    return RenderUtils.makeReactSafe(value, column)
  }
}
