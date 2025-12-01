'use client'

import { Badge, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Textarea } from '@erp/ui'
import { Settings } from 'lucide-react'
import type { QueryBuilderData } from '../../../../../types/query-builder.types'

interface SettingsTabProps {
  queryBuilder: QueryBuilderData
  onSettingsChange: (updates: Partial<QueryBuilderData>) => void
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250, 500]
const EXPORT_FORMAT_OPTIONS = ['csv', 'excel', 'json', 'pdf']

export function SettingsTab({ queryBuilder, onSettingsChange }: SettingsTabProps) {
  const settings = queryBuilder.settings || {
    enablePagination: true,
    pageSize: 25,
    enableSorting: true,
    enableFiltering: true,
    enableExport: true,
    exportFormats: ['csv', 'excel'],
  }

  const handleSettingChange = (key: string, value: unknown) => {
    onSettingsChange({
      settings: {
        ...settings,
        [key]: value,
      },
    })
  }

  const toggleExportFormat = (format: string) => {
    const currentFormats = settings.exportFormats || []
    const newFormats = currentFormats.includes(format)
      ? currentFormats.filter((f) => f !== format)
      : [...currentFormats, format]
    handleSettingChange('exportFormats', newFormats)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Settings className="h-4 w-4" />
        <h3 className="font-semibold text-sm">Paramètres de la requête</h3>
      </div>

      {/* General Settings */}
      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Informations générales
        </h4>

        <div className="grid gap-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Nom de la requête</label>
            <Input
              value={queryBuilder.name}
              onChange={(e) => onSettingsChange({ name: e.target.value })}
              className="h-9"
              placeholder="Ma requête"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <Textarea
              value={queryBuilder.description || ''}
              onChange={(e) => onSettingsChange({ description: e.target.value })}
              className="min-h-[60px]"
              placeholder="Description optionnelle de la requête..."
            />
          </div>
        </div>
      </div>

      {/* Display Settings */}
      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Affichage
        </h4>

        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Taille de page par défaut</label>
              <p className="text-xs text-muted-foreground">Nombre de lignes affichées par page</p>
            </div>
            <Select
              value={String(settings.pageSize || 25)}
              onValueChange={(v) => handleSettingChange('pageSize', parseInt(v))}
            >
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Pagination</label>
              <p className="text-xs text-muted-foreground">Activer la pagination des résultats</p>
            </div>
            <Switch
              checked={settings.enablePagination !== false}
              onCheckedChange={(checked) => handleSettingChange('enablePagination', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Tri</label>
              <p className="text-xs text-muted-foreground">Permettre le tri par colonnes</p>
            </div>
            <Switch
              checked={settings.enableSorting !== false}
              onCheckedChange={(checked) => handleSettingChange('enableSorting', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Filtrage</label>
              <p className="text-xs text-muted-foreground">Activer les filtres sur les colonnes</p>
            </div>
            <Switch
              checked={settings.enableFiltering !== false}
              onCheckedChange={(checked) => handleSettingChange('enableFiltering', checked)}
            />
          </div>
        </div>
      </div>

      {/* Export Settings */}
      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Export
        </h4>

        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Export des données</label>
              <p className="text-xs text-muted-foreground">Permettre l'export des résultats</p>
            </div>
            <Switch
              checked={settings.enableExport !== false}
              onCheckedChange={(checked) => handleSettingChange('enableExport', checked)}
            />
          </div>

          {settings.enableExport !== false && (
            <div className="ml-4 pl-4 border-l">
              <label className="text-sm font-medium mb-2 block">Formats d'export disponibles</label>
              <div className="flex flex-wrap gap-2">
                {EXPORT_FORMAT_OPTIONS.map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => toggleExportFormat(format)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      (settings.exportFormats || []).includes(format)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted border-muted-foreground/30 hover:border-primary'
                    }`}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="space-y-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Avancé
        </h4>

        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Limite de résultats</label>
              <p className="text-xs text-muted-foreground">Nombre maximum de lignes retournées</p>
            </div>
            <Input
              type="number"
              value={queryBuilder.maxRows || 1000}
              onChange={(e) => onSettingsChange({ maxRows: parseInt(e.target.value) })}
              className="h-8 w-24"
              min={100}
              max={10000}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Requête publique</label>
              <p className="text-xs text-muted-foreground">Visible par tous les utilisateurs</p>
            </div>
            <Switch
              checked={queryBuilder.isPublic === true}
              onCheckedChange={(checked) => onSettingsChange({ isPublic: checked })}
            />
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="p-3 bg-muted/30 rounded-lg space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground mb-2">Résumé</h4>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Table principale</span>
          <Badge variant="outline">{queryBuilder.mainTable || 'Non définie'}</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Colonnes</span>
          <span>{queryBuilder.columns.length}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Jointures</span>
          <span>{queryBuilder.joins.length}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Champs calculés</span>
          <span>{queryBuilder.calculatedFields.length}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Visibilité</span>
          <Badge variant={queryBuilder.isPublic ? 'default' : 'secondary'}>
            {queryBuilder.isPublic ? 'Public' : 'Privé'}
          </Badge>
        </div>
      </div>
    </div>
  )
}
