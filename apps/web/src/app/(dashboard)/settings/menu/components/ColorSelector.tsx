import { Button } from '@erp/ui'
import { CheckCircle } from 'lucide-react'
import { getAvailableColors } from '../utils/color-utils'
import type { TranslationFunction } from '../../../../../lib/i18n/types'

interface ColorSelectorProps {
  selectedColor: string
  onColorSelect: (color: string) => void
  t: TranslationFunction
  disabled?: boolean
}

export function ColorSelector({ selectedColor, onColorSelect, t, disabled = false }: ColorSelectorProps) {
  return (
    <div>
      <div className="grid grid-cols-8 gap-2">
        {Object.entries(getAvailableColors(t)).map(([colorName, colorValue]) => (
          <Button
            type="button"
            key={colorName}
            variant="ghost"
            onClick={() => onColorSelect(colorValue)}
            disabled={disabled}
            className={`relative p-2 rounded border-2 transition-all duration-200 hover:scale-110 hover:shadow-lg ${
              selectedColor === colorValue
                ? 'border-primary shadow-md ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={t('menu.clickToApply', { name: colorName })}
          >
            <div
              className="w-6 h-6 rounded-full mx-auto"
              style={{ backgroundColor: colorValue }}
            />
            {selectedColor === colorValue && (
              <div className="absolute -top-1 -right-1">
                <CheckCircle className="h-3 w-3 text-primary bg-white rounded-full" />
              </div>
            )}
          </Button>
        ))}
        {/* Bouton couleur par défaut */}
        <Button
          type="button"
          variant="ghost"
          onClick={() => onColorSelect('')}
          disabled={disabled}
          className={`p-2 rounded border-2 transition-all text-xs ${
            selectedColor
              ? 'border-border hover:bg-accent'
              : 'border-primary bg-primary/10'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label={t('menu.defaultColor')}
        >
          <div className="w-6 h-6 rounded-full mx-auto bg-gradient-to-br from-gray-200 to-gray-400 flex items-center justify-center">
            <span className="text-[8px] font-bold text-gray-600">DEF</span>
          </div>
        </Button>
      </div>
    </div>
  )
}
