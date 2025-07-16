'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n'
import { Button, Card, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge } from '@erp/ui'
import { Plus, Edit, Trash2, GripVertical, RotateCcw, Save } from 'lucide-react'
import { useSystemParameters } from '@/hooks/use-system-parameters'
import { toast } from 'sonner'

interface ListItem {
  id: string
  value: string
  label: string
}

export function UnitsAndListsSettings() {
  const { t } = useTranslation('admin')
  const { parameters, updateParameter, resetToDefaults, saveParameters } = useSystemParameters()
  const [editingItem, setEditingItem] = useState<{ listKey: string; item: ListItem } | null>(null)
  const [newItem, setNewItem] = useState<{ listKey: string; value: string } | null>(null)

  const handleSave = async () => {
    try {
      await saveParameters()
      toast.success(t('saveSuccess'))
    } catch (error) {
      toast.error(t('saveError'))
    }
  }

  const handleReset = async () => {
    if (confirm(t('resetConfirm'))) {
      try {
        await resetToDefaults()
        toast.success(t('resetSuccess'))
      } catch (error) {
        toast.error(t('resetError'))
      }
    }
  }

  const lists = [
    { key: 'STOCK_UNITS', title: t('units.stockUnits') },
    { key: 'MATERIAL_CATEGORIES', title: t('units.materialCategories') },
    { key: 'PROJECT_STATUSES', title: t('units.projectStatuses') },
    { key: 'PRODUCTION_STATUSES', title: t('units.productionStatuses') },
    { key: 'SUPPLIER_PAYMENT_TERMS', title: t('units.paymentTerms') },
  ]

  const getListItems = (key: string): string[] => {
    try {
      const value = parameters?.[key]
      return value ? JSON.parse(value) : []
    } catch {
      return []
    }
  }

  const updateList = (key: string, items: string[]) => {
    updateParameter(key, JSON.stringify(items))
  }

  const handleAddItem = (listKey: string) => {
    if (newItem?.listKey === listKey && newItem.value) {
      const items = getListItems(listKey)
      updateList(listKey, [...items, newItem.value])
      setNewItem(null)
    }
  }

  const handleUpdateItem = (listKey: string, index: number, newValue: string) => {
    const items = getListItems(listKey)
    items[index] = newValue
    updateList(listKey, items)
    setEditingItem(null)
  }

  const handleDeleteItem = (listKey: string, index: number) => {
    if (window.confirm(t('units.deleteConfirm'))) {
      const items = getListItems(listKey)
      items.splice(index, 1)
      updateList(listKey, items)
    }
  }

  const handleMoveItem = (listKey: string, fromIndex: number, toIndex: number) => {
    const items = getListItems(listKey)
    const [removed] = items.splice(fromIndex, 1)
    items.splice(toIndex, 0, removed)
    updateList(listKey, items)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{t('units.title')}</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('common.reset')}
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            {t('common.save')}
          </Button>
        </div>
      </div>
      
      {lists.map((list) => (
        <Card key={list.key} className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium">{list.title}</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setNewItem({ listKey: list.key, value: '' })}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('units.addItem')}
            </Button>
          </div>

          <div className="space-y-2">
            {getListItems(list.key).map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg border bg-background p-2"
              >
                <GripVertical className="h-4 w-4 cursor-move text-muted-foreground" />
                
                {editingItem?.listKey === list.key && editingItem.item.value === item ? (
                  <Input
                    value={editingItem.item.label}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingItem({
                      listKey: list.key,
                      item: { ...editingItem.item, label: e.target.value }
                    })}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === 'Enter') {
                        handleUpdateItem(list.key, index, editingItem.item.label)
                      } else if (e.key === 'Escape') {
                        setEditingItem(null)
                      }
                    }}
                    autoFocus
                    className="flex-1"
                  />
                ) : (
                  <Badge variant="secondary" className="flex-1 justify-start">
                    {item}
                  </Badge>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingItem({
                    listKey: list.key,
                    item: { id: String(index), value: item, label: item }
                  })}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteItem(list.key, index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {newItem?.listKey === list.key && (
              <div className="flex items-center gap-2">
                <Input
                  value={newItem.value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItem({ ...newItem, value: e.target.value })}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      handleAddItem(list.key)
                    } else if (e.key === 'Escape') {
                      setNewItem(null)
                    }
                  }}
                  placeholder="Nouvelle valeur..."
                  autoFocus
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={() => handleAddItem(list.key)}
                  disabled={!newItem.value}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setNewItem(null)}
                >
                  <span className="sr-only">Cancel</span>
                  ×
                </Button>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}