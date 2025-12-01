'use client'

import { Badge, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@erp/ui'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Database,
  Key,
  Link2,
  Lock,
  Search,
  Table2,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type {
  DatabaseColumn,
  DatabaseTable,
  QueryBuilderColumn,
  QueryBuilderJoin,
} from '../../../../types/query-builder.types'
import { cn } from '../../../../lib/utils'

interface TableColumnsPanelProps {
  tables: DatabaseTable[]
  selectedTable: string
  selectedColumns: QueryBuilderColumn[]
  joins: QueryBuilderJoin[]
  onTableSelect: (tableName: string) => void
  onColumnToggle: (column: QueryBuilderColumn, selected: boolean) => void
}

export function TableColumnsPanel({
  tables,
  selectedTable,
  selectedColumns,
  joins,
  onTableSelect,
  onColumnToggle,
}: TableColumnsPanelProps) {
  const [searchTable, setSearchTable] = useState('')
  const [searchColumn, setSearchColumn] = useState('')
  const [showTableSelector, setShowTableSelector] = useState(!selectedTable)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['primary']))

  // Get current table object
  const currentTable = useMemo(() => {
    return tables.find((t) => t.name === selectedTable)
  }, [tables, selectedTable])

  // Get joined tables
  const joinedTables = useMemo(() => {
    return joins
      .map((j) => tables.find((t) => t.name === j.toTable))
      .filter((t): t is DatabaseTable => t !== undefined)
  }, [joins, tables])

  // Filter tables for selector
  const filteredTables = useMemo(() => {
    // Filter out tables without a valid name
    const validTables = tables.filter((t) => t && t.name)
    if (!searchTable) return validTables
    const search = searchTable.toLowerCase()
    return validTables.filter((t) => t.name.toLowerCase().includes(search))
  }, [tables, searchTable])

  // Filter columns
  const filterColumns = (columns: DatabaseColumn[] | undefined) => {
    if (!columns) return []
    if (!searchColumn) return columns
    const search = searchColumn.toLowerCase()
    return columns.filter((c) => c.name.toLowerCase().includes(search))
  }

  // Check if column is selected
  const isColumnSelected = (tableName: string, columnName: string) => {
    return selectedColumns.some(
      (c) => c.tableName === tableName && c.columnName === columnName
    )
  }

  // Check if column is sensitive
  const isSensitiveColumn = (columnName: string) => {
    const sensitivePatterns = ['password', 'secret', 'token', 'hash', 'salt']
    return sensitivePatterns.some((p) => columnName.toLowerCase().includes(p))
  }

  // Handle column click
  const handleColumnClick = (tableName: string, column: DatabaseColumn) => {
    const qbColumn: QueryBuilderColumn = {
      tableName,
      columnName: column.name,
      alias: column.name,
      label: column.name,
      dataType: column.type,
      isVisible: true,
      isFilterable: true,
      isSortable: true,
      displayOrder: selectedColumns.length,
      isPrimaryKey: column.primary,
    }
    onColumnToggle(qbColumn, !isColumnSelected(tableName, column.name))
  }

  // Handle table selection
  const handleSelectTable = (tableName: string) => {
    onTableSelect(tableName)
    setShowTableSelector(false)
    setSearchTable('')
  }

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  // Select all columns from a table
  const handleSelectAllColumns = (table: DatabaseTable) => {
    const columns = table.columns || []
    columns.forEach((col) => {
      if (!isSensitiveColumn(col.name) && !isColumnSelected(table.name, col.name)) {
        handleColumnClick(table.name, col)
      }
    })
  }

  // Render column list for a table
  const renderColumns = (table: DatabaseTable, tableName: string) => {
    const columns = filterColumns(table.columns)
    const selectedCount = columns.filter((c) => isColumnSelected(tableName, c.name)).length

    return (
      <div className="space-y-0.5">
        {columns.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2 px-2">Aucune colonne trouvée</p>
        ) : (
          columns.map((column) => {
            const selected = isColumnSelected(tableName, column.name)
            const sensitive = isSensitiveColumn(column.name)

            return (
              <div
                key={`${tableName}.${column.name}`}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer transition-colors',
                  selected
                    ? 'bg-primary/10 text-primary'
                    : sensitive
                      ? 'text-muted-foreground/40 cursor-not-allowed'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
                onClick={() => !sensitive && handleColumnClick(tableName, column)}
              >
                <div className={cn(
                  'w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0',
                  selected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                )}>
                  {selected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                </div>
                <span className="flex-1 truncate">{column.name}</span>
                {column.primary && (
                  <Key className="h-3 w-3 text-amber-500 shrink-0" />
                )}
                {sensitive && (
                  <Lock className="h-3 w-3 text-red-400 shrink-0" />
                )}
                <span className="text-[9px] text-muted-foreground/60 uppercase shrink-0">
                  {column.type.split('(')[0].slice(0, 6)}
                </span>
              </div>
            )
          })
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full text-sm">
      {/* Header */}
      <div className="p-2 border-b bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-4 w-4 text-primary" />
          <span className="font-medium text-xs">Structure</span>
        </div>

        {/* Column search - only show if table selected */}
        {selectedTable && (
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              value={searchColumn}
              onChange={(e) => setSearchColumn(e.target.value)}
              placeholder="Rechercher colonnes..."
              className="h-7 pl-7 text-xs"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-2 space-y-2">
        {/* No table selected - show selector */}
        {!selectedTable ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-2">
              Sélectionnez la table principale:
            </p>
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
                placeholder="Rechercher..."
                className="h-7 pl-7 text-xs"
              />
            </div>
            <div className="space-y-0.5 max-h-[300px] overflow-auto">
              {filteredTables.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {tables.length === 0 ? 'Chargement...' : 'Aucune table'}
                </p>
              ) : (
                filteredTables.map((table, idx) => (
                  <button
                    key={`${table.schema || 'default'}.${table.name}.${idx}`}
                    type="button"
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-muted text-left"
                    onClick={() => handleSelectTable(table.name)}
                  >
                    <Table2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">{table.name}</span>
                    <span className="text-[9px] text-muted-foreground ml-auto">
                      {table.columns?.length || 0} cols
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Primary Table Section */}
            <div className="border rounded-lg overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center gap-2 px-2 py-1.5 bg-primary/10 text-primary hover:bg-primary/20"
                onClick={() => toggleSection('primary')}
              >
                {expandedSections.has('primary') ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
                <Table2 className="h-3.5 w-3.5" />
                <span className="font-medium text-xs truncate flex-1 text-left">{selectedTable}</span>
                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                  Principal
                </Badge>
              </button>

              {expandedSections.has('primary') && currentTable && (
                <div className="p-1.5 border-t bg-card">
                  <div className="flex items-center justify-between mb-1.5 px-1">
                    <span className="text-[10px] text-muted-foreground">
                      {selectedColumns.filter((c) => c.tableName === selectedTable).length} / {currentTable.columns?.length || 0}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="text-[10px] text-primary hover:underline"
                        onClick={() => handleSelectAllColumns(currentTable)}
                      >
                        Tout
                      </button>
                      <button
                        type="button"
                        className="text-[10px] text-muted-foreground hover:underline"
                        onClick={() => setShowTableSelector(true)}
                      >
                        Changer
                      </button>
                    </div>
                  </div>
                  {renderColumns(currentTable, selectedTable)}
                </div>
              )}
            </div>

            {/* Joined Tables */}
            {joinedTables.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 px-1">
                  <Link2 className="h-3 w-3 text-blue-500" />
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Tables jointes ({joinedTables.length})
                  </span>
                </div>

                {joinedTables.map((table, idx) => {
                  const join = joins.find((j) => j.toTable === table.name)
                  const sectionKey = `joined-${table.name}`

                  return (
                    <div key={`${table.name}-${idx}`} className="border rounded-lg overflow-hidden">
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-2 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20"
                        onClick={() => toggleSection(sectionKey)}
                      >
                        {expandedSections.has(sectionKey) ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                        <Table2 className="h-3.5 w-3.5" />
                        <span className="font-medium text-xs truncate flex-1 text-left">{table.name}</span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                          {join?.joinType || 'JOIN'}
                        </Badge>
                      </button>

                      {expandedSections.has(sectionKey) && (
                        <div className="p-1.5 border-t bg-card">
                          <div className="flex items-center justify-between mb-1.5 px-1">
                            <span className="text-[10px] text-muted-foreground">
                              {selectedColumns.filter((c) => c.tableName === table.name).length} / {table.columns?.length || 0}
                            </span>
                            <button
                              type="button"
                              className="text-[10px] text-primary hover:underline"
                              onClick={() => handleSelectAllColumns(table)}
                            >
                              Tout
                            </button>
                          </div>
                          {renderColumns(table, table.name)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Hint for adding joins */}
            {joinedTables.length === 0 && (
              <div className="text-[10px] text-muted-foreground text-center py-2 px-2 border rounded-lg border-dashed">
                <Link2 className="h-3 w-3 mx-auto mb-1 opacity-50" />
                Utilisez l'onglet "Jointures" pour ajouter des tables liées
              </div>
            )}
          </>
        )}

        {/* Change table modal */}
        {showTableSelector && selectedTable && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg shadow-lg w-72 max-h-96 overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b">
                <span className="font-medium text-sm">Changer de table</span>
                <button
                  type="button"
                  className="p-1 hover:bg-muted rounded"
                  onClick={() => setShowTableSelector(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-2">
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    value={searchTable}
                    onChange={(e) => setSearchTable(e.target.value)}
                    placeholder="Rechercher..."
                    className="h-7 pl-7 text-xs"
                    autoFocus
                  />
                </div>
                <div className="space-y-0.5 max-h-60 overflow-auto">
                  {filteredTables.map((table, idx) => (
                    <button
                      key={`modal-${table.schema || 'default'}.${table.name}.${idx}`}
                      type="button"
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left',
                        table.name === selectedTable
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      )}
                      onClick={() => handleSelectTable(table.name)}
                    >
                      <Table2 className="h-3.5 w-3.5" />
                      <span className="truncate">{table.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer summary */}
      {selectedTable && (
        <div className="p-2 border-t bg-muted/30 text-[10px] text-muted-foreground">
          <div className="flex justify-between">
            <span>{selectedColumns.length} colonnes</span>
            <span>{joins.length} jointures</span>
          </div>
        </div>
      )}
    </div>
  )
}
