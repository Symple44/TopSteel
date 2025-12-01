'use client'

import { Badge, Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@erp/ui'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Code,
  Loader2,
  Play,
  RefreshCw,
  Table2,
} from 'lucide-react'
import { useState } from 'react'
import type { QueryBuilderData } from '../../../../types/query-builder.types'
import { cn } from '../../../../lib/utils'

interface PreviewPanelProps {
  queryBuilder: QueryBuilderData
  previewData: QueryExecutionResult | null
  isLoading: boolean
  onExecute: () => void
  onRefresh: () => void
}

export interface QueryExecutionResult {
  success: boolean
  data?: Record<string, unknown>[]
  columns?: { key: string; label: string; type: string }[]
  totalCount?: number
  executionTime?: number
  error?: string
  sql?: string
}

export function PreviewPanel({
  queryBuilder,
  previewData,
  isLoading,
  onExecute,
  onRefresh,
}: PreviewPanelProps) {
  const [activeView, setActiveView] = useState<'table' | 'sql'>('table')

  const hasColumns = queryBuilder.columns.length > 0
  const hasTable = !!queryBuilder.mainTable

  // Generate SQL preview
  const generateSqlPreview = (): string => {
    if (!hasTable) return '-- Sélectionnez une table principale'
    if (!hasColumns) return '-- Sélectionnez des colonnes'

    const columns = queryBuilder.columns
      .map((c) => `${c.tableName}.${c.columnName}${c.alias !== c.columnName ? ` AS ${c.alias}` : ''}`)
      .join(',\n  ')

    let sql = `SELECT\n  ${columns}\nFROM ${queryBuilder.mainTable}`

    // Add joins
    if (queryBuilder.joins.length > 0) {
      queryBuilder.joins.forEach((join) => {
        sql += `\n${join.joinType} JOIN ${join.toTable} ON ${join.fromTable}.${join.fromColumn} = ${join.toTable}.${join.toColumn}`
      })
    }

    // Add WHERE clause placeholder
    sql += '\n-- WHERE conditions...'

    // Add ORDER BY placeholder
    sql += '\n-- ORDER BY columns...'

    // Add LIMIT
    const limit = queryBuilder.settings?.pageSize || 25
    sql += `\nLIMIT ${limit}`

    return sql
  }

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Table2 className="h-4 w-4" />
            Aperçu des données
          </h3>
          {previewData && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {previewData.success ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>{previewData.totalCount || previewData.data?.length || 0} résultats</span>
                  {previewData.executionTime && (
                    <>
                      <Clock className="h-3 w-3 ml-2" />
                      <span>{previewData.executionTime}ms</span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 text-destructive" />
                  <span className="text-destructive">Erreur</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'table' | 'sql')}>
            <TabsList className="h-7">
              <TabsTrigger value="table" className="text-xs px-2 h-6">
                <Table2 className="h-3 w-3 mr-1" />
                Données
              </TabsTrigger>
              <TabsTrigger value="sql" className="text-xs px-2 h-6">
                <Code className="h-3 w-3 mr-1" />
                SQL
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="h-4 w-px bg-border mx-1" />

          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2"
            onClick={onRefresh}
            disabled={isLoading || !hasTable || !hasColumns}
          >
            <RefreshCw className={cn('h-3 w-3', isLoading && 'animate-spin')} />
          </Button>

          <Button
            size="sm"
            className="h-7"
            onClick={onExecute}
            disabled={isLoading || !hasTable || !hasColumns}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Play className="h-3 w-3 mr-1" />
            )}
            Exécuter
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeView === 'table' ? (
          <TablePreview
            queryBuilder={queryBuilder}
            previewData={previewData}
            isLoading={isLoading}
            hasTable={hasTable}
            hasColumns={hasColumns}
          />
        ) : (
          <SqlPreview sql={previewData?.sql || generateSqlPreview()} />
        )}
      </div>
    </div>
  )
}

// Table Preview Component
interface TablePreviewProps {
  queryBuilder: QueryBuilderData
  previewData: QueryExecutionResult | null
  isLoading: boolean
  hasTable: boolean
  hasColumns: boolean
}

function TablePreview({ queryBuilder, previewData, isLoading, hasTable, hasColumns }: TablePreviewProps) {
  // Empty state
  if (!hasTable) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Table2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">Sélectionnez une table</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Cliquez sur une table dans le panneau de gauche pour la définir comme table principale.
        </p>
      </div>
    )
  }

  if (!hasColumns) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Table2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">Sélectionnez des colonnes</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Cochez les colonnes que vous souhaitez inclure dans votre requête.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Exécution de la requête...</p>
      </div>
    )
  }

  if (!previewData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Play className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-semibold mb-2">Prêt à exécuter</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-4">
          Cliquez sur "Exécuter" pour voir un aperçu des données.
        </p>
        <Badge variant="outline" className="text-xs">
          {queryBuilder.columns.length} colonnes • Table: {queryBuilder.mainTable}
        </Badge>
      </div>
    )
  }

  if (!previewData.success) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="font-semibold mb-2 text-destructive">Erreur d'exécution</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-4">
          {previewData.error || 'Une erreur est survenue lors de l\'exécution de la requête.'}
        </p>
      </div>
    )
  }

  const data = previewData.data || []
  const columns = previewData.columns || queryBuilder.columns.map(c => ({
    key: c.alias || c.columnName,
    label: c.label || c.alias || c.columnName,
    type: c.dataType
  }))

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Table2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">Aucun résultat</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          La requête n'a retourné aucune donnée.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-muted/80 backdrop-blur">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-3 py-2 text-left font-medium text-muted-foreground border-b"
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  <span className="text-[10px] uppercase opacity-50">
                    {col.type?.split('(')[0]}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 50).map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b hover:bg-muted/30 transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-2">
                  {formatCellValue(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 50 && (
        <div className="p-3 text-center text-xs text-muted-foreground bg-muted/30">
          Affichage des 50 premières lignes sur {data.length}
        </div>
      )}
    </div>
  )
}

// SQL Preview Component
interface SqlPreviewProps {
  sql: string
}

function SqlPreview({ sql }: SqlPreviewProps) {
  return (
    <div className="p-4">
      <pre className="p-4 bg-muted/50 rounded-lg overflow-auto text-sm font-mono">
        <code className="text-foreground">{sql}</code>
      </pre>
    </div>
  )
}

// Helper to format cell values
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '—'
  }
  if (typeof value === 'boolean') {
    return value ? '✓' : '✗'
  }
  if (value instanceof Date) {
    return value.toLocaleDateString('fr-FR')
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}
