'use client'

import { AlertCircle, CheckCircle, Eye, Palette, Plus, Trash2, Zap } from 'lucide-react'
import { useId, useState } from 'react'
import { Label, Separator } from '../../primitives'
import { Button } from '../../primitives/button'
import { Input } from '../../primitives/input'
import { Badge } from '../badge'
import { CustomSelect } from './CustomSelect'
import { SimpleModal } from './SimpleModal'
import type { ColumnConfig } from './types'

export interface ColorRule {
  id: string
  name: string
  columnId: string
  condition: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'empty' | 'not_empty'
  value?: string | number
  value2?: string | number // Pour 'between'
  backgroundColor?: string
  textColor?: string
  applyTo: 'cell' | 'row'
  priority: number
  enabled: boolean
}

interface ColorRuleManagerProps<T = Record<string, unknown>> {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: ColumnConfig<T>[]
  rules: ColorRule[]
  onRulesChange: (rules: ColorRule[]) => void
}

const PREDEFINED_COLORS = [
  { bg: '#fef2f2', text: '#991b1b', name: 'Rouge clair' },
  { bg: '#fff7ed', text: '#9a3412', name: 'Orange clair' },
  { bg: '#fffbeb', text: '#92400e', name: 'Jaune clair' },
  { bg: '#f0fdf4', text: '#166534', name: 'Vert clair' },
  { bg: '#f0f9ff', text: '#1e40af', name: 'Bleu clair' },
  { bg: '#faf5ff', text: '#7c3aed', name: 'Violet clair' },
  { bg: '#fdf2f8', text: '#be185d', name: 'Rose clair' },
  { bg: '#f8fafc', text: '#475569', name: 'Gris clair' },
]

const CONDITIONS = [
  { value: 'equals', label: 'Égal à' },
  { value: 'contains', label: 'Contient' },
  { value: 'greater', label: 'Supérieur à' },
  { value: 'less', label: 'Inférieur à' },
  { value: 'between', label: 'Entre' },
  { value: 'empty', label: 'Vide' },
  { value: 'not_empty', label: 'Non vide' },
]

