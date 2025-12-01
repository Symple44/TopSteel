'use client'

import { Button } from '@erp/ui'
import { Play, Save } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type {
  DatabaseTable,
  QueryBuilderColumn,
  QueryBuilderData,
  QueryBuilderJoin,
  QueryBuilderCalculatedField,
} from '../../../types/query-builder.types'
import { callClientApi } from '../../../utils/backend-api'
import { TableColumnsPanel } from './panels/table-columns-panel'
import { ConfigurationPanel } from './panels/configuration-panel'
import { PreviewPanel, type QueryExecutionResult } from './panels/preview-panel'

interface QueryBuilderEditorProps {
  queryBuilderId: string
  initialData?: Partial<QueryBuilderData>
}

// Default settings for a new query builder
const defaultSettings = {
  enablePagination: true,
  pageSize: 50,
  enableSorting: true,
  enableFiltering: true,
  enableExport: true,
  exportFormats: ['csv', 'excel', 'json'],
}

export function QueryBuilderEditor({ queryBuilderId, initialData }: QueryBuilderEditorProps) {
  // Query Builder State
  const [queryBuilder, setQueryBuilder] = useState<QueryBuilderData>({
    name: initialData?.name || 'Nouveau Query Builder',
    description: initialData?.description || '',
    database: initialData?.database || 'default',
    mainTable: initialData?.mainTable || '',
    isPublic: initialData?.isPublic ?? false,
    maxRows: initialData?.maxRows,
    settings: initialData?.settings || defaultSettings,
    columns: initialData?.columns || [],
    joins: initialData?.joins || [],
    calculatedFields: initialData?.calculatedFields || [],
    layout: initialData?.layout || {},
  })

  // UI State
  const [availableTables, setAvailableTables] = useState<DatabaseTable[]>([])
  const [previewData, setPreviewData] = useState<QueryExecutionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [activeConfigTab, setActiveConfigTab] = useState('columns')

  // Fetch available tables
  const fetchTables = useCallback(async () => {
    try {
      const response = await callClientApi('query-builder/schema/tables')
      if (response?.ok) {
        const result = await response.json()
        console.log('API response for tables:', result)

        // Handle various response formats
        let tables: DatabaseTable[] = []
        if (Array.isArray(result)) {
          tables = result
        } else if (result?.data && Array.isArray(result.data)) {
          tables = result.data
        } else if (result?.tables && Array.isArray(result.tables)) {
          tables = result.tables
        } else if (result?.schema && Array.isArray(result.schema)) {
          tables = result.schema
        }

        // Normalize table structure - handle different property names
        const normalizedTables: DatabaseTable[] = (tables as unknown[]).map((t) => {
          const table = t as Record<string, unknown>
          const columns = Array.isArray(table.columns) ? table.columns : []

          return {
            name: String(table.name || table.tableName || table.table_name || ''),
            schema: String(table.schema || table.schemaName || 'public'),
            type: String(table.type || 'table'),
            description: String(table.description || ''),
            columns: columns.map((c) => {
              const col = c as Record<string, unknown>
              return {
                name: String(col.name || col.columnName || col.column_name || ''),
                type: String(col.type || col.dataType || col.data_type || 'text'),
                nullable: Boolean(col.nullable ?? col.isNullable ?? true),
                primary: Boolean(col.primary ?? col.isPrimary ?? col.is_primary ?? false),
                default: col.default ? String(col.default) : undefined,
              }
            }),
          }
        }).filter((t) => t.name) // Only keep tables with a valid name

        console.log('Normalized tables:', normalizedTables)
        setAvailableTables(normalizedTables)
      }
    } catch (error) {
      console.error('Error fetching tables:', error)
      setAvailableTables([])
    }
  }, [])

  useEffect(() => {
    fetchTables()
  }, [fetchTables])

  // Update query builder state
  const updateQueryBuilder = useCallback((updates: Partial<QueryBuilderData>) => {
    setQueryBuilder((prev) => ({ ...prev, ...updates }))
  }, [])

  // Handle table selection
  const handleTableSelect = useCallback((tableName: string) => {
    updateQueryBuilder({ mainTable: tableName, columns: [], joins: [] })
  }, [updateQueryBuilder])

  // Handle column toggle
  const handleColumnToggle = useCallback((column: QueryBuilderColumn, selected: boolean) => {
    setQueryBuilder((prev) => {
      if (selected) {
        // Add column
        const newColumn: QueryBuilderColumn = {
          ...column,
          displayOrder: prev.columns.length,
          isVisible: true,
          isFilterable: true,
          isSortable: true,
        }
        return { ...prev, columns: [...prev.columns, newColumn] }
      } else {
        // Remove column
        return {
          ...prev,
          columns: prev.columns.filter(
            (c) => !(c.tableName === column.tableName && c.columnName === column.columnName)
          ),
        }
      }
    })
  }, [])

  // Handle columns reorder
  const handleColumnsReorder = useCallback((columns: QueryBuilderColumn[]) => {
    updateQueryBuilder({ columns })
  }, [updateQueryBuilder])

  // Handle column update
  const handleColumnUpdate = useCallback((columnId: string, updates: Partial<QueryBuilderColumn>) => {
    setQueryBuilder((prev) => ({
      ...prev,
      columns: prev.columns.map((col) => {
        const id = `${col.tableName}.${col.columnName}`
        return id === columnId ? { ...col, ...updates } : col
      }),
    }))
  }, [])

  // Handle joins
  const handleJoinsChange = useCallback((joins: QueryBuilderJoin[]) => {
    updateQueryBuilder({ joins })
  }, [updateQueryBuilder])

  // Handle calculated fields
  const handleCalculatedFieldsChange = useCallback((fields: QueryBuilderCalculatedField[]) => {
    updateQueryBuilder({ calculatedFields: fields })
  }, [updateQueryBuilder])

  // Save query builder
  const handleSave = async () => {
    setLoading(true)
    try {
      const endpoint = queryBuilderId === 'new' ? 'query-builder' : `query-builder/${queryBuilderId}`
      const method = queryBuilderId === 'new' ? 'POST' : 'PATCH'

      const response = await callClientApi(endpoint, {
        method,
        body: JSON.stringify(queryBuilder),
      })

      if (response?.ok) {
        const saved = await response.json()
        if (queryBuilderId === 'new' && saved?.id) {
          window.location.href = `/query-builder/${saved.id}`
        }
      }
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setLoading(false)
    }
  }

  // Execute query
  const handleExecute = async () => {
    if (!queryBuilder.mainTable) return

    setExecuting(true)
    try {
      // For new queries, we need to save first or use a preview endpoint
      const endpoint = queryBuilderId === 'new'
        ? 'query-builder/preview'
        : `query-builder/${queryBuilderId}/execute`

      const response = await callClientApi(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          ...queryBuilder,
          page: 1,
          pageSize: 50,
        }),
      })

      if (response?.ok) {
        const result = await response.json()
        setPreviewData(result)
      }
    } catch (error) {
      console.error('Error executing:', error)
    } finally {
      setExecuting(false)
    }
  }

  // Get selected table info
  const selectedTable = availableTables.find((t) => t.name === queryBuilder.mainTable)

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={queryBuilder.name}
            onChange={(e) => updateQueryBuilder({ name: e.target.value })}
            className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
            placeholder="Nom du Query Builder"
          />
          {queryBuilderId !== 'new' && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              ID: {queryBuilderId.slice(0, 8)}...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExecute}
            disabled={executing || !queryBuilder.mainTable}
          >
            <Play className={`h-4 w-4 mr-2 ${executing ? 'animate-pulse' : ''}`} />
            {executing ? 'Exécution...' : 'Exécuter'}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      {/* Main Content - 3 Panel Layout */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Section: Left Panel + Right Panel */}
        <div className="flex-1 flex min-h-0">
          {/* Left Panel: Tables & Columns */}
          <div className="w-64 border-r flex flex-col overflow-hidden bg-card shrink-0">
            <TableColumnsPanel
              tables={availableTables}
              selectedTable={queryBuilder.mainTable}
              selectedColumns={queryBuilder.columns}
              joins={queryBuilder.joins}
              onTableSelect={handleTableSelect}
              onColumnToggle={handleColumnToggle}
            />
          </div>

          {/* Right Panel: Configuration Tabs */}
          <div className="flex-1 flex flex-col overflow-hidden bg-muted/30">
            <ConfigurationPanel
              activeTab={activeConfigTab}
              onTabChange={setActiveConfigTab}
              queryBuilder={queryBuilder}
              selectedTable={selectedTable}
              onColumnsReorder={handleColumnsReorder}
              onColumnUpdate={handleColumnUpdate}
              onJoinsChange={handleJoinsChange}
              onCalculatedFieldsChange={handleCalculatedFieldsChange}
              onSettingsChange={updateQueryBuilder}
            />
          </div>
        </div>

        {/* Bottom Panel: Preview */}
        <div className="h-80 border-t flex flex-col overflow-hidden bg-card">
          <PreviewPanel
            queryBuilder={queryBuilder}
            previewData={previewData}
            isLoading={executing}
            onExecute={handleExecute}
            onRefresh={handleExecute}
          />
        </div>
      </div>
    </div>
  )
}
