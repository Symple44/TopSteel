'use client'

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  ScrollArea,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@erp/ui'
import { Button, Input } from '@erp/ui'
import {
  Code,
  Columns,
  Database,
  Download,
  Eye,
  Play,
  Plus,
  Save,
  Settings,
  Table2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { callClientApi } from '@/utils/backend-api'
import { DataTablePreview } from './datatable-preview'

interface Table {
  name: string
  schema: string
  type: string
  description: string
  columns: Column[]
}

interface Column {
  name: string
  type: string
  nullable: boolean
  primary?: boolean
}

interface SelectedColumn {
  table: string
  column: string
  alias?: string
  aggregation?: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX'
}

interface Filter {
  column: string
  operator: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than'
  value: string
}

interface VisualQueryBuilderProps {
  queryBuilderId: string
  initialData?: any
}

export function VisualQueryBuilder({ queryBuilderId, initialData }: VisualQueryBuilderProps) {
  const [loading, setLoading] = useState(false)
  const [availableTables, setAvailableTables] = useState<Table[]>([])
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [selectedColumns, setSelectedColumns] = useState<SelectedColumn[]>([])
  const [filters, setFilters] = useState<Filter[]>([])
  const [sortBy, setSortBy] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC')
  const [limit, setLimit] = useState<number>(100)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [generatedSQL, setGeneratedSQL] = useState('')
  const [queryName, setQueryName] = useState(initialData?.name || 'New Query')
  const [queryDescription, setQueryDescription] = useState(initialData?.description || '')

  const fetchTables = useCallback(async () => {
    try {
      const response = await callClientApi('query-builder/schema/tables')
      if (response?.ok) {
        const tables = await response.json()
        setAvailableTables(tables)
      } else {
      }
    } catch {}
  }, [])

  const loadInitialData = useCallback(() => {
    // Charger les données initiales si édition d'un query existant
    if (initialData?.mainTable) {
      const table = availableTables.find((t) => t.name === initialData.mainTable)
      if (table) {
        setSelectedTable(table)
      }
    }
    if (initialData?.columns?.length > 0) {
      setSelectedColumns(initialData.columns)
    }
  }, [availableTables, initialData])

  useEffect(() => {
    fetchTables()
    if (initialData) {
      loadInitialData()
    }
  }, [fetchTables, initialData, loadInitialData])

  /**
   * Build SELECT clause
   */
  const buildSelectClause = useCallback((): string => {
    const buildColumnPart = (col: SelectedColumn): string => {
      let part = col.table ? `${col.table}.${col.column}` : col.column

      if (col.aggregation) {
        part = `${col.aggregation}(${part})`
      }

      if (col.alias) {
        part += ` AS ${col.alias}`
      }

      return part
    }

    const columnParts = selectedColumns.map(buildColumnPart)
    return `SELECT ${columnParts.join(', ')}`
  }, [selectedColumns])

  /**
   * Build WHERE clause
   */
  const buildWhereClause = useCallback((): string => {
    if (filters.length === 0) return ''

    const formatFilterValue = (filter: Filter): string => {
      const { value } = filter

      switch (filter.operator) {
        case 'contains':
          return `'%${value}%'`
        case 'starts_with':
          return `'${value}%'`
        default:
          return typeof value === 'string' ? `'${value}'` : value
      }
    }

    const buildFilterPart = (filter: Filter): string => {
      const operators = {
        equals: '=',
        not_equals: '!=',
        contains: 'LIKE',
        starts_with: 'LIKE',
        greater_than: '>',
        less_than: '<',
      }

      const formattedValue = formatFilterValue(filter)
      return `${filter.column} ${operators[filter.operator]} ${formattedValue}`
    }

    const filterParts = filters.map(buildFilterPart)
    return `WHERE ${filterParts.join(' AND ')}`
  }, [filters])

  /**
   * Build ORDER BY clause
   */
  const buildOrderByClause = useCallback((): string => {
    return sortBy ? `ORDER BY ${sortBy} ${sortOrder}` : ''
  }, [sortBy, sortOrder])

  /**
   * Build LIMIT clause
   */
  const buildLimitClause = useCallback((): string => {
    return limit > 0 ? `LIMIT ${limit}` : ''
  }, [limit])

  /**
   * Generate SQL with reduced cognitive complexity (reduced from ~12 to ~4)
   */
  const generateSQL = useCallback(() => {
    if (!selectedTable || selectedColumns.length === 0) {
      return ''
    }

    const sqlParts = {
      select: buildSelectClause(),
      from: `FROM ${selectedTable.name}`,
      where: buildWhereClause(),
      orderBy: buildOrderByClause(),
      limit: buildLimitClause(),
    }

    const sql = [sqlParts.select, sqlParts.from, sqlParts.where, sqlParts.orderBy, sqlParts.limit]
      .filter(Boolean)
      .join('\n')

    setGeneratedSQL(sql)
    return sql
  }, [
    selectedTable,
    selectedColumns,
    buildSelectClause,
    buildWhereClause,
    buildOrderByClause,
    buildLimitClause,
  ])

  /**
   * Execute query with reduced complexity (reduced from ~8 to ~4)
   */
  const executeQuery = async () => {
    const sql = generateSQL()

    if (!validateQueryExecution(sql)) {
      return
    }

    setLoading(true)
    try {
      const result = await executeQueryRequest(sql)
      handleQuerySuccess(result)
    } catch (error) {
      handleQueryError(error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Validate query execution preconditions
   */
  const validateQueryExecution = (sql: string): boolean => {
    if (!sql) {
      toast.error('Veuillez sélectionner au moins une table et une colonne')
      return false
    }
    return true
  }

  /**
   * Execute query request
   */
  const executeQueryRequest = async (sql: string) => {
    const response = await callClientApi('query-builder/execute-sql', {
      method: 'POST',
      body: JSON.stringify({
        sql,
        limit: Math.min(limit, 100), // Limiter à 100 résultats max pour l'aperçu
      }),
    })

    if (!response?.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || 'Erreur inconnue')
    }

    return await response.json()
  }

  /**
   * Handle successful query execution
   */
  const handleQuerySuccess = (result: unknown) => {
    const data = Array.isArray(result) ? result : result.data || result.rows || []
    setPreviewData(data)
    toast.success(`Requête exécutée avec succès (${data.length} résultats)`)
  }

  /**
   * Handle query execution error
   */
  const handleQueryError = (error: unknown) => {
    if (error instanceof Error) {
      toast.error(`Erreur lors de l'exécution: ${error.message}`)
    } else {
      toast.error("Erreur lors de l'exécution de la requête")
    }
  }

  const addColumn = (table: Table, column: Column) => {
    const newColumn: SelectedColumn = {
      table: table.name,
      column: column.name,
    }
    setSelectedColumns([...selectedColumns, newColumn])
  }

  const removeColumn = (index: number) => {
    setSelectedColumns(selectedColumns.filter((_, i) => i !== index))
  }

  const addFilter = () => {
    if (selectedColumns.length === 0) return

    const newFilter: Filter = {
      column: selectedColumns[0]?.column,
      operator: 'equals',
      value: '',
    }
    setFilters([...filters, newFilter])
  }

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index))
  }

  /**
   * Update filter with immutable state update pattern
   */
  const updateFilter = (index: number, field: keyof Filter, value: string) => {
    setFilters((prevFilters) =>
      prevFilters.map((filter, i) => (i === index ? { ...filter, [field]: value } : filter))
    )
  }

  /**
   * Save query with reduced complexity (reduced from ~6 to ~3)
   */
  const saveQuery = async () => {
    if (!validateQuerySave()) {
      return
    }

    const queryData = buildQueryData()

    setLoading(true)
    try {
      await saveQueryRequest(queryData)
      toast.success('Requête sauvegardée avec succès')
    } catch (error) {
      handleSaveError(error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Validate query save preconditions
   */
  const validateQuerySave = (): boolean => {
    if (!queryName?.trim()) {
      toast.error('Veuillez donner un nom à votre requête')
      return false
    }
    return true
  }

  /**
   * Build query data object
   */
  const buildQueryData = () => {
    return {
      name: queryName,
      description: queryDescription,
      mainTable: selectedTable?.name,
      columns: selectedColumns,
      filters,
      sortBy,
      sortOrder,
      limit,
      sql: generateSQL(),
    }
  }

  /**
   * Save query request
   */
  const saveQueryRequest = async (queryData: unknown) => {
    const isNewQuery = queryBuilderId === 'new'
    const endpoint = isNewQuery ? 'query-builder' : `query-builder/${queryBuilderId}`
    const method = isNewQuery ? 'POST' : 'PATCH'

    const response = await callClientApi(endpoint, {
      method,
      body: JSON.stringify(queryData),
    })

    if (!response?.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || 'Erreur de sauvegarde')
    }
  }

  /**
   * Handle save error
   */
  const handleSaveError = (error: unknown) => {
    if (error instanceof Error) {
      toast.error(`Erreur lors de la sauvegarde: ${error.message}`)
    } else {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  useEffect(() => {
    if (selectedColumns.length > 0) {
      generateSQL()
    }
  }, [selectedColumns, generateSQL])

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <Input
              value={queryName}
              onChange={(e) => setQueryName(e.target.value)}
              placeholder="Nom de la requête"
              className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0"
            />
            <Input
              value={queryDescription}
              onChange={(e) => setQueryDescription(e.target.value)}
              placeholder="Description (optionnelle)"
              className="text-sm text-muted-foreground border-none p-0 h-auto mt-1 focus-visible:ring-0"
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={executeQuery} disabled={loading}>
              <Play className="h-4 w-4 mr-2" />
              Exécuter
            </Button>
            <Button type="button" onClick={saveQuery} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        {/* Left Panel - Query Builder */}
        <div className="w-80 border-r bg-muted/10">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {/* Table Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Database className="h-4 w-4" />
                    Tables
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {availableTables.map((table) => (
                    <button
                      key={table.name}
                      type="button"
                      onClick={() => setSelectedTable(table)}
                      aria-label={`Select table ${table.name}`}
                      className={`w-full text-left p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedTable?.name === table.name
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Table2 className="h-4 w-4" />
                        <span className="font-medium">{table.name}</span>
                      </div>
                      {table.description && (
                        <p className="text-xs opacity-80 mt-1">{table.description}</p>
                      )}
                      <Badge variant="outline" className="text-xs mt-1">
                        {table.schema}
                      </Badge>
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Columns */}
              {selectedTable && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Columns className="h-4 w-4" />
                      Colonnes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedTable.columns?.map((column) => (
                      <button
                        key={column.name}
                        type="button"
                        onClick={() => addColumn(selectedTable, column)}
                        aria-label={`Add column ${column.name} to query`}
                        className="w-full text-left p-2 rounded cursor-pointer hover:bg-accent flex items-center justify-between"
                      >
                        <div>
                          <span className="font-mono text-sm">{column.name}</span>
                          <Badge variant="outline" className="text-xs ml-2">
                            {column.type}
                          </Badge>
                          {column.primary && (
                            <Badge variant="secondary" className="text-xs ml-1">
                              PK
                            </Badge>
                          )}
                        </div>
                        <Plus className="h-4 w-4 opacity-50" />
                      </button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Query Configuration and Preview */}
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="design" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4 max-w-md ml-4 mt-4">
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="preview">Aperçu</TabsTrigger>
              <TabsTrigger value="sql">SQL</TabsTrigger>
              <TabsTrigger value="settings">Paramètres</TabsTrigger>
            </TabsList>

            <div className="flex-1 p-4">
              <TabsContent value="design" className="h-full space-y-4">
                {/* Selected Columns */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Colonnes sélectionnées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedColumns.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        Sélectionnez des colonnes depuis la table à gauche
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {selectedColumns.map((col, index) => (
                          <div
                            key={`${col.table}-${col.column}`}
                            className="flex items-center gap-2 p-2 bg-accent rounded"
                          >
                            <Badge variant="outline">{col.table}</Badge>
                            <span className="font-mono">{col.column}</span>
                            {col.alias && (
                              <>
                                <span className="text-muted-foreground">as</span>
                                <span className="font-mono">{col.alias}</span>
                              </>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeColumn(index)}
                              className="ml-auto h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Filters */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Filtres</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addFilter}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {filters.length === 0 ? (
                      <p className="text-muted-foreground text-sm">Aucun filtre défini</p>
                    ) : (
                      <div className="space-y-3">
                        {filters.map((filter, index) => (
                          <div
                            key={`filter-${filter.column}-${filter.operator}-${index}`}
                            className="flex items-center gap-2 p-2 border rounded"
                          >
                            <select
                              value={filter.column}
                              onChange={(e) => updateFilter(index, 'column', e.target.value)}
                              className="text-sm border rounded px-2 py-1"
                            >
                              {selectedColumns.map((col) => (
                                <option key={col.column} value={col.column}>
                                  {col.column}
                                </option>
                              ))}
                            </select>
                            <select
                              value={filter.operator}
                              onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                              className="text-sm border rounded px-2 py-1"
                            >
                              <option value="equals">=</option>
                              <option value="not_equals">≠</option>
                              <option value="contains">contient</option>
                              <option value="starts_with">commence par</option>
                              <option value="greater_than">&gt;</option>
                              <option value="less_than">&lt;</option>
                            </select>
                            <Input
                              value={filter.value}
                              onChange={(e) => updateFilter(index, 'value', e.target.value)}
                              placeholder="Valeur"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFilter(index)}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Sort and Limit */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Tri</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label>Colonne</Label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="w-full text-sm border rounded px-2 py-1 mt-1"
                        >
                          <option value="">Aucun tri</option>
                          {selectedColumns?.map((col) => (
                            <option key={col.column} value={col.column}>
                              {col.column}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label>Ordre</Label>
                        <select
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value as 'ASC' | 'DESC')}
                          className="w-full text-sm border rounded px-2 py-1 mt-1"
                        >
                          <option value="ASC">Croissant</option>
                          <option value="DESC">Décroissant</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Limite</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Label>Nombre max de lignes</Label>
                      <Input
                        type="number"
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="mt-1"
                        min="1"
                        max="10000"
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="h-full">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Aperçu des données
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-full overflow-auto">
                    {previewData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                        <Eye className="h-8 w-8 mb-2 opacity-50" />
                        <p>Cliquez sur "Exécuter" pour voir l'aperçu</p>
                      </div>
                    ) : (
                      <DataTablePreview
                        data={previewData}
                        columns={selectedColumns.map((col, index) => ({
                          name: col.alias || `${col.table}.${col.column}`,
                          type:
                            selectedTable?.columns?.find((c) => c.name === col.column)?.type ||
                            'text',
                          alias: col.alias || `${col.table}.${col.column}`,
                          columnName: col.column,
                          tableName: col.table,
                          label: col.alias || col.column,
                          dataType:
                            selectedTable?.columns?.find((c) => c.name === col.column)?.type ||
                            'text',
                          isVisible: true,
                          isSortable: true,
                          isFilterable: true,
                          displayOrder: index,
                          aggregation: col.aggregation,
                        }))}
                        calculatedFields={[]}
                        layout={{}}
                        settings={{}}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sql" className="h-full">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      SQL Généré
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg text-sm font-mono overflow-auto">
                      {generatedSQL || 'Sélectionnez des colonnes pour générer la requête SQL'}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="h-full">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Paramètres
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Nom de la requête</Label>
                      <Input
                        value={queryName}
                        onChange={(e) => setQueryName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={queryDescription}
                        onChange={(e) => setQueryDescription(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label>Actions</Label>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Exporter CSV
                        </Button>
                        <Button type="button" variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Exporter Excel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
