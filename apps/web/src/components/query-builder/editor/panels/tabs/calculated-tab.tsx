'use client'

import { Badge, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@erp/ui'
import { Calculator, ChevronDown, ChevronRight, Code, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { QueryBuilderCalculatedField, QueryBuilderColumn } from '../../../../../types/query-builder.types'
import { cn } from '../../../../../lib/utils'

interface CalculatedTabProps {
  fields: QueryBuilderCalculatedField[]
  columns: QueryBuilderColumn[]
  onChange: (fields: QueryBuilderCalculatedField[]) => void
}

const FIELD_TYPES = [
  { value: 'text', label: 'Texte' },
  { value: 'number', label: 'Nombre' },
  { value: 'boolean', label: 'Booléen' },
  { value: 'date', label: 'Date' },
]

const FORMULA_TEMPLATES = [
  {
    label: 'Concaténation',
    template: 'CONCAT(column1, " ", column2)',
    description: 'Combine plusieurs colonnes en une seule'
  },
  {
    label: 'Condition',
    template: 'CASE WHEN column > 0 THEN "Positif" ELSE "Négatif" END',
    description: 'Valeur conditionnelle basée sur une expression'
  },
  {
    label: 'Calcul mathématique',
    template: 'column1 * column2 / 100',
    description: 'Opérations arithmétiques'
  },
  {
    label: 'Date formatée',
    template: 'DATE_FORMAT(column, "%d/%m/%Y")',
    description: 'Formater une date'
  },
  {
    label: 'Arrondi',
    template: 'ROUND(column, 2)',
    description: 'Arrondir un nombre'
  },
]

export function CalculatedTab({ fields, columns, onChange }: CalculatedTabProps) {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set())
  const [showTemplates, setShowTemplates] = useState(false)

  const handleAddField = () => {
    const newField: QueryBuilderCalculatedField = {
      name: `calc_${fields.length + 1}`,
      expression: '',
      label: `Champ calculé ${fields.length + 1}`,
      dataType: 'text',
      isVisible: true,
      displayOrder: fields.length,
    }
    onChange([...fields, newField])
    setExpandedFields((prev) => new Set([...prev, newField.name]))
  }

  const handleUpdateField = (name: string, updates: Partial<QueryBuilderCalculatedField>) => {
    onChange(fields.map((f) => (f.name === name ? { ...f, ...updates } : f)))
  }

  const handleRemoveField = (name: string) => {
    onChange(fields.filter((f) => f.name !== name))
    setExpandedFields((prev) => {
      const next = new Set(prev)
      next.delete(name)
      return next
    })
  }

  const toggleExpand = (name: string) => {
    setExpandedFields((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  const applyTemplate = (fieldName: string, template: string) => {
    handleUpdateField(fieldName, { expression: template })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">
          Champs calculés ({fields.length})
        </h3>
        <Button size="sm" variant="outline" onClick={handleAddField}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un champ
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
          <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Aucun champ calculé</p>
          <p className="text-xs mt-1">Les champs calculés permettent de créer des colonnes dérivées</p>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field) => {
            const isExpanded = expandedFields.has(field.name)
            return (
              <div key={field.name} className="border rounded-lg bg-card overflow-hidden">
                {/* Field Header */}
                <div
                  className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleExpand(field.name)}
                >
                  <button type="button" className="p-0.5">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  <Calculator className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm flex-1">{field.label}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {FIELD_TYPES.find((t) => t.value === field.dataType)?.label || field.dataType}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveField(field.name)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Field Content */}
                {isExpanded && (
                  <div className="p-3 pt-0 space-y-3 border-t">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Nom technique</label>
                        <Input
                          value={field.name}
                          onChange={(e) => handleUpdateField(field.name, { name: e.target.value })}
                          className="h-8 text-sm font-mono"
                          placeholder="nom_technique"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Libellé affiché</label>
                        <Input
                          value={field.label}
                          onChange={(e) => handleUpdateField(field.name, { label: e.target.value })}
                          className="h-8 text-sm"
                          placeholder="Libellé"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Type de résultat</label>
                      <Select
                        value={field.dataType}
                        onValueChange={(v) => handleUpdateField(field.name, { dataType: v })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Code className="h-3 w-3" />
                          Formule SQL
                        </label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => setShowTemplates(!showTemplates)}
                        >
                          Modèles
                        </Button>
                      </div>
                      <Textarea
                        value={field.expression}
                        onChange={(e) => handleUpdateField(field.name, { expression: e.target.value })}
                        className="font-mono text-sm min-h-[80px]"
                        placeholder="Ex: CONCAT(firstName, ' ', lastName)"
                      />
                    </div>

                    {/* Templates */}
                    {showTemplates && (
                      <div className="grid grid-cols-1 gap-1">
                        {FORMULA_TEMPLATES.map((tmpl) => (
                          <button
                            key={tmpl.label}
                            type="button"
                            className="text-left p-2 rounded hover:bg-muted text-xs"
                            onClick={() => applyTemplate(field.name, tmpl.template)}
                          >
                            <div className="font-medium">{tmpl.label}</div>
                            <div className="text-muted-foreground">{tmpl.description}</div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Available Columns Reference */}
                    {columns.length > 0 && (
                      <div className="p-2 bg-muted/30 rounded text-xs">
                        <div className="text-muted-foreground mb-1">Colonnes disponibles:</div>
                        <div className="flex flex-wrap gap-1">
                          {columns.map((col) => (
                            <Badge
                              key={`${col.tableName}.${col.columnName}`}
                              variant="outline"
                              className="text-[10px] cursor-pointer hover:bg-primary/10"
                              onClick={() => {
                                const currentExpression = field.expression || ''
                                handleUpdateField(field.name, {
                                  expression: currentExpression + col.columnName,
                                })
                              }}
                            >
                              {col.columnName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
