'use client'

import { Button } from '@erp/ui'
import { AlertTriangle, Database, Link, Plus, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@erp/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@erp/ui'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@erp/ui/primitives'
import { Input } from '@erp/ui/primitives'
import { Label } from '@erp/ui'
import { ScrollArea } from '@erp/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@erp/ui/primitives'
import { callClientApi } from '@/utils/backend-api'

interface TableSelectorProps {
  availableTables: any[]
  selectedTables: string[]
  mainTable: string
  joins: any[]
  columns: any[]
  onMainTableChange: (table: string) => void
  onJoinsChange: (joins: any[]) => void
  onTablesChange: (tables: string[]) => void
  onColumnsChange: (columns: any[]) => void
}

export function TableSelector({
  availableTables,
  selectedTables,
  mainTable,
  joins,
  columns,
  onMainTableChange,
  onJoinsChange,
  onTablesChange,
  onColumnsChange,
}: TableSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [showChangeTableDialog, setShowChangeTableDialog] = useState(false)
  const [showRemoveJoinDialog, setShowRemoveJoinDialog] = useState(false)
  const [pendingMainTable, setPendingMainTable] = useState('')
  const [pendingRemoveJoin, setPendingRemoveJoin] = useState<{
    index: number
    join: any
    columnsFromTable: any[]
  } | null>(null)
  const [newJoin, setNewJoin] = useState({
    fromTable: mainTable,
    fromColumn: '',
    toTable: '',
    toColumn: '',
    joinType: 'INNER' as any,
    alias: '',
  })
  const [fromColumnSearch, setFromColumnSearch] = useState('')
  const [toColumnSearch, setToColumnSearch] = useState('')
  const [availableFromColumns, setAvailableFromColumns] = useState<string[]>([])
  const [availableToColumns, setAvailableToColumns] = useState<string[]>([])
  const [_mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fonction pour récupérer les colonnes d'une table
  const getTableColumns = async (tableName: string): Promise<string[]> => {
    try {
      const response = await callClientApi(`tables/${tableName}/columns`)
      if (response.ok) {
        const data = await response.json()
        return data.columns || []
      }
    } catch (_error) {}

    // Fallback: retourner des colonnes communes si l'API n'est pas disponible
    return ['id', 'created_at', 'updated_at', 'name', 'title', 'status']
  }

  // Charger les colonnes quand la table "from" change
  useEffect(() => {
    if (newJoin.fromTable) {
      getTableColumns(newJoin.fromTable).then(setAvailableFromColumns)
    } else {
      setAvailableFromColumns([])
    }
  }, [newJoin.fromTable, getTableColumns])

  // Charger les colonnes quand la table "to" change
  useEffect(() => {
    if (newJoin.toTable) {
      getTableColumns(newJoin.toTable).then(setAvailableToColumns)
    } else {
      setAvailableToColumns([])
    }
  }, [newJoin.toTable, getTableColumns])

  // Réinitialiser les recherches et sélections quand les tables changent
  useEffect(() => {
    setFromColumnSearch('')
    setNewJoin((prev) => ({ ...prev, fromColumn: '' }))
  }, [])

  useEffect(() => {
    setToColumnSearch('')
    setNewJoin((prev) => ({ ...prev, toColumn: '' }))
  }, [])

  const filteredTables = Array.isArray(availableTables)
    ? availableTables.filter((table) =>
        (table.tableName || table.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : []

  const handleSelectMainTable = (tableName: string) => {
    // Si on a déjà des colonnes ou des jointures, demander confirmation
    if ((columns.length > 0 || joins.length > 0) && tableName !== mainTable) {
      setPendingMainTable(tableName)
      setShowChangeTableDialog(true)
      return
    }

    // Changement direct si pas de colonnes
    onMainTableChange(tableName)
    if (!selectedTables.includes(tableName)) {
      onTablesChange([tableName])
    }
  }

  const handleConfirmMainTableChange = () => {
    // Effacer toutes les colonnes et jointures
    onColumnsChange([])
    onJoinsChange([])
    onMainTableChange(pendingMainTable)
    onTablesChange([pendingMainTable])

    setShowChangeTableDialog(false)
    setPendingMainTable('')
  }

  const handleAddJoin = () => {
    const joinAlias = newJoin.alias || `${newJoin.toTable}_${joins.length + 1}`
    const join = {
      ...newJoin,
      alias: joinAlias,
      order: joins.length,
    }

    onJoinsChange([...joins, join])

    if (!selectedTables.includes(newJoin.toTable)) {
      onTablesChange([...selectedTables, newJoin.toTable])
    }

    resetJoinDialog()
  }

  const resetJoinDialog = () => {
    setShowJoinDialog(false)
    setNewJoin({
      fromTable: mainTable,
      fromColumn: '',
      toTable: '',
      toColumn: '',
      joinType: 'INNER',
      alias: '',
    })
    setFromColumnSearch('')
    setToColumnSearch('')
    setAvailableFromColumns([])
    setAvailableToColumns([])
  }

  const handleOpenJoinDialog = () => {
    setShowJoinDialog(true)
    // Réinitialiser le formulaire avec la table principale actuelle
    setNewJoin({
      fromTable: mainTable,
      fromColumn: '',
      toTable: '',
      toColumn: '',
      joinType: 'INNER',
      alias: '',
    })
  }

  const handleRemoveJoin = (index: number) => {
    const removedJoin = joins[index]

    // Check if the table is still used in other joins
    const newJoins = joins.filter((_, i) => i !== index)
    const tableStillUsed =
      newJoins.some((j) => j.toTable === removedJoin.toTable) || removedJoin.toTable === mainTable

    // If table won't be used anymore, check if there are selected columns from this table
    if (!tableStillUsed) {
      const columnsFromTable = columns.filter((col) => {
        // Check if column is from the table being removed
        const columnTable = col.table || col.tableName
        return (
          columnTable === removedJoin.toTable ||
          (removedJoin.alias && columnTable === removedJoin.alias)
        )
      })

      if (columnsFromTable.length > 0) {
        // Show confirmation dialog instead of window.confirm
        setPendingRemoveJoin({ index, join: removedJoin, columnsFromTable })
        setShowRemoveJoinDialog(true)
        return
      }

      // Remove the table from selected tables
      onTablesChange(selectedTables.filter((t) => t !== removedJoin.toTable))
    }

    // Remove the join directly if no columns are affected
    onJoinsChange(newJoins)
  }

  const handleConfirmRemoveJoin = () => {
    if (!pendingRemoveJoin) return

    const { index, join: removedJoin, columnsFromTable } = pendingRemoveJoin
    const newJoins = joins.filter((_, i) => i !== index)

    // Remove columns from the removed table
    const updatedColumns = columns.filter((col) => {
      const columnTable = col.table || col.tableName
      return !(
        columnTable === removedJoin.toTable ||
        (removedJoin.alias && columnTable === removedJoin.alias)
      )
    })
    onColumnsChange(updatedColumns)

    // Remove the table from selected tables
    onTablesChange(selectedTables.filter((t) => t !== removedJoin.toTable))

    // Remove the join
    onJoinsChange(newJoins)

    // Close dialog and reset state
    setShowRemoveJoinDialog(false)
    setPendingRemoveJoin(null)
  }

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Tables</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Main Table</Label>
                {(columns.length > 0 || joins.length > 0) && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                    {columns.length} col{columns.length !== 1 ? 's' : ''}, {joins.length} join
                    {joins.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <Select value={mainTable} onValueChange={handleSelectMainTable}>
                <SelectTrigger
                  className={columns.length > 0 || joins.length > 0 ? 'border-warning' : ''}
                >
                  <SelectValue placeholder="Select main table" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search tables..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  {filteredTables.map((table) => (
                    <SelectItem
                      key={table.tableName || table.name}
                      value={table.tableName || table.name}
                    >
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        {table.tableName || table.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Joined Tables</Label>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!mainTable}
                  onClick={handleOpenJoinDialog}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Join
                </Button>

                <Dialog open={showJoinDialog} onOpenChange={(open) => !open && resetJoinDialog()}>
                  <DialogContent
                    className="w-full max-w-3xl max-h-[90vh] flex flex-col p-0"
                  >
                    <div className="border-b pb-4 px-6 pt-6">
                      <h2 className="flex items-center gap-2 text-xl font-semibold">
                        <Link className="h-6 w-6 text-primary" />
                        Add Table Join
                      </h2>
                      <p className="text-sm text-muted-foreground mt-2">
                        Create a relationship between two tables by joining them on matching columns
                      </p>
                    </div>
                    <div className="space-y-6 py-6 px-6 overflow-y-auto flex-1 relative">
                      {newJoin.fromTable &&
                        newJoin.toTable &&
                        newJoin.fromColumn &&
                        newJoin.toColumn && (
                          <div className="p-4 bg-muted/50 rounded-lg border-2 border-dashed">
                            <div className="text-sm font-medium mb-2">Join Preview:</div>
                            <div className="font-mono text-sm text-center">
                              <div className="flex items-center justify-center gap-2 flex-wrap">
                                <span
                                  className="px-2 py-1 bg-primary/10 text-primary rounded truncate max-w-[120px]"
                                  title={newJoin.fromTable}
                                >
                                  {newJoin.fromTable}
                                </span>
                                <span className="text-muted-foreground whitespace-nowrap">
                                  {newJoin.joinType} JOIN
                                </span>
                                <span
                                  className="px-2 py-1 bg-secondary text-secondary-foreground rounded truncate max-w-[120px]"
                                  title={newJoin.toTable}
                                >
                                  {newJoin.toTable}
                                </span>
                              </div>
                              <div className="mt-2 text-xs text-muted-foreground break-all">
                                ON <span className="break-all">{newJoin.fromTable}</span>.
                                <span className="break-all">{newJoin.fromColumn}</span> ={' '}
                                <span className="break-all">{newJoin.toTable}</span>.
                                <span className="break-all">{newJoin.toColumn}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>From Table</Label>
                          <Select
                            value={newJoin.fromTable}
                            onValueChange={(value) => setNewJoin({ ...newJoin, fromTable: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedTables.map((table) => (
                                <SelectItem key={table} value={table}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    <span className="truncate" title={table}>
                                      {table}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>From Column</Label>
                          <div className="space-y-2">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                value={fromColumnSearch}
                                onChange={(e) => setFromColumnSearch(e.target.value)}
                                placeholder="Search columns..."
                                className="pl-9"
                              />
                            </div>
                            <Select
                              value={newJoin.fromColumn}
                              onValueChange={(value) =>
                                setNewJoin({ ...newJoin, fromColumn: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select column" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableFromColumns
                                  .filter((col) =>
                                    col.toLowerCase().includes(fromColumnSearch.toLowerCase())
                                  )
                                  .map((column) => (
                                    <SelectItem key={column} value={column}>
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                                        {column}
                                      </div>
                                    </SelectItem>
                                  ))}
                                {availableFromColumns.filter((col) =>
                                  col.toLowerCase().includes(fromColumnSearch.toLowerCase())
                                ).length === 0 && (
                                  <div className="p-2 text-xs text-muted-foreground text-center">
                                    {newJoin.fromTable
                                      ? 'No columns found'
                                      : 'Select a table first'}
                                  </div>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label>Join Type</Label>
                        <Select
                          value={newJoin.joinType}
                          onValueChange={(value) =>
                            setNewJoin({ ...newJoin, joinType: value as any })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INNER">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                                INNER JOIN - Only matching records
                              </div>
                            </SelectItem>
                            <SelectItem value="LEFT">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                                LEFT JOIN - All from left table
                              </div>
                            </SelectItem>
                            <SelectItem value="RIGHT">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-accent rounded-full"></div>
                                RIGHT JOIN - All from right table
                              </div>
                            </SelectItem>
                            <SelectItem value="FULL">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                                FULL JOIN - All records from both
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>To Table</Label>
                          <Select
                            value={newJoin.toTable}
                            onValueChange={(value) => setNewJoin({ ...newJoin, toTable: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select table" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.isArray(availableTables)
                                ? availableTables
                                    .filter((t) => !selectedTables.includes(t.tableName || t.name))
                                    .map((table) => (
                                      <SelectItem
                                        key={table.tableName || table.name}
                                        value={table.tableName || table.name}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 bg-secondary rounded-full"></div>
                                          <span
                                            className="truncate"
                                            title={table.tableName || table.name}
                                          >
                                            {table.tableName || table.name}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))
                                : []}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>To Column</Label>
                          <div className="space-y-2">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                value={toColumnSearch}
                                onChange={(e) => setToColumnSearch(e.target.value)}
                                placeholder="Search columns..."
                                className="pl-9"
                              />
                            </div>
                            <Select
                              value={newJoin.toColumn}
                              onValueChange={(value) => setNewJoin({ ...newJoin, toColumn: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select column" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableToColumns
                                  .filter((col) =>
                                    col.toLowerCase().includes(toColumnSearch.toLowerCase())
                                  )
                                  .map((column) => (
                                    <SelectItem key={column} value={column}>
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-secondary rounded-full"></div>
                                        {column}
                                      </div>
                                    </SelectItem>
                                  ))}
                                {availableToColumns.filter((col) =>
                                  col.toLowerCase().includes(toColumnSearch.toLowerCase())
                                ).length === 0 && (
                                  <div className="p-2 text-xs text-muted-foreground text-center">
                                    {newJoin.toTable ? 'No columns found' : 'Select a table first'}
                                  </div>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label>Alias (optional)</Label>
                        <Input
                          value={newJoin.alias}
                          onChange={(e) => setNewJoin({ ...newJoin, alias: e.target.value })}
                          placeholder="Table alias"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 px-6 pb-6 border-t bg-background sticky bottom-0 z-10">
                      <div className="text-sm text-muted-foreground">
                        {newJoin.fromColumn &&
                        newJoin.toColumn &&
                        newJoin.toTable &&
                        newJoin.fromTable
                          ? '✓ Ready to create join'
                          : 'Please select all required fields'}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={resetJoinDialog}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddJoin}
                          disabled={!newJoin.fromColumn || !newJoin.toTable || !newJoin.toColumn}
                          className="min-w-[100px]"
                        >
                          <Link className="h-4 w-4 mr-2" />
                          Add Join
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <ScrollArea className="h-64 border rounded-md p-2">
                {joins.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">No joins configured</div>
                ) : (
                  <div className="space-y-2">
                    {joins.map((join, index) => {
                      // Check if this join's table has selected columns
                      const hasSelectedColumns = columns.some((col) => {
                        const columnTable = col.table || col.tableName
                        return (
                          columnTable === join.toTable || (join.alias && columnTable === join.alias)
                        )
                      })

                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            hasSelectedColumns
                              ? 'bg-amber-50 border-amber-200'
                              : 'bg-muted border-border'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                              <Link className="h-4 w-4 text-primary flex-shrink-0" />
                              <Badge variant="secondary" className="font-medium flex-shrink-0">
                                {join.joinType}
                              </Badge>
                              <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                                <span className="font-semibold truncate" title={join.toTable}>
                                  {join.toTable}
                                </span>
                                {join.alias && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs max-w-[80px] overflow-hidden"
                                  >
                                    <span className="truncate block" title={`as ${join.alias}`}>
                                      as {join.alias}
                                    </span>
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {hasSelectedColumns && (
                                <div
                                  className="bg-amber-100 text-amber-700 rounded-full px-2 py-1 text-xs font-medium"
                                  title="Cette table a des colonnes sélectionnées"
                                >
                                  {
                                    columns.filter((col) => {
                                      const columnTable = col.table || col.tableName
                                      return (
                                        columnTable === join.toTable ||
                                        (join.alias && columnTable === join.alias)
                                      )
                                    }).length
                                  }{' '}
                                  col.
                                </div>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveJoin(index)}
                                className="h-6 w-6 p-0 flex-shrink-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono bg-background px-2 py-1 rounded break-all">
                            ON <span className="break-all">{join.fromTable}</span>.
                            <span className="break-all">{join.fromColumn}</span> ={' '}
                            <span className="break-all">{join.toTable}</span>.
                            <span className="break-all">{join.toColumn}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmation pour changement de table principale - rendu en dehors du Card */}
      <Dialog open={showChangeTableDialog} onOpenChange={setShowChangeTableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Changer la table principale ?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm">
                  Vous avez déjà sélectionné <strong>{columns.length} colonnes</strong>
                  {joins.length > 0 && (
                    <span>
                      {' '}
                      et <strong>{joins.length} jointures</strong>
                    </span>
                  )}
                  .
                </p>
              </div>
              <p className="text-sm">
                Changer la table principale de <strong>"{mainTable}"</strong> vers{' '}
                <strong>"{pendingMainTable}"</strong>
                supprimera toutes les colonnes et jointures actuelles.
              </p>
              <p className="text-xs text-muted-foreground">
                ⚠️ Cette action ne peut pas être annulée.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowChangeTableDialog(false)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleConfirmMainTableChange}>
                Confirmer le changement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation pour suppression de jointure */}
      <Dialog open={showRemoveJoinDialog} onOpenChange={setShowRemoveJoinDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Supprimer cette jointure ?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {pendingRemoveJoin && (
              <>
                <div className="space-y-3">
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm">
                      La table <strong>"{pendingRemoveJoin.join.toTable}"</strong> est utilisée par{' '}
                      <strong>{pendingRemoveJoin.columnsFromTable.length} colonne(s)</strong>{' '}
                      sélectionnée(s).
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Colonnes concernées :</p>
                    <div className="flex flex-wrap gap-1">
                      {pendingRemoveJoin.columnsFromTable.map((col, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium"
                        >
                          {col.name || col.columnName}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm">
                    Supprimer cette jointure retirera automatiquement ces colonnes de votre
                    sélection.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ⚠️ Cette action ne peut pas être annulée.
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRemoveJoinDialog(false)
                      setPendingRemoveJoin(null)
                    }}
                  >
                    Annuler
                  </Button>
                  <Button variant="destructive" onClick={handleConfirmRemoveJoin}>
                    Supprimer la jointure
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
