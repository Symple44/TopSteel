'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../../data-display/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../../primitives/select'
import { Input } from '../../../primitives/input'
import { Button } from '../../../primitives/button'
import { Badge } from '../../../data-display/badge'
import { SimpleTooltip } from '../../../primitives/tooltip'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../layout/card'
import { Label } from '../../../forms/label'
import { Alert, AlertDescription } from '../../../feedback/alert'
import { 
  Save, 
  Plus, 
  Trash2, 
  Copy, 
  Edit2, 
  X, 
  Check,
  AlertCircle,
  Download,
  Upload,
  Grid,
  List
} from 'lucide-react'
import type React from 'react'
import { useState, useCallback, useMemo } from 'react'
import { cn } from '../../../../lib/utils'
import type { PriceRule, AdjustmentType } from '../PriceRuleCard/PriceRuleCard'

export interface PriceMatrixProps {
  rules: PriceRule[]
  onUpdate: (rules: PriceRule[]) => void
  onDelete?: (ruleId: string) => void
  onDuplicate?: (rule: PriceRule) => void
  className?: string
  editable?: boolean
  groupBy?: 'article' | 'customer' | 'channel' | 'none'
  showTotals?: boolean
  compact?: boolean
}

interface EditableCell {
  ruleId: string
  field: keyof PriceRule
  value: any
}

interface GroupedRules {
  groupKey: string
  groupLabel: string
  rules: PriceRule[]
}

const ADJUSTMENT_TYPES = [
  { value: 'PERCENTAGE', label: '%', color: 'bg-blue-100' },
  { value: 'FIXED_AMOUNT', label: '€', color: 'bg-green-100' },
  { value: 'FIXED_PRICE', label: 'Fix', color: 'bg-purple-100' },
  { value: 'PRICE_PER_WEIGHT', label: 'kg', color: 'bg-orange-100' },
  { value: 'PRICE_PER_LENGTH', label: 'm', color: 'bg-cyan-100' },
  { value: 'PRICE_PER_SURFACE', label: 'm²', color: 'bg-pink-100' },
  { value: 'PRICE_PER_VOLUME', label: 'm³', color: 'bg-indigo-100' },
  { value: 'FORMULA', label: 'f(x)', color: 'bg-gray-100' }
]

const CHANNELS = [
  { value: 'ALL', label: 'Tous', color: 'default' },
  { value: 'ERP', label: 'ERP', color: 'secondary' },
  { value: 'MARKETPLACE', label: 'Marketplace', color: 'secondary' },
  { value: 'B2B', label: 'B2B', color: 'secondary' },
  { value: 'API', label: 'API', color: 'secondary' }
]

