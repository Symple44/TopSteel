'use client'

import { Badge } from '../badge'
import { Checkbox } from '../../primitives/checkbox'
import { Input } from '../../primitives/input'
import { AlertTriangle, Calculator, Check, X } from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SelectPortal } from '../../primitives/select-portal'
import { cn } from '../../../lib/utils'
import { FormulaEditor } from './FormulaEditor'
import type { ColumnConfig } from './types'
import { ValidationUtils } from './validation-utils'

interface InlineEditorProps<T = any> {
  value: any
  row: T
  column: ColumnConfig<T>
  onSave: (value: any) => void
  onCancel: () => void
  autoFocus?: boolean
  allColumns?: ColumnConfig<T>[]
  sampleData?: T[]
  onTabNavigation?: (forward: boolean) => void
  onOpenRichTextEditor?: () => void
}

export function InlineEditor<T = any>({
  value: initialValue,
  row,
  column,
  onSave,
  onCancel,
  autoFocus = true,
  allColumns = [],
  sampleData = [],
  onTabNavigation,
  onOpenRichTextEditor,
}: InlineEditorProps<T>) {
  const [value, setValue] = useState(initialValue)
  const [validation, setValidation] = useState<{
    isValid: boolean
    error?: string
    warning?: string
  }>({ isValid: true })
  const [showValidation, setShowValidation] = useState(false)
  const [showFormulaEditor, setShowFormulaEditor] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const divRef = useRef<HTMLDivElement>(null)
  const selectRef = useRef<HTMLButtonElement>(null)

  // Valider en temps réel
  const validateValue = useCallback(
    (val: any) => {
      const result = ValidationUtils.validateValue(val, column, row)
      setValidation(result)
      setShowValidation(!result.isValid || !!result.warning)
      return result
    },
    [column, row]
  )

  // Effet de validation à chaque changement
  useEffect(() => {
    validateValue(value)
  }, [value, validateValue])

  // Focus automatique
  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => {
        if (column.type === 'richtext' && divRef.current) {
          divRef.current.focus()
          // Pour les contentEditable (rich text), sélectionner tout le contenu différemment
          const range = document.createRange()
          const selection = window.getSelection()
          range.selectNodeContents(divRef.current)
          selection?.removeAllRanges()
          selection?.addRange(range)
        } else if (inputRef.current) {
          inputRef.current.focus()
          inputRef.current.select()
        } else if (selectRef.current) {
          selectRef.current.focus()
        }
      }, 0)
    }
  }, [autoFocus, column.type])

  // Gestionnaires d'événements
  const handleSave = useCallback(() => {
    const validationResult = validateValue(value)
    if (validationResult.isValid) {
      onSave(validationResult.convertedValue ?? value)
    }
  }, [value, validateValue, onSave])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation() // Empêcher la propagation vers le DataTable

      switch (e.key) {
        case 'Enter':
          e.preventDefault()
          handleSave()
          break
        case 'Escape':
          e.preventDefault()
          onCancel()
          break
        case 'Tab':
          e.preventDefault()
          handleSave()
          // Après sauvegarde, naviguer vers la cellule suivante
          setTimeout(() => {
            onTabNavigation?.(!e.shiftKey)
          }, 0)
          break
      }
    },
    [handleSave, onCancel, onTabNavigation]
  )

  // Rendu selon le type de colonne
  const renderEditor = () => {
    switch (column.type) {
      case 'text':
        return (
          <Input
            ref={inputRef}
            value={value || ''}
            onChange={(e: any) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className={cn(
              'h-8 text-xs border border-input bg-transparent rounded-md shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring',
              !validation.isValid && 'border-red-500 focus-visible:ring-red-500',
              validation.warning && 'border-yellow-500 focus-visible:ring-yellow-500'
            )}
            placeholder={column.title}
          />
        )

      case 'number':
        return (
          <Input
            ref={inputRef}
            type="number"
            value={value || ''}
            onChange={(e: any) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className={cn(
              'h-8 text-xs border border-input bg-transparent rounded-md shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring',
              !validation.isValid && 'border-red-500 focus-visible:ring-red-500',
              validation.warning && 'border-yellow-500 focus-visible:ring-yellow-500'
            )}
            min={column.validation?.min}
            max={column.validation?.max}
            step="any"
          />
        )

      case 'date':
        return (
          <Input
            ref={inputRef}
            type="date"
            value={value instanceof Date ? value.toISOString().split('T')[0] : value || ''}
            onChange={(e: any) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className={cn(
              'h-8 text-xs border border-input bg-transparent rounded-md shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring',
              !validation.isValid && 'border-red-500 focus-visible:ring-red-500',
              validation.warning && 'border-yellow-500 focus-visible:ring-yellow-500'
            )}
          />
        )

      case 'datetime':
        return (
          <Input
            ref={inputRef}
            type="datetime-local"
            value={value instanceof Date ? value.toISOString().slice(0, 16) : value || ''}
            onChange={(e: any) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className={cn(
              'h-8 text-xs border border-input bg-transparent rounded-md shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring',
              !validation.isValid && 'border-red-500 focus-visible:ring-red-500',
              validation.warning && 'border-yellow-500 focus-visible:ring-yellow-500'
            )}
          />
        )

      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={Boolean(value)}
              onCheckedChange={(checked: any) => {
                setValue(checked)
                // Auto-save pour les checkboxes
                setTimeout(() => handleSave(), 0)
              }}
              onKeyDown={handleKeyDown}
            />
            <span className="text-xs">{value ? 'Oui' : 'Non'}</span>
          </div>
        )

      case 'select':
        return (
          <SelectPortal
            value={value}
            onValueChange={(newValue) => {
              setValue(newValue)
              // Auto-save pour les selects
              setTimeout(() => handleSave(), 0)
            }}
            options={
              column.options?.map((opt) => ({
                value: String(opt.value),
                label: opt.label,
                color: opt.color,
              })) || []
            }
            placeholder="Choisir..."
            className={cn(
              'h-8 text-xs border border-input bg-transparent rounded-md shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring',
              !validation.isValid && 'border-red-500 focus-visible:ring-red-500',
              validation.warning && 'border-yellow-500 focus-visible:ring-yellow-500'
            )}
          />
        )

      case 'multiselect':
        return (
          <div className="min-h-8 p-1 border border-input bg-transparent rounded-md text-xs">
            {Array.isArray(value) ? (
              value.map((val, index) => {
                const option = column.options?.find((opt) => opt.value === val)
                return (
                  <Badge key={index} variant="outline" className="m-1 text-xs">
                    {option ? option.label : String(val)}
                  </Badge>
                )
              })
            ) : (
              <span className="text-muted-foreground">Cliquer pour modifier...</span>
            )}
          </div>
        )

      case 'formula':
        return (
          <div className="flex items-center gap-1">
            <Input
              ref={inputRef}
              value={value || ''}
              onChange={(e: any) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className={cn(
                'h-8 text-xs font-mono',
                !validation.isValid && 'border-red-500',
                validation.warning && 'border-yellow-500'
              )}
              placeholder="=A1+B1"
            />
            <button
              type="button"
              onClick={() => setShowFormulaEditor(true)}
              className="h-8 px-2 border border-input bg-transparent rounded-md hover:bg-accent transition-colors"
              title="Ouvrir l'éditeur de formules"
            >
              <Calculator className="h-3 w-3" />
            </button>
          </div>
        )

      case 'richtext':
        return (
          <div
            ref={divRef}
            contentEditable
            className={cn(
              'p-2 border border-input bg-transparent rounded-md min-h-[60px] max-h-[120px] overflow-y-auto text-xs shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus:outline-none',
              !validation.isValid && 'border-red-500 focus-visible:ring-red-500',
              validation.warning && 'border-yellow-500 focus-visible:ring-yellow-500'
            )}
            dangerouslySetInnerHTML={{ __html: value || '' }}
            onInput={(e) => {
              const target = e.target as HTMLDivElement
              setValue(target.innerHTML)
            }}
            onKeyDown={(e) => {
              // Permettre Enter pour les sauts de ligne dans le rich text
              if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
                // Ne pas empêcher le comportement par défaut pour permettre les sauts de ligne
                return
              }
              // Pour les autres touches, utiliser le gestionnaire normal
              handleKeyDown(e)
            }}
            onBlur={handleSave}
            suppressContentEditableWarning
          />
        )

      default:
        return (
          <Input
            ref={inputRef}
            value={value || ''}
            onChange={(e: any) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className={cn(
              'h-8 text-xs border border-input bg-transparent rounded-md shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring',
              !validation.isValid && 'border-red-500 focus-visible:ring-red-500',
              validation.warning && 'border-yellow-500 focus-visible:ring-yellow-500'
            )}
          />
        )
    }
  }

  return (
    <div className="relative">
      {renderEditor()}

      {/* Icônes de validation */}
      <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
        {validation.isValid && !validation.warning && <Check className="h-3 w-3 text-green-500" />}
        {validation.warning && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
        {!validation.isValid && <X className="h-3 w-3 text-red-500" />}
      </div>

      {/* Message de validation */}
      {showValidation && (validation.error || validation.warning) && (
        <div
          className={cn(
            'absolute z-50 top-full left-0 right-0 mt-1 p-2 rounded-md shadow-lg border text-xs',
            validation.error
              ? 'bg-red-50 border-red-500 text-red-700'
              : 'bg-yellow-50 border-yellow-500 text-yellow-700'
          )}
        >
          {validation.error || validation.warning}
        </div>
      )}

      {/* Éditeur de formules */}
      {column.type === 'formula' && (
        <FormulaEditor
          open={showFormulaEditor}
          onOpenChange={setShowFormulaEditor}
          currentFormula={value}
          columns={allColumns}
          sampleData={sampleData}
          onSave={(formula) => {
            setValue(formula)
            setTimeout(() => handleSave(), 0) // Auto-save après modification
          }}
        />
      )}
    </div>
  )
}

export default InlineEditor
