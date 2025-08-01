'use client'

import { Database, FileSpreadsheet, Settings2, Shield } from 'lucide-react'
import { Badge } from '@erp/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@erp/ui'
import { Input } from '@erp/ui/primitives'
import { Label } from '@erp/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@erp/ui/primitives'
import { Switch } from '@erp/ui/primitives'
import { Textarea } from '@erp/ui/primitives'

interface QuerySettingsProps {
  settings: any
  onSettingsChange: (updates: any) => void
}

export function QuerySettings({ settings, onSettingsChange }: QuerySettingsProps) {
  const handleSettingChange = (key: string, value: any) => {
    if (key.includes('.')) {
      const [parent, child] = key.split('.')
      onSettingsChange({
        [parent]: {
          ...settings[parent],
          [child]: value,
        },
      })
    } else {
      onSettingsChange({ [key]: value })
    }
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
              onChange={(e) => handleSettingChange('name', e.target.value)}
              placeholder="My Query Builder"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={settings.description || ''}
              onChange={(e) => handleSettingChange('description', e.target.value)}
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
                handleSettingChange('maxRows', e.target.value ? parseInt(e.target.value) : null)
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
                onValueChange={(value) => handleSettingChange('settings.pageSize', parseInt(value))}
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
                          ? currentFormats.filter((f: any) => f !== format)
                          : [...currentFormats, format]
                        handleSettingChange('settings.exportFormats', newFormats)
                      }}
                    >
                      {format.toUpperCase()}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
