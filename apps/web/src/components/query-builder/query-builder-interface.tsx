'use client'

import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@erp/ui'
import { Play, Save, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/lib/i18n/hooks'
import { cn } from '@/lib/utils'
import { callClientApi } from '@/utils/backend-api'
import { CalculatedFieldsEditor } from './calculated-fields-editor'
import { ColumnSelector } from './column-selector'
import { DataTablePreview } from './datatable-preview'
import { ImportDialog } from './import-dialog'
import { QueryPreview } from './query-preview'
import { QuerySettings } from './query-settings'
import { TableSelector } from './table-selector'

interface QueryBuilderInterfaceProps {
  queryBuilderId: string
  initialData?: any
}

export function QueryBuilderInterface({ queryBuilderId, initialData }: QueryBuilderInterfaceProps) {
  const { toast } = useToast()
  const { t } = useTranslation('queryBuilder')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('design')

  // Query Builder State
  const [queryBuilder, setQueryBuilder] = useState({
    name: initialData?.name || t('title'),
    description: initialData?.description || '',
    database: initialData?.database || 'default',
    mainTable: initialData?.mainTable || '',
    isPublic: initialData?.isPublic || false,
    maxRows: initialData?.maxRows || null,
    settings: initialData?.settings || {
      enablePagination: true,
      pageSize: 50,
      enableSorting: true,
      enableFiltering: true,
      enableExport: true,
      exportFormats: ['csv', 'excel', 'json'],
    },
    columns: initialData?.columns || [],
    joins: initialData?.joins || [],
    calculatedFields: initialData?.calculatedFields || [],
    layout: initialData?.layout || {},
  })

  const [previewData, setPreviewData] = useState(null)
  const [availableTables, setAvailableTables] = useState([])
  const [selectedTables, setSelectedTables] = useState([queryBuilder.mainTable].filter(Boolean))

  useEffect(() => {
    fetchAvailableTables()
  }, [fetchAvailableTables])

  const fetchAvailableTables = async () => {
    try {
      const response = await callClientApi('query-builder/schema/tables')
      if (response.ok) {
        const result = await response.json()
        // Assurer que nous avons bien un tableau
        const tables = Array.isArray(result) ? result : result.data || result.tables || []
        setAvailableTables(tables)
      }
    } catch (_error) {
      setAvailableTables([]) // Fallback vers tableau vide en cas d'erreur
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const endpoint =
        queryBuilderId === 'new' ? 'query-builder' : `query-builder/${queryBuilderId}`

      const method = queryBuilderId === 'new' ? 'POST' : 'PATCH'

      const response = await callClientApi(endpoint, {
        method,
        body: JSON.stringify(queryBuilder),
      })

      if (response.ok) {
        const saved = await response.json()
        toast({
          title: t('save'),
          description: t('saveSuccess'),
        })

        if (queryBuilderId === 'new') {
          window.location.href = `/query-builder/${saved.id}`
        } else {
          // Après sauvegarde réussie, exécuter automatiquement pour voir les résultats
          if (activeTab === 'preview') {
            handleExecute()
          }
        }
      } else {
        throw new Error('Failed to save')
      }
    } catch (_error) {
      toast({
        title: t('error'),
        description: t('saveError'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExecute = async () => {
    if (queryBuilderId === 'new') {
      toast({
        title: t('saveRequired'),
        description: t('saveBeforeExecute'),
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const response = await callClientApi(`query-builder/${queryBuilderId}/execute`, {
        method: 'POST',
        body: JSON.stringify({
          page: 1,
          pageSize: 50,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setPreviewData(result)
        // Ne pas changer d'onglet automatiquement
      } else {
        const _errorText = await response.text()
        throw new Error(`Failed to execute query: ${response.status}`)
      }
    } catch (_error) {
      toast({
        title: t('error'),
        description: t('executeError'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const updateQueryBuilder = (updates: Partial<typeof queryBuilder>) => {
    setQueryBuilder((prev) => ({ ...prev, ...updates }))
  }

  const handleImport = (importedData: any) => {
    setQueryBuilder(importedData)
    // Mettre à jour les tables sélectionnées
    if (importedData.mainTable) {
      setSelectedTables([
        importedData.mainTable,
        ...(importedData.joins?.map((j: any) => j.toTable) || []),
      ])
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{queryBuilder.name}</h1>
              {queryBuilderId !== 'new' && (
                <span className="text-sm text-muted-foreground">ID: {queryBuilderId}</span>
              )}
            </div>
            {queryBuilder.description && (
              <p className="text-muted-foreground">{queryBuilder.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ImportDialog onImport={handleImport} />
            <Button variant="outline" size="sm" onClick={() => setActiveTab('settings')}>
              <Settings className="h-4 w-4 mr-2" />
              {t('settings')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExecute}
              disabled={loading || !queryBuilder.mainTable}
            >
              <Play className="h-4 w-4 mr-2" />
              {t('execute')}
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {t('save')}
            </Button>
          </div>
        </div>
      </div>

      {/* Zone de configuration */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className={cn('flex flex-col', previewData ? 'flex-1' : 'flex-1')}
      >
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="design">{t('visual')}</TabsTrigger>
          <TabsTrigger value="calculated">{t('calculatedFields')}</TabsTrigger>
          <TabsTrigger value="preview">{t('raw')}</TabsTrigger>
          <TabsTrigger value="settings">{t('settings')}</TabsTrigger>
        </TabsList>

        <TabsContent value="design" className="flex-1 overflow-hidden">
          <div className="h-full flex gap-4 p-4">
            <div className="w-80 space-y-4">
              <TableSelector
                availableTables={availableTables}
                selectedTables={selectedTables}
                mainTable={queryBuilder.mainTable}
                joins={queryBuilder.joins}
                columns={queryBuilder.columns}
                onMainTableChange={(table) => updateQueryBuilder({ mainTable: table })}
                onJoinsChange={(joins) => updateQueryBuilder({ joins })}
                onTablesChange={setSelectedTables}
                onColumnsChange={(columns) => updateQueryBuilder({ columns })}
              />
            </div>
            <div className="flex-1">
              <ColumnSelector
                selectedTables={selectedTables}
                columns={queryBuilder.columns}
                onColumnsChange={(columns) => updateQueryBuilder({ columns })}
                layout={queryBuilder.layout}
                onLayoutChange={(layout) => updateQueryBuilder({ layout })}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="calculated" className="flex-1 p-4">
          <CalculatedFieldsEditor
            fields={queryBuilder.calculatedFields}
            columns={queryBuilder.columns}
            onFieldsChange={(fields) => updateQueryBuilder({ calculatedFields: fields })}
          />
        </TabsContent>

        <TabsContent value="preview" className="flex-1 overflow-hidden">
          {previewData ? (
            <DataTablePreview
              data={previewData}
              columns={queryBuilder.columns}
              calculatedFields={queryBuilder.calculatedFields}
              layout={queryBuilder.layout}
              settings={queryBuilder.settings}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <QueryPreview queryBuilder={queryBuilder} />
              <div className="mt-8 text-center">
                <p className="text-muted-foreground mb-4">
                  {t('clickExecuteToSeeResults')}
                </p>
                <Button onClick={handleExecute} disabled={loading || !queryBuilder.mainTable}>
                  <Play className="h-4 w-4 mr-2" />
                  {t('execute')}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="flex-1 p-4">
          <QuerySettings settings={queryBuilder} onSettingsChange={updateQueryBuilder} />
        </TabsContent>
      </Tabs>

      {/* Zone des résultats toujours visible en bas */}
      <div className="border-t">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('preview')}</h2>
            <div className="flex items-center gap-2">
              {previewData && (
                <span className="text-sm text-muted-foreground">
                  {Array.isArray(previewData)
                    ? (previewData as any).length
                    : (previewData as any)?.data?.length || 0}{' '}
                  {t('results')}
                </span>
              )}
              {!previewData && queryBuilder.mainTable && (
                <span className="text-sm text-muted-foreground">
                  {t('clickExecuteToLoadData')}
                </span>
              )}
            </div>
          </div>
          <div className="h-[400px] overflow-hidden border rounded-lg bg-muted/10">
            {queryBuilder.mainTable ? (
              <DataTablePreview
                data={previewData || []}
                columns={queryBuilder.columns.filter((col: any) => col.isVisible)}
                calculatedFields={queryBuilder.calculatedFields}
                layout={queryBuilder.layout}
                settings={queryBuilder.settings}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <p>{t('selectTableToStart')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
