'use client'

import { Button } from '../../primitives/button'
import { Label } from '../../primitives'
import { Separator } from '../../primitives'
import { Calendar, Clock, Grid3x3, Kanban, Settings, Table } from 'lucide-react'
import React, { useState } from 'react'
import { DropdownItem, DropdownPortal, DropdownSeparator } from '../../primitives/dropdown-portal'
import { SimpleTooltip } from '../../primitives/tooltip'
import { cn } from '../../../lib/utils'
import { CustomSelect } from './CustomSelect'
import { SimpleModal } from './SimpleModal'
import type { ColumnConfig } from './types'
import type { ViewConfig, ViewSettings, ViewType } from './use-data-views'

const VIEW_ICONS: Record<ViewType, React.ComponentType<{ className?: string }>> = {
  table: Table,
  kanban: Kanban,
  cards: Grid3x3,
  timeline: Clock,
  calendar: Calendar,
}

interface ViewSelectorProps<T = any> {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  availableViews: ViewConfig[]
  columns: ColumnConfig<T>[]
  viewConfigs: Record<ViewType, ViewConfig>
  onViewConfigUpdate: (viewType: ViewType, settings: ViewSettings) => void
}

export function ViewSelector<T = any>({
  currentView,
  onViewChange,
  availableViews,
  columns,
  viewConfigs,
  onViewConfigUpdate,
}: ViewSelectorProps<T>) {
  const [showSettings, setShowSettings] = useState(false)
  const [settingsView, setSettingsView] = useState<ViewType>('table')

  const handleOpenSettings = (viewType: ViewType) => {
    setSettingsView(viewType)
    setShowSettings(true)
  }

  const handleSaveSettings = (viewType: ViewType, settings: ViewSettings) => {
    onViewConfigUpdate(viewType, settings)
    setShowSettings(false)
  }

  return (
    <>
      {/* Sélecteur de vue compact */}
      <DropdownPortal
        align="end"
        trigger={
          <SimpleTooltip
            content={`Mode d'affichage: ${availableViews.find((v) => v.type === currentView)?.name || 'Tableau'}`}
          >
            <Button variant="outline" size="sm" className="h-7 w-7 p-0">
              {(() => {
                const currentViewConfig = availableViews.find((v) => v.type === currentView)
                const IconComponent = currentViewConfig ? VIEW_ICONS[currentViewConfig.type] : Table
                return <IconComponent className="h-3 w-3" />
              })()}
            </Button>
          </SimpleTooltip>
        }
      >
        {availableViews.map((view) => {
          const IconComponent = VIEW_ICONS[view.type]
          const isActive = currentView === view.type

          return (
            <React.Fragment key={view.type}>
              <DropdownItem
                onClick={() => onViewChange(view.type)}
                className={
                  isActive
                    ? 'bg-accent text-accent-foreground font-semibold'
                    : 'text-foreground font-medium hover:bg-accent/50 hover:text-accent-foreground'
                }
              >
                <IconComponent
                  className={cn(
                    'h-4 w-4 mr-2',
                    isActive ? 'text-accent-foreground' : 'text-muted-foreground'
                  )}
                />
                <span className="flex-1">{view.name}</span>
                {isActive && <div className="ml-auto w-2 h-2 bg-accent-foreground rounded-full" />}
              </DropdownItem>

              {view.type !== 'table' && (
                <DropdownItem
                  onClick={() => handleOpenSettings(view.type)}
                  className="text-muted-foreground font-medium hover:bg-muted hover:text-foreground"
                >
                  <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">Configurer {view.name}</span>
                </DropdownItem>
              )}

              {view.type !== availableViews[availableViews.length - 1].type && (
                <DropdownSeparator />
              )}
            </React.Fragment>
          )
        })}
      </DropdownPortal>

      {/* Dialog de configuration */}
      <SimpleModal
        open={showSettings}
        onOpenChange={setShowSettings}
        title={`Configuration de la vue ${viewConfigs[settingsView]?.name}`}
        maxWidth="max-w-2xl"
      >
        <ViewSettingsForm
          viewType={settingsView}
          config={viewConfigs[settingsView]}
          columns={columns}
          onSave={(settings) => handleSaveSettings(settingsView, settings)}
          onCancel={() => setShowSettings(false)}
        />
      </SimpleModal>
    </>
  )
}

interface ViewSettingsFormProps<T = any> {
  viewType: ViewType
  config: ViewConfig
  columns: ColumnConfig<T>[]
  onSave: (settings: ViewSettings) => void
  onCancel: () => void
}

