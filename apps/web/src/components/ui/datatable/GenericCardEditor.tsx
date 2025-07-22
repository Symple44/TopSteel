'use client'

import React, { useState, useEffect } from 'react'
import { Button, Label, Input, Textarea, Checkbox } from '@erp/ui'
import { SimpleModal } from './SimpleModal'
import { CustomSelect } from './CustomSelect'
import { Card, TimelineItem, CalendarEvent } from './use-data-views'
import { ColumnConfig, ColumnType } from './types'
import { Save, X, Lock } from 'lucide-react'

interface GenericCardEditorProps {
  item: Card | TimelineItem | CalendarEvent | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedItem: Card | TimelineItem | CalendarEvent) => void
  tableColumns: ColumnConfig[]
  keyField?: string
  title: string
  viewType: 'cards' | 'timeline' | 'calendar'
}

export function GenericCardEditor({
  item,
  isOpen,
  onClose,
  onSave,
  tableColumns,
  keyField = 'id',
  title,
  viewType
}: GenericCardEditorProps) {
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    if (item && isOpen) {
      setFormData({ ...item.originalData })
    }
  }, [item, isOpen])

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  // Fonction pour vérifier si une colonne est modifiable
  const isColumnEditable = (column: ColumnConfig) => {
    const isUniqueKey = column.id === keyField || column.key === keyField
    const isNonEditable = column.editable === false
    return !isUniqueKey && !isNonEditable
  }

  // Fonction pour obtenir le composant input approprié selon le type de colonne
  const renderInputForColumn = (column: ColumnConfig, currentValue: any) => {
    const isEditable = isColumnEditable(column)
    const commonProps = {
      disabled: !isEditable,
      className: !isEditable ? 'bg-muted cursor-not-allowed' : ''
    }

    const lockIcon = !isEditable && (
      <Lock className="h-4 w-4 text-muted-foreground ml-2" />
    )

    switch (column.type) {
      case 'text':
        return (
          <div className="flex items-center">
            <Input
              value={currentValue || ''}
              onChange={(e) => handleFieldChange(column.id, e.target.value)}
              placeholder={`Saisir ${column.title.toLowerCase()}`}
              {...commonProps}
            />
            {lockIcon}
          </div>
        )

      case 'number':
        return (
          <div className="flex items-center">
            <Input
              type="number"
              value={currentValue || ''}
              onChange={(e) => {
                const val = e.target.value === '' ? null : Number(e.target.value)
                handleFieldChange(column.id, val)
              }}
              placeholder={`Saisir ${column.title.toLowerCase()}`}
              step={column.format?.decimals ? Math.pow(10, -column.format.decimals) : 'any'}
              min={column.validation?.min}
              max={column.validation?.max}
              {...commonProps}
            />
            {lockIcon}
          </div>
        )

      case 'date':
      case 'datetime':
        const dateValue = currentValue instanceof Date 
          ? currentValue.toISOString().split('T')[0]
          : currentValue || ''
        return (
          <div className="flex items-center">
            <Input
              type={column.type === 'datetime' ? 'datetime-local' : 'date'}
              value={dateValue}
              onChange={(e) => {
                const val = e.target.value ? new Date(e.target.value) : null
                handleFieldChange(column.id, val)
              }}
              {...commonProps}
            />
            {lockIcon}
          </div>
        )

      case 'boolean':
        return (
          <div className="flex items-center gap-3">
            <span className={`text-sm ${!isEditable ? 'text-muted-foreground' : ''}`}>
              {column.title}
            </span>
            <Checkbox
              checked={Boolean(currentValue)}
              onCheckedChange={(checked) => handleFieldChange(column.id, checked)}
              disabled={!isEditable}
            />
            {lockIcon}
          </div>
        )

      case 'select':
        if (!column.options || column.options.length === 0) {
          return (
            <div className="flex items-center">
              <Input
                value={currentValue || ''}
                onChange={(e) => handleFieldChange(column.id, e.target.value)}
                placeholder={`Saisir ${column.title.toLowerCase()}`}
                {...commonProps}
              />
              {lockIcon}
            </div>
          )
        }
        return (
          <div className="flex items-center">
            <CustomSelect
              value={currentValue || ''}
              onValueChange={(value) => handleFieldChange(column.id, value)}
              placeholder={`Sélectionner ${column.title.toLowerCase()}`}
              options={column.options.map(opt => ({
                value: opt.value,
                label: opt.label
              }))}
              disabled={!isEditable}
            />
            {lockIcon}
          </div>
        )

      case 'multiselect':
        const displayValue = Array.isArray(currentValue) 
          ? currentValue.join(', ') 
          : (currentValue || '')
        return (
          <div className="flex items-center">
            <Input
              value={displayValue}
              onChange={(e) => {
                const values = e.target.value.split(',').map(v => v.trim()).filter(Boolean)
                handleFieldChange(column.id, values)
              }}
              placeholder={`Saisir ${column.title.toLowerCase()} (séparés par des virgules)`}
              {...commonProps}
            />
            {lockIcon}
          </div>
        )

      case 'richtext':
        return (
          <div className="flex items-start">
            <Textarea
              value={currentValue || ''}
              onChange={(e) => handleFieldChange(column.id, e.target.value)}
              placeholder={`Saisir ${column.title.toLowerCase()}`}
              rows={4}
              className={`resize-none ${commonProps.className}`}
              disabled={!isEditable}
            />
            {lockIcon && <div className="mt-2">{lockIcon}</div>}
          </div>
        )

      default:
        return (
          <div className="flex items-center">
            <Input
              value={currentValue || ''}
              onChange={(e) => handleFieldChange(column.id, e.target.value)}
              placeholder={`Saisir ${column.title.toLowerCase()}`}
              {...commonProps}
            />
            {lockIcon}
          </div>
        )
    }
  }

  const handleSave = () => {
    if (!item) return

    // Recréer l'objet selon le type
    let updatedItem: Card | TimelineItem | CalendarEvent

    if (viewType === 'timeline') {
      updatedItem = {
        ...item,
        originalData: formData,
        title: formData[Object.keys(formData)[0]] || item.title
      } as TimelineItem
    } else if (viewType === 'calendar') {
      updatedItem = {
        ...item,
        originalData: formData,
        title: formData[Object.keys(formData)[0]] || item.title
      } as CalendarEvent
    } else {
      // cards
      updatedItem = {
        ...item,
        originalData: formData,
        title: formData[Object.keys(formData)[0]] || item.title
      } as Card
    }

    onSave(updatedItem)
    onClose()
  }

  if (!item) return null

  return (
    <SimpleModal
      open={isOpen}
      onOpenChange={onClose}
      title={title}
      maxWidth="max-w-2xl"
    >
      <div className="p-6">
        <div className="space-y-6">
          {/* Champs éditables */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground border-b pb-2">
              Informations de l'élément
            </h3>
            
            {tableColumns.map(column => {
              const currentValue = formData[column.id] || ''
              const isEditable = isColumnEditable(column)
              const isUniqueKey = column.id === keyField || column.key === keyField
              
              return (
                <div key={column.id}>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <span>{column.title}</span>
                    {isUniqueKey && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Clé unique
                      </span>
                    )}
                    {!isEditable && !isUniqueKey && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Non modifiable
                      </span>
                    )}
                  </Label>
                  {renderInputForColumn(column, currentValue)}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-border flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          <X className="h-4 w-4 mr-2" />
          Annuler
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Enregistrer
        </Button>
      </div>
    </SimpleModal>
  )
}

export default GenericCardEditor