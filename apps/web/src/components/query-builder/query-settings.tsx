'use client'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from '@erp/ui'
import {
  Database,
  Edit,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  MousePointerClick,
  Plus,
  Settings2,
  Shield,
  Trash2,
  X,
} from 'lucide-react'
import { useState } from 'react'
import type {
  QuerySettingsProps,
  RowActionConfig,
  RowActionType,
} from '../../types/query-builder.types'

// Available icons for row actions
const ACTION_ICONS: { value: string; label: string }[] = [
  { value: 'Eye', label: 'View' },
  { value: 'Edit', label: 'Edit' },
  { value: 'Trash2', label: 'Delete' },
  { value: 'ExternalLink', label: 'External Link' },
]

// Get icon component from name
const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'Eye':
      return Eye
    case 'Edit':
      return Edit
    case 'Trash2':
      return Trash2
    case 'ExternalLink':
      return ExternalLink
    default:
      return Eye
  }
}

// Action types with labels
const ACTION_TYPES: { value: RowActionType; label: string }[] = [
  { value: 'navigation', label: 'Navigate to page' },
  { value: 'external', label: 'Open external URL' },
  { value: 'modal', label: 'Open modal' },
  { value: 'edit', label: 'Edit row' },
  { value: 'delete', label: 'Delete row' },
  { value: 'callback', label: 'Custom callback' },
]

// Default new action
const createDefaultAction = (): RowActionConfig => ({
  id: `action_${Date.now()}`,
  label: 'New Action',
  icon: 'Eye',
  type: 'navigation',
  target: '',
  variant: 'default',
})

