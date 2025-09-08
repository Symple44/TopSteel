'use client'

import { Eye, Layout, Palette, RotateCcw, Save, Settings, Zap } from 'lucide-react'
import { useState } from 'react'
import { useFormFieldIds } from '../../../hooks/useFormFieldIds'
import { cn } from '../../../lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '../../layout/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../navigation/tabs'
import { Button } from '../../primitives/button'
import { Switch } from '../../primitives/switch'
import { Badge } from '../badge'
import type { ReorderableListConfig } from './reorderable-list-theme'
import { defaultThemes } from './reorderable-list-themes'

interface CustomizationPanelProps {
  config: ReorderableListConfig
  onConfigChange: (config: Partial<ReorderableListConfig>) => void
  onSave: () => void
  onReset: () => void
  saving?: boolean
  className?: string
  position?: 'top' | 'right' | 'bottom' | 'left'
}

export function ReorderableListCustomizationPanel({
  config,
  onConfigChange,
  onSave,
  onReset,
  saving = false,
  className,
  position = 'right',
}: CustomizationPanelProps) {
  const ids = useFormFieldIds([
    'maxDepth',
    'allowNesting',
    'levelIndicators',
    'connectionLines',
    'animations',
    'compactMode',
    'defaultExpanded',
  ])
  const [activeTab, setActiveTab] = useState('theme')

  // Gestionnaires pour les changements
  const handleThemeChange = (themeId: string) => {
    onConfigChange({ theme: themeId })
  }

  const handlePreferenceChange = (key: keyof ReorderableListConfig['preferences'], value: any) => {
    onConfigChange({
      preferences: {
        ...config.preferences,
        [key]: value,
      },
    })
  }

  const handleLayoutChange = (key: keyof ReorderableListConfig['layout'], value: any) => {
    onConfigChange({
      layout: {
        ...config.layout,
        [key]: value,
      },
    })
  }

  const positionClasses = {
    top: 'border-b',
    right: 'border-l',
    bottom: 'border-t',
    left: 'border-r',
  }

  return (
    <Card
      className={cn(
        'w-80 bg-card/95 backdrop-blur-sm border-border/50',
        positionClasses[position],
        className
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Settings className="h-4 w-4" />
          Personnalisation
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="theme" className="text-xs">
              <Palette className="h-3 w-3 mr-1" />
              Thème
            </TabsTrigger>
            <TabsTrigger value="layout" className="text-xs">
              <Layout className="h-3 w-3 mr-1" />
              Layout
            </TabsTrigger>
            <TabsTrigger value="behavior" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Options
            </TabsTrigger>
          </TabsList>

          {/* Onglet Thèmes */}
          <TabsContent value="theme" className="space-y-3 mt-4">
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">Sélection du thème</h4>
              <div className="grid grid-cols-1 gap-2">
                {Object.values(defaultThemes).map((theme) => (
                  <button
                    type="button"
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id)}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-lg border transition-all text-left',
                      'hover:bg-accent/50 hover:border-primary/30',
                      config.theme === theme.id
                        ? 'bg-primary/10 border-primary/50'
                        : 'bg-card border-border'
                    )}
                  >
                    <div>
                      <div className="font-medium text-sm">{theme.name}</div>
                      {theme.description && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {theme.description}
                        </div>
                      )}
                    </div>
                    {config.theme === theme.id && (
                      <Badge variant="secondary" className="text-xs">
                        Actif
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Onglet Layout */}
          <TabsContent value="layout" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div>
                <label
                  htmlFor={ids.maxDepth}
                  className="text-xs font-medium text-muted-foreground mb-2 block"
                >
                  Profondeur maximale: {config.layout.maxDepth}
                </label>
                <input
                  type="range"
                  id={ids.maxDepth}
                  value={config.layout.maxDepth}
                  onChange={(e) => handleLayoutChange('maxDepth', parseInt(e.target.value, 10))}
                  min={1}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <label
                  htmlFor={ids.allowNesting}
                  className="text-xs font-medium text-muted-foreground"
                >
                  Imbrication autorisée
                </label>
                <Switch
                  id={ids.allowNesting}
                  checked={config.layout.allowNesting}
                  onCheckedChange={(checked: boolean) =>
                    handleLayoutChange('allowNesting', checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Position de la poignée
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={config.layout.dragHandlePosition === 'left' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleLayoutChange('dragHandlePosition', 'left')}
                    className="flex-1 text-xs"
                  >
                    Gauche
                  </Button>
                  <Button
                    type="button"
                    variant={config.layout.dragHandlePosition === 'right' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleLayoutChange('dragHandlePosition', 'right')}
                    className="flex-1 text-xs"
                  >
                    Droite
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Onglet Comportement */}
          <TabsContent value="behavior" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-3 w-3" />
                  <label htmlFor={ids.levelIndicators} className="text-xs font-medium">
                    Indicateurs de niveau
                  </label>
                </div>
                <Switch
                  id={ids.levelIndicators}
                  checked={config.preferences.showLevelIndicators}
                  onCheckedChange={(checked: boolean) =>
                    handlePreferenceChange('showLevelIndicators', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-3 w-3" />
                  <label htmlFor={ids.connectionLines} className="text-xs font-medium">
                    Lignes de connexion
                  </label>
                </div>
                <Switch
                  id={ids.connectionLines}
                  checked={config.preferences.showConnectionLines}
                  onCheckedChange={(checked: boolean) =>
                    handlePreferenceChange('showConnectionLines', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3" />
                  <label htmlFor={ids.animations} className="text-xs font-medium">
                    Animations
                  </label>
                </div>
                <Switch
                  id={ids.animations}
                  checked={config.preferences.enableAnimations}
                  onCheckedChange={(checked: boolean) =>
                    handlePreferenceChange('enableAnimations', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layout className="h-3 w-3" />
                  <label htmlFor={ids.compactMode} className="text-xs font-medium">
                    Mode compact
                  </label>
                </div>
                <Switch
                  id={ids.compactMode}
                  checked={config.preferences.compactMode}
                  onCheckedChange={(checked: boolean) =>
                    handlePreferenceChange('compactMode', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-3 w-3" />
                  <label htmlFor={ids.defaultExpanded} className="text-xs font-medium">
                    Expansion par défaut
                  </label>
                </div>
                <Switch
                  id={ids.defaultExpanded}
                  checked={config.preferences.defaultExpanded}
                  onCheckedChange={(checked: boolean) =>
                    handlePreferenceChange('defaultExpanded', checked)
                  }
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border/50">
          <Button type="button" onClick={onSave} disabled={saving} size="sm" className="flex-1">
            <Save className="h-3 w-3 mr-1" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
          <Button type="button" onClick={onReset} variant="outline" size="sm">
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>

        {/* Informations */}
        <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
          <div>Composant: {config.componentId}</div>
          <div>Thème: {config.theme}</div>
          <div>Modifié: {config.updatedAt.toLocaleString()}</div>
        </div>
      </CardContent>
    </Card>
  )
}
