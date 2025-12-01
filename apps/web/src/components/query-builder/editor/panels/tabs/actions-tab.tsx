'use client'

import { Badge, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '@erp/ui'
import {
  ChevronDown,
  ChevronRight,
  Edit,
  ExternalLink,
  Eye,
  MousePointerClick,
  Plus,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import type { QueryBuilderData, RowActionConfig, RowActionsSettings, RowActionType } from '../../../../../types/query-builder.types'

interface ActionsTabProps {
  settings: QueryBuilderData['settings']
  onSettingsChange: (updates: Partial<QueryBuilderData>) => void
}

const ACTION_TYPES: { value: RowActionType; label: string; icon: typeof Eye; description: string }[] = [
  { value: 'navigation', label: 'Navigation', icon: Eye, description: 'Naviguer vers une page' },
  { value: 'edit', label: 'Modifier', icon: Edit, description: 'Éditer l\'enregistrement' },
  { value: 'delete', label: 'Supprimer', icon: Trash2, description: 'Supprimer l\'enregistrement' },
  { value: 'modal', label: 'Modal', icon: MousePointerClick, description: 'Ouvrir un modal' },
  { value: 'external', label: 'Lien externe', icon: ExternalLink, description: 'Ouvrir un lien' },
]

const ACTION_VARIANTS = [
  { value: 'default', label: 'Par défaut' },
  { value: 'secondary', label: 'Secondaire' },
  { value: 'destructive', label: 'Destructif' },
  { value: 'outline', label: 'Contour' },
  { value: 'ghost', label: 'Fantôme' },
]

export function ActionsTab({ settings, onSettingsChange }: ActionsTabProps) {
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set())

  // Get row actions from settings
  const rowActionsSettings: RowActionsSettings = settings?.rowActions || { enabled: false, actions: [] }
  const rowActions = rowActionsSettings.actions || []

  const updateRowActions = (newActions: RowActionConfig[]) => {
    onSettingsChange({
      settings: {
        ...settings,
        rowActions: {
          ...rowActionsSettings,
          actions: newActions,
        },
      },
    })
  }

  const handleAddAction = () => {
    const newAction: RowActionConfig = {
      id: `action_${Date.now()}`,
      type: 'navigation',
      label: 'Nouvelle action',
      icon: 'Eye',
      variant: 'default',
    }
    updateRowActions([...rowActions, newAction])
    setExpandedActions((prev) => new Set([...prev, newAction.id]))
  }

  const handleUpdateAction = (id: string, updates: Partial<RowActionConfig>) => {
    updateRowActions(rowActions.map((a) => (a.id === id ? { ...a, ...updates } : a)))
  }

  const handleRemoveAction = (id: string) => {
    updateRowActions(rowActions.filter((a) => a.id !== id))
    setExpandedActions((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const toggleExpand = (id: string) => {
    setExpandedActions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleRowActionsEnabled = (enabled: boolean) => {
    onSettingsChange({
      settings: {
        ...settings,
        rowActions: {
          ...rowActionsSettings,
          enabled,
        },
      },
    })
  }

  const getActionTypeInfo = (type: RowActionType) => {
    return ACTION_TYPES.find((t) => t.value === type)
  }

  return (
    <div className="space-y-4">
      {/* Enable/Disable Row Actions */}
      <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
        <div>
          <label className="text-sm font-medium">Activer les actions de ligne</label>
          <p className="text-xs text-muted-foreground">Afficher des boutons d'action sur chaque ligne</p>
        </div>
        <Switch
          checked={rowActionsSettings.enabled}
          onCheckedChange={toggleRowActionsEnabled}
        />
      </div>

      {rowActionsSettings.enabled && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">
              Actions configurées ({rowActions.length})
            </h3>
            <Button size="sm" variant="outline" onClick={handleAddAction}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une action
            </Button>
          </div>

          {rowActions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
              <MousePointerClick className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune action configurée</p>
              <p className="text-xs mt-1">Les actions permettent d'interagir avec chaque ligne</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rowActions.map((action) => {
                const isExpanded = expandedActions.has(action.id)
                const typeInfo = getActionTypeInfo(action.type)
                const IconComponent = typeInfo?.icon || MousePointerClick

                return (
                  <div key={action.id} className="border rounded-lg bg-card overflow-hidden">
                    {/* Action Header */}
                    <div
                      className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleExpand(action.id)}
                    >
                      <button type="button" className="p-0.5">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <IconComponent className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm flex-1">{action.label}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {typeInfo?.label || action.type}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveAction(action.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Action Content */}
                    {isExpanded && (
                      <div className="p-3 pt-0 space-y-3 border-t">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Type d'action</label>
                            <Select
                              value={action.type}
                              onValueChange={(v) => handleUpdateAction(action.id, { type: v as RowActionType })}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ACTION_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    <div className="flex items-center gap-2">
                                      <type.icon className="h-4 w-4" />
                                      <span>{type.label}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Libellé</label>
                            <Input
                              value={action.label}
                              onChange={(e) => handleUpdateAction(action.id, { label: e.target.value })}
                              className="h-8 text-sm"
                              placeholder="Libellé du bouton"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Style</label>
                            <Select
                              value={action.variant || 'default'}
                              onValueChange={(v) => handleUpdateAction(action.id, { variant: v as RowActionConfig['variant'] })}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ACTION_VARIANTS.map((variant) => (
                                  <SelectItem key={variant.value} value={variant.value}>
                                    {variant.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Champ ID</label>
                            <Input
                              value={action.idField || ''}
                              onChange={(e) => handleUpdateAction(action.id, { idField: e.target.value })}
                              className="h-8 text-sm"
                              placeholder="id"
                            />
                          </div>
                        </div>

                        {(action.type === 'navigation' || action.type === 'external') && (
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">
                              URL cible (utiliser {'{id}'} pour l'ID de la ligne)
                            </label>
                            <Input
                              value={action.target || ''}
                              onChange={(e) => handleUpdateAction(action.id, { target: e.target.value })}
                              className="h-8 text-sm font-mono"
                              placeholder="/users/{id}/edit"
                            />
                          </div>
                        )}

                        {action.type === 'delete' && (
                          <>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">
                                Message de confirmation
                              </label>
                              <Input
                                value={action.confirmMessage || ''}
                                onChange={(e) => handleUpdateAction(action.id, { confirmMessage: e.target.value })}
                                className="h-8 text-sm"
                                placeholder="Êtes-vous sûr de vouloir supprimer cet élément ?"
                              />
                            </div>
                            <div className="p-2 bg-destructive/10 rounded text-xs text-destructive">
                              <p className="font-medium">Attention</p>
                              <p>Cette action supprimera définitivement les données.</p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Quick add common actions */}
          {rowActions.length === 0 && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">Actions courantes:</p>
              <div className="flex flex-wrap gap-2">
                {ACTION_TYPES.slice(0, 3).map((type) => (
                  <Button
                    key={type.value}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      const newAction: RowActionConfig = {
                        id: `action_${Date.now()}`,
                        type: type.value,
                        label: type.label,
                        icon: type.icon.displayName || 'Eye',
                        variant: 'default',
                      }
                      updateRowActions([...rowActions, newAction])
                    }}
                  >
                    <type.icon className="h-3 w-3 mr-1" />
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
