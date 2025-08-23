'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Check, X, Edit2 } from 'lucide-react'
import { Input } from '../../../../primitives/input'
import { Checkbox } from '../../../../primitives/checkbox'
import { Badge } from '../../..//badge'
import { cn } from '../../../../../lib/utils'
import type { ColumnConfig } from '../../types'

interface TableCellProps<T> {
  row: T
  column: ColumnConfig<T>
  onEdit?: (value: any) => void
  className?: string
}

/**
 * Cellule de tableau avec support d'édition inline
 */
export function TableCell<T extends Record<string, any>>({
  row,
  column,
  onEdit,
  className,
}: TableCellProps<T>) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Obtenir la valeur de la cellule
  const getValue = () => {
    if (column.getValue) {
      return column.getValue(row)
    }
    if (column.accessor) {
      if (typeof column.accessor === 'function') {
        return column.accessor(row)
      }
      return row[column.accessor as keyof T]
    }
    return row[column.key as keyof T]
  }

  const value = getValue()

  // Activer l'édition
  const startEdit = () => {
    if (!column.editable || !onEdit) return
    setEditValue(value)
    setIsEditing(true)
  }

  // Sauvegarder l'édition
  const saveEdit = () => {
    if (onEdit && editValue !== value) {
      onEdit(editValue)
    }
    setIsEditing(false)
  }

  // Annuler l'édition
  const cancelEdit = () => {
    setEditValue(null)
    setIsEditing(false)
  }

  // Focus sur l'input quand on entre en mode édition
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Formater la valeur pour l'affichage
  const formatValue = (val: any): React.ReactNode => {
    // Rendu personnalisé
    if (column.render) {
      return column.render(val, row, column)
    }

    // Formatage selon le type
    switch (column.type) {
      case 'boolean':
        return (
          <Checkbox 
            checked={!!val} 
            disabled={!column.editable}
            onCheckedChange={column.editable ? onEdit : undefined}
          />
        )

      case 'date':
        if (!val) return '-'
        const date = new Date(val)
        return date.toLocaleDateString('fr-FR')

      case 'datetime':
        if (!val) return '-'
        const datetime = new Date(val)
        return datetime.toLocaleString('fr-FR')

      case 'number':
        if (val == null) return '-'
        if (column.format) {
          let formatted = val
          if (column.format.decimals !== undefined) {
            formatted = Number(val).toFixed(column.format.decimals)
          }
          if (column.format.prefix) {
            formatted = column.format.prefix + formatted
          }
          if (column.format.suffix) {
            formatted = formatted + column.format.suffix
          }
          return formatted
        }
        return val

      case 'select':
      case 'multiselect':
        if (!column.options) return val
        const option = column.options.find(opt => opt.value === val)
        if (option) {
          return option.color ? (
            <Badge style={{ backgroundColor: option.color }}>
              {option.label}
            </Badge>
          ) : (
            option.label
          )
        }
        return val

      case 'richtext':
        if (!val) return '-'
        // Nettoyer le HTML pour l'affichage
        const div = document.createElement('div')
        div.innerHTML = val
        return div.textContent || '-'

      default:
        if (val == null || val === '') return '-'
        return String(val)
    }
  }

  // Mode édition
  if (isEditing) {
    return (
      <td className={cn('px-4 py-2', className)}>
        <div className="flex items-center gap-1">
          <Input
            ref={inputRef}
            type={column.type === 'number' ? 'number' : 'text'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit()
              if (e.key === 'Escape') cancelEdit()
            }}
            className="h-8"
          />
          <button
            onClick={saveEdit}
            className="p-1 hover:bg-green-100 rounded"
            title="Sauvegarder"
          >
            <Check className="h-4 w-4 text-green-600" />
          </button>
          <button
            onClick={cancelEdit}
            className="p-1 hover:bg-red-100 rounded"
            title="Annuler"
          >
            <X className="h-4 w-4 text-red-600" />
          </button>
        </div>
      </td>
    )
  }

  // Mode affichage
  return (
    <td 
      className={cn(
        'px-4 py-2',
        column.editable && onEdit && 'group cursor-pointer hover:bg-muted/50',
        className
      )}
      onDoubleClick={startEdit}
    >
      <div className="flex items-center justify-between">
        <span>{formatValue(value)}</span>
        {column.editable && onEdit && (
          <Edit2 
            className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              startEdit()
            }}
          />
        )}
      </div>
    </td>
  )
}