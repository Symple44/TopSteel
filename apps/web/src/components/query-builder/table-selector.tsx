'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, X, Database, Link, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface TableSelectorProps {
  availableTables: any[]
  selectedTables: string[]
  mainTable: string
  joins: any[]
  onMainTableChange: (table: string) => void
  onJoinsChange: (joins: any[]) => void
  onTablesChange: (tables: string[]) => void
}

export function TableSelector({
  availableTables,
  selectedTables,
  mainTable,
  joins,
  onMainTableChange,
  onJoinsChange,
  onTablesChange,
}: TableSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showJoinDialog, setShowJoinDialog] = useState(false)
  const [newJoin, setNewJoin] = useState({
    fromTable: mainTable,
    fromColumn: '',
    toTable: '',
    toColumn: '',
    joinType: 'INNER' as any,
    alias: '',
  })

  const filteredTables = Array.isArray(availableTables) 
    ? availableTables.filter(table =>
        table.tableName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : []

  const handleSelectMainTable = (tableName: string) => {
    onMainTableChange(tableName)
    if (!selectedTables.includes(tableName)) {
      onTablesChange([...selectedTables, tableName])
    }
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
    
    setShowJoinDialog(false)
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
    const newJoins = joins.filter((_, i) => i !== index)
    onJoinsChange(newJoins)
    
    // Check if the table is still used
    const tableStillUsed = newJoins.some(j => j.toTable === removedJoin.toTable) || 
                          removedJoin.toTable === mainTable
    
    if (!tableStillUsed) {
      onTablesChange(selectedTables.filter(t => t !== removedJoin.toTable))
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Tables</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-4">
          <div>
            <Label>Main Table</Label>
            <Select value={mainTable} onValueChange={handleSelectMainTable}>
              <SelectTrigger>
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
                  <SelectItem key={table.tableName} value={table.tableName}>
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      {table.tableName}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Joined Tables</Label>
              <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" disabled={!mainTable}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Join
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Table Join</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
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
                                {table}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>From Column</Label>
                        <Input
                          value={newJoin.fromColumn}
                          onChange={(e) => setNewJoin({ ...newJoin, fromColumn: e.target.value })}
                          placeholder="Column name"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Join Type</Label>
                      <Select 
                        value={newJoin.joinType} 
                        onValueChange={(value) => setNewJoin({ ...newJoin, joinType: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INNER">INNER JOIN</SelectItem>
                          <SelectItem value="LEFT">LEFT JOIN</SelectItem>
                          <SelectItem value="RIGHT">RIGHT JOIN</SelectItem>
                          <SelectItem value="FULL">FULL JOIN</SelectItem>
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
                                  .filter(t => !selectedTables.includes(t.tableName))
                                  .map((table) => (
                                    <SelectItem key={table.tableName} value={table.tableName}>
                                      {table.tableName}
                                    </SelectItem>
                                  ))
                              : []}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>To Column</Label>
                        <Input
                          value={newJoin.toColumn}
                          onChange={(e) => setNewJoin({ ...newJoin, toColumn: e.target.value })}
                          placeholder="Column name"
                        />
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

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowJoinDialog(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAddJoin}
                        disabled={!newJoin.fromColumn || !newJoin.toTable || !newJoin.toColumn}
                      >
                        Add Join
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <ScrollArea className="h-64 border rounded-md p-2">
              {joins.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No joins configured
                </div>
              ) : (
                <div className="space-y-2">
                  {joins.map((join, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <div className="flex items-center gap-2 text-sm">
                        <Link className="h-4 w-4" />
                        <span className="font-medium">{join.joinType}</span>
                        <span>{join.toTable}</span>
                        {join.alias && (
                          <Badge variant="secondary" className="text-xs">
                            {join.alias}
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveJoin(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}