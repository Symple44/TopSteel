'use client'

import { Lock, Save, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Label } from '../../primitives'
import { Button } from '../../primitives/button'
import { Checkbox } from '../../primitives/checkbox'
import { Input } from '../../primitives/input'
import { Textarea } from '../../primitives/textarea'
import { CustomSelect } from './CustomSelect'
import { SimpleModal } from './SimpleModal'
import type { ColumnConfig } from './types'
import type { Card, KanbanColumn } from './use-data-views'

interface KanbanCardEditorProps {
  card: Card | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedCard: Card) => void
  columns: KanbanColumn[]
  tableColumns: ColumnConfig[]
  kanbanSettings: any
  keyField?: string
}

export function KanbanCardEditor({
  card,
  isOpen,
  onClose,
  onSave,
  columns,
  tableColumns,
  kanbanSettings,
  keyField = 'id',
}: KanbanCardEditorProps) {
  const [formData, setFormData] = useState<any>({})
  const [selectedColumn, setSelectedColumn] = useState('')

  useEffect(() => {
    if (card && isOpen) {
      // Initialiser le formulaire avec les données de la carte
      setFormData({ ...card.originalData })

      // Trouver la colonne actuelle
      const currentColumn = columns.find((col) => col.items.some((item) => item.id === card.id))
      setSelectedColumn(currentColumn?.id || '')
    }
  }, [card, isOpen, columns])

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldId]: value,
    }))
  }

  // Fonction pour vérifier si une colonne est modifiable
  const isColumnEditable = (column: ColumnConfig) => {
    // Vérifier si c'est la clé unique
    const isUniqueKey = column.id === keyField || column.key === keyField
    // Vérifier si la colonne est marquée comme non modifiable
    const isNonEditable = column.editable === false

    return !isUniqueKey && !isNonEditable
  }

  // Fonction pour obtenir le composant input approprié selon le type de colonne
  const renderInputForColumn = (column: ColumnConfig, currentValue: any) => {
    const isEditable = isColumnEditable(column)
    const commonProps = {
      disabled: !isEditable,
      className: isEditable ? '' : 'bg-muted cursor-not-allowed',
    }

    // Si la colonne n'est pas modifiable, afficher une icône de verrouillage
    const lockIcon = !isEditable && <Lock className="h-4 w-4 text-muted-foreground ml-2" />

    switch (column.type) {
      case 'text':
        return (
          <div className="flex items-center">
            <Input
              value={currentValue || ''}
              onChange={(e: any) => handleFieldChange(column.id, e.target.value)}
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
              onChange={(e: any) => {
                const val = e.target.value === '' ? null : Number(e.target.value)
                handleFieldChange(column.id, val)
              }}
              placeholder={`Saisir ${column.title.toLowerCase()}`}
              step={column.format?.decimals ? 10 ** -column.format.decimals : 'any'}
              min={column.validation?.min}
              max={column.validation?.max}
              {...commonProps}
            />
            {lockIcon}
          </div>
        )

      case 'date':
      case 'datetime': {
        const dateValue =
          currentValue instanceof Date
            ? currentValue.toISOString().split('T')[0]
            : currentValue || ''
        return (
          <div className="flex items-center">
            <Input
              type={column.type === 'datetime' ? 'datetime-local' : 'date'}
              value={dateValue}
              onChange={(e: any) => {
                const val = e.target.value ? new Date(e.target.value) : null
                handleFieldChange(column.id, val)
              }}
              {...commonProps}
            />
            {lockIcon}
          </div>
        )
      }

      case 'boolean':
        return (
          <div className="flex items-center gap-3">
            <span className={`text-sm ${isEditable ? '' : 'text-muted-foreground'}`}>
              {column.title}
            </span>
            <Checkbox
              checked={Boolean(currentValue)}
              onCheckedChange={(checked: any) => handleFieldChange(column.id, checked)}
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
                onChange={(e: any) => handleFieldChange(column.id, e.target.value)}
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
              options={column.options.map((opt) => ({
                value: String(opt.value || ''),
                label: opt.label,
              }))}
              disabled={!isEditable}
            />
            {lockIcon}
          </div>
        )

      case 'multiselect': {
        // Pour multiselect, on affiche une version simplifiée avec Input pour cette version
        const displayValue = Array.isArray(currentValue)
          ? currentValue.join(', ')
          : currentValue || ''
        return (
          <div className="flex items-center">
            <Input
              value={displayValue}
              onChange={(e: any) => {
                const values = e.target.value
                  .split(',')
                  .map((v: any) => v.trim())
                  .filter(Boolean)
                handleFieldChange(column.id, values)
              }}
              placeholder={`Saisir ${column.title.toLowerCase()} (séparés par des virgules)`}
              {...commonProps}
            />
            {lockIcon}
          </div>
        )
      }

      case 'richtext':
        return (
          <div className="flex items-start">
            <Textarea
              value={currentValue || ''}
              onChange={(e: any) => handleFieldChange(column.id, e.target.value)}
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
              onChange={(e: any) => handleFieldChange(column.id, e.target.value)}
              placeholder={`Saisir ${column.title.toLowerCase()}`}
              {...commonProps}
            />
            {lockIcon}
          </div>
        )
    }
  }

  const handleSave = () => {
    if (!card) return

    // Mettre à jour les données originales
    const updatedOriginalData = { ...formData }

    // Créer la carte mise à jour
    const updatedCard: Card = {
      ...card,
      originalData: updatedOriginalData,
      // Mettre à jour les champs affichés selon la configuration
      title: updatedOriginalData[kanbanSettings.cardTitleColumn] || card.title,
      subtitle: kanbanSettings.cardSubtitleColumn
        ? updatedOriginalData[kanbanSettings.cardSubtitleColumn]
        : card.subtitle,
      description: kanbanSettings.cardDescriptionColumn
        ? updatedOriginalData[kanbanSettings.cardDescriptionColumn]
        : card.description,
      image: kanbanSettings.cardImageColumn
        ? updatedOriginalData[kanbanSettings.cardImageColumn]
        : card.image,
    }

    onSave(updatedCard)
    onClose()
  }

  if (!card) return null

  return (
    <SimpleModal
      open={isOpen}
      onOpenChange={onClose}
      title="Modifier la carte"
      maxWidth="max-w-2xl"
    >
      <div className="p-6">
        <div className="space-y-6">
          {/* Sélection de la colonne/statut */}
          <div>
            <Label className="text-sm font-medium">Statut / Colonne</Label>
            <CustomSelect
              value={selectedColumn}
              onValueChange={setSelectedColumn}
              placeholder="Sélectionner une colonne"
              options={columns.map((col) => ({
                value: col.id,
                label: col.title,
              }))}
            />
          </div>

          {/* Champs éditables */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground border-b pb-2">
              Informations de la carte
            </h3>

            {tableColumns.map((column) => {
              const currentValue = formData[column.id] || ''
              const isEditable = isColumnEditable(column)
              const isUniqueKey = column.id === keyField || column.key === keyField

              return (
                <div key={column.id}>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <span>
                      {column.title}
                      {column.id === kanbanSettings.statusColumn && (
                        <span className="text-xs text-blue-600 ml-1">(Colonne Kanban)</span>
                      )}
                      {column.id === kanbanSettings.cardTitleColumn && (
                        <span className="text-xs text-green-600 ml-1">(Titre)</span>
                      )}
                      {column.id === kanbanSettings.cardSubtitleColumn && (
                        <span className="text-xs text-purple-600 ml-1">(Sous-titre)</span>
                      )}
                      {column.id === kanbanSettings.cardDescriptionColumn && (
                        <span className="text-xs text-orange-600 ml-1">(Description)</span>
                      )}
                    </span>
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

                  {/* Champ spécial pour la colonne de statut */}
                  {column.id === kanbanSettings.statusColumn ? (
                    <div className="flex items-center">
                      <CustomSelect
                        value={currentValue}
                        onValueChange={(value) => handleFieldChange(column.id, value)}
                        placeholder="Sélectionner un statut"
                        options={columns.map((col) => ({
                          value: col.id,
                          label: col.title,
                        }))}
                        disabled={!isEditable}
                      />
                      {!isEditable && <Lock className="h-4 w-4 text-muted-foreground ml-2" />}
                    </div>
                  ) : (
                    // Utiliser le rendu approprié selon le type de colonne
                    renderInputForColumn(column, currentValue)
                  )}
                </div>
              )
            })}
          </div>

          {/* Aperçu des métadonnées configurées */}
          {(kanbanSettings.cardLabelsColumns?.length > 0 ||
            kanbanSettings.metaColumns?.length > 0) && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground border-b pb-2">
                Informations supplémentaires
              </h3>

              {kanbanSettings.cardLabelsColumns?.map((labelCol: string, index: number) => {
                const column = tableColumns.find((col) => col.id === labelCol)
                if (!column) return null

                const isEditable = isColumnEditable(column)
                const isUniqueKey = column.id === keyField || column.key === keyField

                return (
                  <div key={labelCol}>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <span>
                        {column.title}
                        <span className="text-xs text-blue-600 ml-1">(Étiquette {index + 1})</span>
                      </span>
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
                    {renderInputForColumn(column, formData[labelCol] || '')}
                  </div>
                )
              })}

              {kanbanSettings.metaColumns?.map((metaCol: string, index: number) => {
                const column = tableColumns.find((col) => col.id === metaCol)
                if (!column) return null

                const isEditable = isColumnEditable(column)
                const isUniqueKey = column.id === keyField || column.key === keyField

                return (
                  <div key={metaCol}>
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <span>
                        {column.title}
                        <span className="text-xs text-gray-600 ml-1">(Métadonnée {index + 1})</span>
                      </span>
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
                    {renderInputForColumn(column, formData[metaCol] || '')}
                  </div>
                )
              })}
            </div>
          )}
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

export default KanbanCardEditor