export function ColorRuleManager<T = Record<string, unknown>>({
  open,
  onOpenChange,
  columns,
  rules,
  onRulesChange,
}: ColorRuleManagerProps<T>) {
  const [editingRule, setEditingRule] = useState<ColorRule | null>(null)
  const ruleNameId = useId()

  const createNewRule = (): ColorRule => ({
    id: crypto.randomUUID(),
    name: 'Nouvelle règle',
    columnId: columns[0]?.id || '',
    condition: 'equals',
    backgroundColor: PREDEFINED_COLORS[0].bg,
    textColor: PREDEFINED_COLORS[0].text,
    applyTo: 'cell',
    priority: rules.length + 1,
    enabled: true,
  })

  const handleAddRule = () => {
    const newRule = createNewRule()
    setEditingRule(newRule)
  }

  const handleSaveRule = () => {
    if (!editingRule) return

    const updatedRules = rules.find((r) => r.id === editingRule.id)
      ? rules.map((r) => (r.id === editingRule.id ? editingRule : r))
      : [...rules, editingRule]

    onRulesChange(updatedRules)
    setEditingRule(null)
  }

  const handleDeleteRule = (ruleId: string) => {
    onRulesChange(rules.filter((r) => r.id !== ruleId))
  }

  const handleToggleRule = (ruleId: string) => {
    onRulesChange(rules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r)))
  }

  return (
    <>
      <SimpleModal
        open={open}
        onOpenChange={onOpenChange}
        title="Règles de couleurs"
        maxWidth="max-w-4xl"
      >
        <div className="p-6">
          <div className="space-y-6">
            {/* Liste des règles existantes */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Règles configurées ({rules.length})</h3>
                <Button type="button" onClick={handleAddRule} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une règle
                </Button>
              </div>

              {rules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Palette className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune règle de couleur configurée</p>
                  <p className="text-sm">Cliquez sur "Ajouter une règle" pour commencer</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rules
                    .sort((a, b) => a.priority - b.priority)
                    .map((rule) => (
                      <div
                        key={rule.id}
                        className={`p-4 border rounded-lg ${rule.enabled ? '' : 'opacity-50'}`}
                        style={{
                          backgroundColor: rule.enabled ? rule.backgroundColor : undefined,
                          color: rule.enabled ? rule.textColor : undefined,
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                                {rule.enabled ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                )}
                                {rule.enabled ? 'Active' : 'Inactive'}
                              </Badge>

                              <Badge variant="outline">
                                {rule.applyTo === 'cell' ? 'Cellule' : 'Ligne'}
                              </Badge>

                              <span className="text-sm font-medium">Priorité: {rule.priority}</span>
                            </div>

                            <h4 className="font-medium mb-1">{rule.name}</h4>

                            <p className="text-sm">
                              Colonne{' '}
                              <strong>{columns.find((c) => c.id === rule.columnId)?.title}</strong>{' '}
                              {CONDITIONS.find(
                                (c) => c.value === rule.condition
                              )?.label.toLowerCase()}{' '}
                              {rule.condition === 'between'
                                ? `${rule.value} et ${rule.value2}`
                                : rule.condition === 'empty' || rule.condition === 'not_empty'
                                  ? ''
                                  : `"${rule.value}"`}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleRule(rule.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingRule(rule)}
                            >
                              <Zap className="h-4 w-4" />
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRule(rule.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </SimpleModal>

      {/* Dialog d'édition de règle */}
      {editingRule && (
        <SimpleModal
          open={!!editingRule}
          onOpenChange={() => setEditingRule(null)}
          title={
            rules.find((r) => r.id === editingRule.id) ? 'Modifier une règle' : 'Créer une règle'
          }
          maxWidth="max-w-lg"
        >
          <div className="p-6">
            <div className="space-y-4">
              {/* Nom de la règle */}
              <div>
                <Label htmlFor={ruleNameId}>Nom de la règle</Label>
                <Input
                  id={ruleNameId}
                  value={editingRule.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditingRule((prev) => (prev ? { ...prev, name: e.target.value } : null))
                  }
                  placeholder="Ex: Valeurs élevées"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Colonne */}
                <div>
                  <Label>Colonne</Label>
                  <CustomSelect
                    value={editingRule.columnId}
                    onValueChange={(value) =>
                      setEditingRule((prev) => (prev ? { ...prev, columnId: value } : null))
                    }
                    placeholder="Sélectionner une colonne"
                    options={columns.map((col) => ({ value: col.id, label: col.title }))}
                  />
                </div>

                {/* Condition */}
                <div>
                  <Label>Condition</Label>
                  <CustomSelect
                    value={editingRule.condition}
                    onValueChange={(value: string) =>
                      setEditingRule((prev) =>
                        prev ? { ...prev, condition: value as ColorRule['condition'] } : null
                      )
                    }
                    placeholder="Sélectionner une condition"
                    options={CONDITIONS.map((cond) => ({ value: cond.value, label: cond.label }))}
                  />
                </div>
              </div>

              {/* Valeurs */}
              {editingRule.condition !== 'empty' && editingRule.condition !== 'not_empty' && (
                <div
                  className={editingRule.condition === 'between' ? 'grid grid-cols-2 gap-4' : ''}
                >
                  <div>
                    <Label>Valeur</Label>
                    <Input
                      value={editingRule.value || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditingRule((prev) => (prev ? { ...prev, value: e.target.value } : null))
                      }
                      placeholder="Valeur à comparer"
                    />
                  </div>

                  {editingRule.condition === 'between' && (
                    <div>
                      <Label>Valeur 2</Label>
                      <Input
                        value={editingRule.value2 || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditingRule((prev) =>
                            prev ? { ...prev, value2: e.target.value } : null
                          )
                        }
                        placeholder="Valeur de fin"
                      />
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Couleurs prédéfinies */}
              <div>
                <Label className="mb-2 block">Couleurs prédéfinies</Label>
                <div className="grid grid-cols-4 gap-2">
                  {PREDEFINED_COLORS.map((color, _index) => (
                    <button
                      key={`color-${color.bg}-${color.text}`}
                      type="button"
                      className="p-3 rounded border text-sm font-medium hover:scale-105 transition-transform"
                      style={{ backgroundColor: color.bg, color: color.text }}
                      onClick={() =>
                        setEditingRule((prev) =>
                          prev
                            ? {
                                ...prev,
                                backgroundColor: color.bg,
                                textColor: color.text,
                              }
                            : null
                        )
                      }
                    >
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Application */}
              <div>
                <Label>Appliquer à</Label>
                <CustomSelect
                  value={editingRule.applyTo}
                  onValueChange={(value: string) =>
                    setEditingRule((prev) =>
                      prev ? { ...prev, applyTo: value as 'cell' | 'row' } : null
                    )
                  }
                  placeholder="Sélectionner où appliquer"
                  options={[
                    { value: 'cell', label: 'Cellule uniquement' },
                    { value: 'row', label: 'Ligne entière' },
                  ]}
                />
              </div>

              {/* Aperçu */}
              <div>
                <Label className="mb-2 block">Aperçu</Label>
                <div
                  className="p-3 border rounded"
                  style={{
                    backgroundColor: editingRule.backgroundColor,
                    color: editingRule.textColor,
                  }}
                >
                  Exemple de texte avec cette règle appliquée
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditingRule(null)}>
              Annuler
            </Button>
            <Button type="button" onClick={handleSaveRule}>
              Enregistrer
            </Button>
          </div>
        </SimpleModal>
      )}
    </>
  )
}

export default ColorRuleManager