export function QuerySettings({ settings, onSettingsChange }: QuerySettingsProps) {
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null)

  const handleSettingChange = (key: string, value: unknown) => {
    if (key?.includes('.')) {
      const [parent, child] = key.split('.')
      if (parent === 'settings' && typeof settings.settings === 'object') {
        onSettingsChange({
          settings: {
            ...settings.settings,
            [child]: value,
          },
        })
      }
    } else {
      onSettingsChange({ [key]: value })
    }
  }

  // Row Actions management
  const rowActions = settings.settings?.rowActions
  const isRowActionsEnabled = rowActions?.enabled ?? false
  const actions = rowActions?.actions ?? []

  const handleRowActionsEnabledChange = (enabled: boolean) => {
    onSettingsChange({
      settings: {
        ...settings.settings,
        rowActions: {
          enabled,
          actions: actions,
        },
      },
    })
  }

  const handleAddAction = () => {
    const newAction = createDefaultAction()
    onSettingsChange({
      settings: {
        ...settings.settings,
        rowActions: {
          enabled: true,
          actions: [...actions, newAction],
        },
      },
    })
    setExpandedActionId(newAction.id)
  }

  const handleRemoveAction = (actionId: string) => {
    onSettingsChange({
      settings: {
        ...settings.settings,
        rowActions: {
          enabled: isRowActionsEnabled,
          actions: actions.filter((a) => a.id !== actionId),
        },
      },
    })
    if (expandedActionId === actionId) {
      setExpandedActionId(null)
    }
  }

  const handleUpdateAction = (actionId: string, updates: Partial<RowActionConfig>) => {
    onSettingsChange({
      settings: {
        ...settings.settings,
        rowActions: {
          enabled: isRowActionsEnabled,
          actions: actions.map((a) => (a.id === actionId ? { ...a, ...updates } : a)),
        },
      },
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Query Builder Name</Label>
            <Input
              value={settings.name}
              onChange={(e) => handleSettingChange('name', e?.target?.value)}
              placeholder="My Query Builder"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={settings.description || ''}
              onChange={(e) => handleSettingChange('description', e?.target?.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div>
            <Label>Database</Label>
            <Select
              value={settings.database}
              onValueChange={(value) => handleSettingChange('database', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Database</SelectItem>
                <SelectItem value="analytics">Analytics Database</SelectItem>
                <SelectItem value="reporting">Reporting Database</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Public Access</Label>
              <p className="text-sm text-muted-foreground">
                Allow anyone to view and execute this query
              </p>
            </div>
            <Switch
              checked={settings.isPublic}
              onCheckedChange={(checked) => handleSettingChange('isPublic', checked)}
            />
          </div>

          <div>
            <Label>Maximum Rows</Label>
            <Input
              type="number"
              value={settings.maxRows || ''}
              onChange={(e) =>
                handleSettingChange(
                  'maxRows',
                  e?.target?.value ? parseInt(e?.target?.value, 10) : null
                )
              }
              placeholder="Unlimited"
            />
            <p className="text-sm text-muted-foreground mt-1">Leave empty for unlimited rows</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Query Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Pagination</Label>
              <p className="text-sm text-muted-foreground">
                Allow users to navigate through pages of results
              </p>
            </div>
            <Switch
              checked={settings.settings?.enablePagination ?? true}
              onCheckedChange={(checked) =>
                handleSettingChange('settings.enablePagination', checked)
              }
            />
          </div>

          {settings.settings?.enablePagination && (
            <div>
              <Label>Default Page Size</Label>
              <Select
                value={String(settings.settings?.pageSize || 50)}
                onValueChange={(value) =>
                  handleSettingChange('settings.pageSize', parseInt(value, 10))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                  <SelectItem value="100">100 rows</SelectItem>
                  <SelectItem value="250">250 rows</SelectItem>
                  <SelectItem value="500">500 rows</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Sorting</Label>
              <p className="text-sm text-muted-foreground">Allow users to sort columns</p>
            </div>
            <Switch
              checked={settings.settings?.enableSorting ?? true}
              onCheckedChange={(checked) => handleSettingChange('settings.enableSorting', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Filtering</Label>
              <p className="text-sm text-muted-foreground">Allow users to filter results</p>
            </div>
            <Switch
              checked={settings.settings?.enableFiltering ?? true}
              onCheckedChange={(checked) =>
                handleSettingChange('settings.enableFiltering', checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Export Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Export</Label>
              <p className="text-sm text-muted-foreground">Allow users to export query results</p>
            </div>
            <Switch
              checked={settings.settings?.enableExport ?? true}
              onCheckedChange={(checked) => handleSettingChange('settings.enableExport', checked)}
            />
          </div>

          {settings.settings?.enableExport && (
            <div>
              <Label>Export Formats</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['csv', 'excel', 'json', 'pdf'].map((format) => {
                  const isEnabled = settings.settings?.exportFormats?.includes(format) ?? true
                  return (
                    <Badge
                      key={format}
                      variant={isEnabled ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const currentFormats = settings.settings?.exportFormats || [
                          'csv',
                          'excel',
                          'json',
                        ]
                        const newFormats = isEnabled
                          ? currentFormats.filter((f) => f !== format)
                          : [...currentFormats, format]
                        handleSettingChange('settings.exportFormats', newFormats)
                      }}
                    >
                      {format?.toUpperCase()}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Row Actions Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MousePointerClick className="h-5 w-5" />
            Row Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Row Actions</Label>
              <p className="text-sm text-muted-foreground">
                Add action buttons to each row in the results table
              </p>
            </div>
            <Switch
              checked={isRowActionsEnabled}
              onCheckedChange={handleRowActionsEnabledChange}
            />
          </div>

          {isRowActionsEnabled && (
            <div className="space-y-4">
              {/* Actions List */}
              <div className="space-y-2">
                {actions.map((action) => {
                  const IconComponent = getIconComponent(action.icon || 'Eye')
                  const isExpanded = expandedActionId === action.id

                  return (
                    <div
                      key={action.id}
                      className="border rounded-lg overflow-hidden"
                    >
                      {/* Action Header */}
                      <button
                        type="button"
                        className="w-full flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 text-left"
                        onClick={() => setExpandedActionId(isExpanded ? null : action.id)}
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{action.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {ACTION_TYPES.find((t) => t.value === action.type)?.label || action.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveAction(action.id)
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </button>

                      {/* Action Details (expanded) */}
                      {isExpanded && (
                        <div className="p-4 space-y-4 border-t">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Label</Label>
                              <Input
                                value={action.label}
                                onChange={(e) =>
                                  handleUpdateAction(action.id, { label: e.target.value })
                                }
                                placeholder="Action label"
                              />
                            </div>
                            <div>
                              <Label>Icon</Label>
                              <Select
                                value={action.icon || 'Eye'}
                                onValueChange={(value) =>
                                  handleUpdateAction(action.id, { icon: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ACTION_ICONS.map((iconOption) => {
                                    const IconComp = getIconComponent(iconOption.value)
                                    return (
                                      <SelectItem key={iconOption.value} value={iconOption.value}>
                                        <span className="flex items-center gap-2">
                                          <IconComp className="h-4 w-4" />
                                          {iconOption.label}
                                        </span>
                                      </SelectItem>
                                    )
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Action Type</Label>
                              <Select
                                value={action.type}
                                onValueChange={(value) =>
                                  handleUpdateAction(action.id, { type: value as RowActionType })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ACTION_TYPES.map((typeOption) => (
                                    <SelectItem key={typeOption.value} value={typeOption.value}>
                                      {typeOption.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Variant</Label>
                              <Select
                                value={action.variant || 'default'}
                                onValueChange={(value) =>
                                  handleUpdateAction(action.id, {
                                    variant: value as RowActionConfig['variant'],
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="default">Default</SelectItem>
                                  <SelectItem value="outline">Outline</SelectItem>
                                  <SelectItem value="secondary">Secondary</SelectItem>
                                  <SelectItem value="ghost">Ghost</SelectItem>
                                  <SelectItem value="destructive">Destructive</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {(action.type === 'navigation' || action.type === 'external') && (
                            <div>
                              <Label>Target URL</Label>
                              <Input
                                value={action.target || ''}
                                onChange={(e) =>
                                  handleUpdateAction(action.id, { target: e.target.value })
                                }
                                placeholder="/admin/users/{id} or https://example.com/{id}"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Use {'{fieldName}'} to insert row values. Example: /users/{'{id}'}/edit
                              </p>
                            </div>
                          )}

                          {action.type === 'delete' && (
                            <div>
                              <Label>Confirm Message</Label>
                              <Input
                                value={action.confirmMessage || ''}
                                onChange={(e) =>
                                  handleUpdateAction(action.id, { confirmMessage: e.target.value })
                                }
                                placeholder="Are you sure you want to delete this item?"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Add Action Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleAddAction}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Row Action
              </Button>

              {actions.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Actions will appear as buttons on each row in the data table preview.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