function ViewSettingsForm<T = any>({
  viewType,
  config,
  columns,
  onSave,
  onCancel,
}: ViewSettingsFormProps<T>) {
  const [settings, setSettings] = useState<ViewSettings>(config.settings)

  const updateSettings = (key: string, value: any) => {
    if (viewType === 'kanban') {
      setSettings((prev: any) => ({
        ...prev,
        kanban: {
          ...prev.kanban,
          [key]: value,
        },
      }))
    } else if (viewType === 'cards') {
      setSettings((prev: any) => ({
        ...prev,
        cards: {
          ...prev.cards,
          [key]: value,
        },
      }))
    } else if (viewType === 'timeline') {
      setSettings((prev: any) => ({
        ...prev,
        timeline: {
          ...prev.timeline,
          [key]: value,
        },
      }))
    } else if (viewType === 'calendar') {
      setSettings((prev: any) => ({
        ...prev,
        calendar: {
          ...prev.calendar,
          [key]: value,
        },
      }))
    } else {
      // Fallback for other view types
      setSettings((prev: any) => ({
        ...prev,
        [viewType]: {
          ...prev[viewType as keyof ViewSettings],
          [key]: value,
        },
      }))
    }
  }

  if (viewType === 'kanban') {
    const kanbanSettings = settings.kanban || {
      statusColumn: '',
      cardTitleColumn: '',
      cardSubtitleColumn: '',
      cardDescriptionColumn: '',
      cardImageColumn: '',
      cardLabelsColumns: [],
      metaColumns: [],
    }

    return (
      <>
        <div className="p-6">
          <div className="space-y-6">
            {/* Configuration de base */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Configuration de base</h3>

              <div>
                <Label>Colonne de statut (obligatoire)</Label>
                <CustomSelect
                  value={kanbanSettings.statusColumn}
                  onValueChange={(value) => updateSettings('statusColumn', value)}
                  placeholder="Sélectionner une colonne"
                  options={columns.map((col) => ({ value: col.id, label: col.title }))}
                />
              </div>

              <div>
                <Label>Colonne pour le titre des cartes</Label>
                <CustomSelect
                  value={kanbanSettings.cardTitleColumn}
                  onValueChange={(value) => updateSettings('cardTitleColumn', value)}
                  placeholder="Sélectionner une colonne"
                  options={columns.map((col) => ({ value: col.id, label: col.title }))}
                />
              </div>
            </div>

            {/* Contenu des cartes */}
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Contenu des cartes</h3>

              <div>
                <Label>Colonne pour le sous-titre (optionnel)</Label>
                <CustomSelect
                  value={kanbanSettings.cardSubtitleColumn || 'none'}
                  onValueChange={(value) =>
                    updateSettings('cardSubtitleColumn', value === 'none' ? undefined : value)
                  }
                  placeholder="Sélectionner une colonne"
                  options={[
                    { value: 'none', label: 'Aucune' },
                    ...columns.map((col) => ({ value: col.id, label: col.title })),
                  ]}
                />
              </div>

              <div>
                <Label>Colonne pour la description (optionnel)</Label>
                <CustomSelect
                  value={kanbanSettings.cardDescriptionColumn || 'none'}
                  onValueChange={(value) =>
                    updateSettings('cardDescriptionColumn', value === 'none' ? undefined : value)
                  }
                  placeholder="Sélectionner une colonne"
                  options={[
                    { value: 'none', label: 'Aucune' },
                    ...columns.map((col) => ({ value: col.id, label: col.title })),
                  ]}
                />
              </div>

              <div>
                <Label>Colonne pour l'image (optionnel)</Label>
                <CustomSelect
                  value={kanbanSettings.cardImageColumn || 'none'}
                  onValueChange={(value) =>
                    updateSettings('cardImageColumn', value === 'none' ? undefined : value)
                  }
                  placeholder="Sélectionner une colonne"
                  options={[
                    { value: 'none', label: 'Aucune' },
                    ...columns.map((col) => ({ value: col.id, label: col.title })),
                  ]}
                />
              </div>
            </div>

            {/* Métadonnées */}
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Informations supplémentaires</h3>

              <div>
                <Label>Colonnes pour les étiquettes (optionnel)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Sélectionnez jusqu'à 3 colonnes pour afficher des étiquettes colorées
                </p>
                {[0, 1, 2].map((index) => (
                  <div key={index} className="mb-2">
                    <CustomSelect
                      value={kanbanSettings.cardLabelsColumns?.[index] || 'none'}
                      onValueChange={(value) => {
                        const currentLabels = kanbanSettings.cardLabelsColumns || []
                        const newLabels = [...currentLabels]
                        if (value === 'none') {
                          // Remove this index by setting to empty string, will be filtered out
                          if (index < newLabels.length) {
                            newLabels.splice(index, 1, '')
                          }
                        } else {
                          // Ensure we have enough items in the array
                          while (newLabels.length <= index) {
                            newLabels.push('')
                          }
                          newLabels[index] = value
                        }
                        updateSettings('cardLabelsColumns', newLabels.filter(Boolean))
                      }}
                      placeholder={`Étiquette ${index + 1}`}
                      options={[
                        { value: 'none', label: 'Aucune' },
                        ...columns.map((col) => ({ value: col.id, label: col.title })),
                      ]}
                    />
                  </div>
                ))}
              </div>

              <div>
                <Label>Colonnes de métadonnées (optionnel)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Sélectionnez jusqu'à 3 colonnes pour afficher des informations en bas de carte
                </p>
                {[0, 1, 2].map((index) => (
                  <div key={index} className="mb-2">
                    <CustomSelect
                      value={kanbanSettings.metaColumns?.[index] || 'none'}
                      onValueChange={(value) => {
                        const currentMeta = kanbanSettings.metaColumns || []
                        const newMeta = [...currentMeta]
                        if (value === 'none') {
                          // Remove this index by setting to empty string, will be filtered out
                          if (index < newMeta.length) {
                            newMeta.splice(index, 1, '')
                          }
                        } else {
                          // Ensure we have enough items in the array
                          while (newMeta.length <= index) {
                            newMeta.push('')
                          }
                          newMeta[index] = value
                        }
                        updateSettings('metaColumns', newMeta.filter(Boolean))
                      }}
                      placeholder={`Métadonnée ${index + 1}`}
                      options={[
                        { value: 'none', label: 'Aucune' },
                        ...columns.map((col) => ({ value: col.id, label: col.title })),
                      ]}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={() => onSave(settings)}>Enregistrer</Button>
        </div>
      </>
    )
  }

  if (viewType === 'cards') {
    const cardsSettings = settings.cards || {
      titleColumn: '',
      subtitleColumn: '',
      descriptionColumn: '',
      imageColumn: '',
      metaColumns: [],
      cardsPerRow: 3,
    }

    return (
      <>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <Label>Colonne pour le titre</Label>
              <CustomSelect
                value={cardsSettings.titleColumn}
                onValueChange={(value) => updateSettings('titleColumn', value)}
                placeholder="Sélectionner une colonne"
                options={columns.map((col) => ({ value: col.id, label: col.title }))}
              />
            </div>

            <div>
              <Label>Colonne pour le sous-titre (optionnel)</Label>
              <CustomSelect
                value={cardsSettings.subtitleColumn || 'none'}
                onValueChange={(value) =>
                  updateSettings('subtitleColumn', value === 'none' ? undefined : value)
                }
                placeholder="Sélectionner une colonne"
                options={[
                  { value: 'none', label: 'Aucune' },
                  ...columns.map((col) => ({ value: col.id, label: col.title })),
                ]}
              />
            </div>

            <div>
              <Label>Colonne pour la description (optionnel)</Label>
              <CustomSelect
                value={cardsSettings.descriptionColumn || 'none'}
                onValueChange={(value) =>
                  updateSettings('descriptionColumn', value === 'none' ? undefined : value)
                }
                placeholder="Sélectionner une colonne"
                options={[
                  { value: 'none', label: 'Aucune' },
                  ...columns.map((col) => ({ value: col.id, label: col.title })),
                ]}
              />
            </div>

            <div>
              <Label>Colonne pour l'image (optionnel)</Label>
              <CustomSelect
                value={cardsSettings.imageColumn || 'none'}
                onValueChange={(value) =>
                  updateSettings('imageColumn', value === 'none' ? undefined : value)
                }
                placeholder="Sélectionner une colonne"
                options={[
                  { value: 'none', label: 'Aucune' },
                  ...columns.map((col) => ({ value: col.id, label: col.title })),
                ]}
              />
            </div>

            <Separator />

            <div>
              <Label>Colonnes de métadonnées (optionnel)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Sélectionnez jusqu'à 3 colonnes pour afficher des informations supplémentaires
              </p>
              {[0, 1, 2].map((index) => (
                <div key={index} className="mb-2">
                  <CustomSelect
                    value={cardsSettings.metaColumns?.[index] || 'none'}
                    onValueChange={(value) => {
                      const currentMeta = cardsSettings.metaColumns || []
                      const newMeta = [...currentMeta]
                      if (value === 'none') {
                        // Remove this index by setting to null, will be filtered out
                        if (index < newMeta.length) {
                          newMeta.splice(index, 1, '')
                        }
                      } else {
                        // Ensure we have enough items in the array
                        while (newMeta.length <= index) {
                          newMeta.push('')
                        }
                        newMeta[index] = value
                      }
                      updateSettings('metaColumns', newMeta.filter(Boolean))
                    }}
                    placeholder={`Métadonnée ${index + 1}`}
                    options={[
                      { value: 'none', label: 'Aucune' },
                      ...columns.map((col) => ({ value: col.id, label: col.title })),
                    ]}
                  />
                </div>
              ))}
            </div>

            <Separator />

            <div>
              <Label>Nombre de cartes par ligne</Label>
              <CustomSelect
                value={String(cardsSettings.cardsPerRow)}
                onValueChange={(value) => updateSettings('cardsPerRow', parseInt(value))}
                placeholder="Nombre de cartes"
                options={[
                  { value: '1', label: '1' },
                  { value: '2', label: '2' },
                  { value: '3', label: '3' },
                  { value: '4', label: '4' },
                  { value: '5', label: '5' },
                  { value: '6', label: '6' },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={() => onSave(settings)}>Enregistrer</Button>
        </div>
      </>
    )
  }

  if (viewType === 'timeline') {
    const timelineSettings = settings.timeline || {
      dateColumn: '',
      titleColumn: '',
    }

    return (
      <>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <Label>Colonne de date</Label>
              <CustomSelect
                value={timelineSettings.dateColumn}
                onValueChange={(value) => updateSettings('dateColumn', value)}
                placeholder="Sélectionner une colonne"
                options={columns.map((col) => ({ value: col.id, label: col.title }))}
              />
            </div>

            <div>
              <Label>Colonne pour le titre</Label>
              <CustomSelect
                value={timelineSettings.titleColumn}
                onValueChange={(value) => updateSettings('titleColumn', value)}
                placeholder="Sélectionner une colonne"
                options={columns.map((col) => ({ value: col.id, label: col.title }))}
              />
            </div>

            <div>
              <Label>Colonne de catégorie (optionnel)</Label>
              <CustomSelect
                value={timelineSettings.categoryColumn || 'none'}
                onValueChange={(value) =>
                  updateSettings('categoryColumn', value === 'none' ? undefined : value)
                }
                placeholder="Sélectionner une colonne"
                options={[
                  { value: 'none', label: 'Aucune' },
                  ...columns.map((col) => ({ value: col.id, label: col.title })),
                ]}
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={() => onSave(settings)}>Enregistrer</Button>
        </div>
      </>
    )
  }

  if (viewType === 'calendar') {
    const calendarSettings = settings.calendar || {
      startDateColumn: '',
      titleColumn: '',
    }

    return (
      <>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <Label>Colonne de date de début (obligatoire)</Label>
              <CustomSelect
                value={calendarSettings.startDateColumn}
                onValueChange={(value) => updateSettings('startDateColumn', value)}
                placeholder="Sélectionner une colonne"
                options={columns.map((col) => ({ value: col.id, label: col.title }))}
              />
            </div>

            <div>
              <Label>Colonne pour le titre</Label>
              <CustomSelect
                value={calendarSettings.titleColumn}
                onValueChange={(value) => updateSettings('titleColumn', value)}
                placeholder="Sélectionner une colonne"
                options={columns.map((col) => ({ value: col.id, label: col.title }))}
              />
            </div>

            <div>
              <Label>Colonne de date de fin (optionnel)</Label>
              <CustomSelect
                value={calendarSettings.endDateColumn || 'none'}
                onValueChange={(value) =>
                  updateSettings('endDateColumn', value === 'none' ? undefined : value)
                }
                placeholder="Sélectionner une colonne"
                options={[
                  { value: 'none', label: 'Aucune' },
                  ...columns.map((col) => ({ value: col.id, label: col.title })),
                ]}
              />
            </div>

            <div>
              <Label>Colonne de catégorie (optionnel)</Label>
              <CustomSelect
                value={calendarSettings.categoryColumn || 'none'}
                onValueChange={(value) =>
                  updateSettings('categoryColumn', value === 'none' ? undefined : value)
                }
                placeholder="Sélectionner une colonne"
                options={[
                  { value: 'none', label: 'Aucune' },
                  ...columns.map((col) => ({ value: col.id, label: col.title })),
                ]}
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={() => onSave(settings)}>Enregistrer</Button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="p-6">
        <p>Configuration non disponible pour cette vue.</p>
      </div>

      <div className="p-6 border-t border-border">
        <Button onClick={onCancel}>Fermer</Button>
      </div>
    </>
  )
}

export default ViewSelector
