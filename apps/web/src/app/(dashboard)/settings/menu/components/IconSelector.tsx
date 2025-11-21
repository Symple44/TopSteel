import { getIconComponent, getIconsByCategory } from '../utils/icon-utils'
import type { TranslationFunction } from '../../../../../lib/i18n/types'

interface IconSelectorProps {
  selectedIcon: string
  onIconSelect: (iconName: string) => void
  t: TranslationFunction
  disabled?: boolean
}

export function IconSelector({ selectedIcon, onIconSelect, t, disabled = false }: IconSelectorProps) {
  return (
    <div>
      <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-3">
        {Object.entries(getIconsByCategory(t)).map(([categoryName, icons]) => (
          <div key={categoryName}>
            <h4 className="text-xs font-medium text-muted-foreground mb-2 border-b pb-1">
              {categoryName}
            </h4>
            <div className="grid grid-cols-8 gap-1">
              {icons?.map((iconName) => {
                const IconComponent = getIconComponent(iconName)
                if (!IconComponent) return null
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => onIconSelect(iconName)}
                    disabled={disabled}
                    className={`p-2 rounded border transition-colors hover:bg-accent ${
                      selectedIcon === iconName
                        ? 'border-primary bg-primary/10'
                        : 'border-border'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={iconName}
                  >
                    <IconComponent className="h-4 w-4" />
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