export function PriceMatrix({
  rules = [],
  onUpdate,
  onDelete,
  onDuplicate,
  className,
  editable = true,
  groupBy = 'none',
  showTotals = false,
  compact = false
}: PriceMatrixProps) {
  const [editingCell, setEditingCell] = useState<EditableCell | null>(null)
  const [selectedRules, setSelectedRules] = useState<Set<string>>(new Set())
  const [tempValue, setTempValue] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  // Grouper les règles selon le critère sélectionné
  const groupedRules = useMemo(() => {
    if (groupBy === 'none') {
      return [{ groupKey: 'all', groupLabel: 'Toutes les règles', rules }]
    }

    const groups = new Map<string, PriceRule[]>()
    
    rules.forEach(rule => {
      let key = ''
      let label = ''
      
      switch (groupBy) {
        case 'article':
          key = rule.articleFamily || rule.articleId || 'general'
          label = rule.articleFamily || rule.articleId || 'Général'
          break
        case 'customer':
          key = rule.customerGroup || 'all'
          label = rule.customerGroup || 'Tous clients'
          break
        case 'channel':
          key = rule.channel
          label = CHANNELS.find(c => c.value === rule.channel)?.label || rule.channel
          break
      }
      
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(rule)
    })
    
    return Array.from(groups.entries()).map(([key, rules]) => ({
      groupKey: key,
      groupLabel: key,
      rules
    }))
  }, [rules, groupBy])

  // Calculer les totaux
  const totals = useMemo(() => {
    if (!showTotals) return null
    
    const activeRules = rules.filter(r => r.isActive)
    const totalDiscount = activeRules
      .filter(r => r.adjustmentType === 'PERCENTAGE' && r.adjustmentValue < 0)
      .reduce((sum, r) => sum + Math.abs(r.adjustmentValue), 0)
    
    const totalSurcharge = activeRules
      .filter(r => r.adjustmentType === 'PERCENTAGE' && r.adjustmentValue > 0)
      .reduce((sum, r) => sum + r.adjustmentValue, 0)
    
    return {
      total: rules.length,
      active: activeRules.length,
      inactive: rules.length - activeRules.length,
      averageDiscount: totalDiscount / activeRules.length || 0,
      averageSurcharge: totalSurcharge / activeRules.length || 0
    }
  }, [rules, showTotals])

  const startEditing = useCallback((ruleId: string, field: keyof PriceRule, value: any) => {
    if (!editable) return
    setEditingCell({ ruleId, field, value })
    setTempValue(value)
  }, [editable])

  const cancelEditing = useCallback(() => {
    setEditingCell(null)
    setTempValue(null)
  }, [])

  const saveEdit = useCallback(() => {
    if (!editingCell) return
    
    const updatedRules = rules.map(rule => {
      if (rule.id === editingCell.ruleId) {
        return {
          ...rule,
          [editingCell.field]: tempValue
        }
      }
      return rule
    })
    
    onUpdate(updatedRules)
    cancelEditing()
  }, [editingCell, tempValue, rules, onUpdate, cancelEditing])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit()
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }, [saveEdit, cancelEditing])

  const toggleRuleSelection = useCallback((ruleId: string) => {
    setSelectedRules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(ruleId)) {
        newSet.delete(ruleId)
      } else {
        newSet.add(ruleId)
      }
      return newSet
    })
  }, [])

  const selectAllRules = useCallback(() => {
    if (selectedRules.size === rules.length) {
      setSelectedRules(new Set())
    } else {
      setSelectedRules(new Set(rules.map(r => r.id)))
    }
  }, [selectedRules, rules])

  const deleteSelectedRules = useCallback(() => {
    if (!onDelete) return
    selectedRules.forEach(ruleId => onDelete(ruleId))
    setSelectedRules(new Set())
  }, [selectedRules, onDelete])

  const renderEditableCell = (rule: PriceRule, field: keyof PriceRule, value: any) => {
    const isEditing = editingCell?.ruleId === rule.id && editingCell?.field === field
    
    if (isEditing) {
      switch (field) {
        case 'adjustmentType':
          return (
            <Select
              value={tempValue}
              onValueChange={setTempValue}
            >
              <SelectTrigger className="h-8 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADJUSTMENT_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        
        case 'channel':
          return (
            <Select
              value={tempValue}
              onValueChange={setTempValue}
            >
              <SelectTrigger className="h-8 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS.map(channel => (
                  <SelectItem key={channel.value} value={channel.value}>
                    {channel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        
        case 'isActive':
          return (
            <input
              type="checkbox"
              checked={tempValue}
              onChange={(e) => setTempValue(e.target.checked)}
              className="w-4 h-4"
            />
          )
        
        case 'priority':
        case 'adjustmentValue':
        case 'minQuantity':
        case 'maxQuantity':
          return (
            <Input
              type="number"
              value={tempValue}
              onChange={(e) => setTempValue(Number(e.target.value))}
              onKeyDown={handleKeyDown}
              className="h-8 w-20"
              autoFocus
            />
          )
        
        default:
          return (
            <Input
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-8"
              autoFocus
            />
          )
      }
    }
    
    // Affichage normal (non édition)
    switch (field) {
      case 'adjustmentType':
        const type = ADJUSTMENT_TYPES.find(t => t.value === value)
        return (
          <Badge 
            variant="outline" 
            className={cn('cursor-pointer', type?.color)}
            onClick={() => startEditing(rule.id, field, value)}
          >
            {type?.label}
          </Badge>
        )
      
      case 'channel':
        const channel = CHANNELS.find(c => c.value === value)
        return (
          <Badge 
            variant={channel?.color as any || 'outline'}
            className="cursor-pointer"
            onClick={() => startEditing(rule.id, field, value)}
          >
            {channel?.label}
          </Badge>
        )
      
      case 'isActive':
        return (
          <div 
            className="cursor-pointer"
            onClick={() => startEditing(rule.id, field, value)}
          >
            {value ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <X className="w-4 h-4 text-gray-400" />
            )}
          </div>
        )
      
      case 'adjustmentValue':
        return (
          <span 
            className="cursor-pointer font-mono"
            onClick={() => startEditing(rule.id, field, value)}
          >
            {rule.adjustmentType === 'PERCENTAGE' ? `${value}%` : `${value}€`}
          </span>
        )
      
      default:
        return (
          <span 
            className="cursor-pointer"
            onClick={() => startEditing(rule.id, field, value)}
          >
            {value || '-'}
          </span>
        )
    }
  }

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <Table className={cn('min-w-full', compact && 'text-sm')}>
        <TableHeader>
          <TableRow>
            {editable && (
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedRules.size === rules.length && rules.length > 0}
                  onChange={selectAllRules}
                  className="w-4 h-4"
                />
              </TableHead>
            )}
            <TableHead>Nom</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Valeur</TableHead>
            <TableHead>Canal</TableHead>
            <TableHead>Priorité</TableHead>
            <TableHead>Quantité</TableHead>
            <TableHead>Période</TableHead>
            <TableHead>Statut</TableHead>
            {editable && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupedRules.map(group => (
            <>
              {groupBy !== 'none' && (
                <TableRow key={`group-${group.groupKey}`}>
                  <TableCell 
                    colSpan={editable ? 10 : 9} 
                    className="bg-gray-50 font-medium"
                  >
                    {group.groupLabel} ({group.rules.length})
                  </TableCell>
                </TableRow>
              )}
              {group.rules.map(rule => (
                <TableRow key={rule.id}>
                  {editable && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedRules.has(rule.id)}
                        onChange={() => toggleRuleSelection(rule.id)}
                        className="w-4 h-4"
                      />
                    </TableCell>
                  )}
                  <TableCell>{renderEditableCell(rule, 'ruleName', rule.ruleName)}</TableCell>
                  <TableCell>{renderEditableCell(rule, 'adjustmentType', rule.adjustmentType)}</TableCell>
                  <TableCell>{renderEditableCell(rule, 'adjustmentValue', rule.adjustmentValue)}</TableCell>
                  <TableCell>{renderEditableCell(rule, 'channel', rule.channel)}</TableCell>
                  <TableCell>{renderEditableCell(rule, 'priority', rule.priority)}</TableCell>
                  <TableCell>
                    {rule.minQuantity || rule.maxQuantity ? (
                      <span className="text-xs">
                        {rule.minQuantity && `≥${rule.minQuantity}`}
                        {rule.minQuantity && rule.maxQuantity && ' - '}
                        {rule.maxQuantity && `≤${rule.maxQuantity}`}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {rule.validFrom || rule.validUntil ? (
                      <span className="text-xs">
                        {rule.validFrom && new Date(rule.validFrom).toLocaleDateString()}
                        {rule.validFrom && rule.validUntil && ' - '}
                        {rule.validUntil && new Date(rule.validUntil).toLocaleDateString()}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{renderEditableCell(rule, 'isActive', rule.isActive)}</TableCell>
                  {editable && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {onDuplicate && (
                          <SimpleTooltip content="Dupliquer">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDuplicate(rule)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </SimpleTooltip>
                        )}
                        {onDelete && (
                          <SimpleTooltip content="Supprimer">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(rule.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </SimpleTooltip>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {rules.map(rule => (
        <Card key={rule.id} className={cn(
          'relative',
          selectedRules.has(rule.id) && 'ring-2 ring-primary'
        )}>
          {editable && (
            <div className="absolute top-2 right-2">
              <input
                type="checkbox"
                checked={selectedRules.has(rule.id)}
                onChange={() => toggleRuleSelection(rule.id)}
                className="w-4 h-4"
              />
            </div>
          )}
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{rule.ruleName}</CardTitle>
            <CardDescription className="text-xs">
              {rule.description || 'Pas de description'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Type</span>
              {renderEditableCell(rule, 'adjustmentType', rule.adjustmentType)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Valeur</span>
              {renderEditableCell(rule, 'adjustmentValue', rule.adjustmentValue)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Canal</span>
              {renderEditableCell(rule, 'channel', rule.channel)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Statut</span>
              {renderEditableCell(rule, 'isActive', rule.isActive)}
            </div>
            {editable && (
              <div className="flex items-center gap-2 pt-2 border-t">
                {onDuplicate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDuplicate(rule)}
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(rule.id)}
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className={cn('space-y-4', className)}>
      {/* Barre d'outils */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {editable && selectedRules.size > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {selectedRules.size} sélectionné{selectedRules.size > 1 ? 's' : ''}
              </Badge>
              <Button
                variant="destructive"
                size="sm"
                onClick={deleteSelectedRules}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            </div>
          )}
          
          <Select value={groupBy} onValueChange={(value: any) => {}}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sans groupement</SelectItem>
              <SelectItem value="article">Par article</SelectItem>
              <SelectItem value="customer">Par client</SelectItem>
              <SelectItem value="channel">Par canal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
          >
            {viewMode === 'table' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Message d'édition */}
      {editingCell && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Appuyez sur Entrée pour sauvegarder ou Échap pour annuler
          </AlertDescription>
        </Alert>
      )}

      {/* Vue principale */}
      {viewMode === 'table' ? renderTableView() : renderGridView()}

      {/* Totaux */}
      {showTotals && totals && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Statistiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Total règles</Label>
                <p className="font-medium">{totals.total}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Actives</Label>
                <p className="font-medium text-green-600">{totals.active}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Inactives</Label>
                <p className="font-medium text-gray-400">{totals.inactive}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Remise moy.</Label>
                <p className="font-medium">{totals.averageDiscount.toFixed(1)}%</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Majoration moy.</Label>
                <p className="font-medium">{totals.averageSurcharge.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message vide */}
      {rules.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Aucune règle de prix</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}