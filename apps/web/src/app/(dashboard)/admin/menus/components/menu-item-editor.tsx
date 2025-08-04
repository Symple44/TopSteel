'use client'

import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Folder,
  GripVertical,
  Play,
  Plus,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@erp/ui'
import { Button } from '@erp/ui/primitives'
import { Card, CardContent, CardHeader } from '@erp/ui'
import { Input } from '@erp/ui/primitives'
import { Label } from '@erp/ui'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@erp/ui/primitives'
import { Switch } from '@erp/ui/primitives'
import { cn } from '@/lib/utils'
import type { Group, MenuItem, MenuType, Permission, Role } from '@/types/menu'
import { MenuItemRightsEditor } from './menu-item-rights-editor'

interface MenuItemEditorProps {
  item: MenuItem
  menuTypes: MenuType[]
  level?: number
  onUpdate: (item: MenuItem) => void
  onDelete: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  parentItem?: MenuItem
  availableGroups?: Group[]
  availableRoles?: Role[]
  availablePermissions?: Permission[]
}

export function MenuItemEditor({
  item,
  menuTypes,
  level = 0,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  parentItem,
  availableGroups = [],
  availableRoles = [],
  availablePermissions = [],
}: MenuItemEditorProps) {
  const [expanded, setExpanded] = useState(true)

  const currentType = menuTypes.find((t) => t.value === item.type)

  const handleFieldChange = (field: string, value: string | boolean | number | null) => {
    onUpdate({
      ...item,
      [field]: value,
    })
  }

  const handleTypeChange = (newType: string) => {
    const updatedItem = {
      ...item,
      type: newType as 'M' | 'P' | 'L' | 'D',
      // Réinitialiser les champs spécifiques selon le type
      programId: newType === 'P' ? item.programId : undefined,
      externalUrl: newType === 'L' ? item.externalUrl : undefined,
      queryBuilderId: newType === 'D' ? item.queryBuilderId : undefined,
    }
    onUpdate(updatedItem)
  }

  const addChildItem = () => {
    if (!currentType?.canHaveChildren) return

    const newChild: MenuItem = {
      title: 'Nouvel élément enfant',
      type: 'P',
      icon: 'Play',
      orderIndex: item.children.length,
      isVisible: true,
      children: [],
    }

    onUpdate({
      ...item,
      children: [...item.children, newChild],
    })
  }

  const updateChildItem = (childIndex: number, childItem: MenuItem) => {
    const updatedChildren = [...item.children]
    updatedChildren[childIndex] = childItem
    onUpdate({
      ...item,
      children: updatedChildren,
    })
  }

  const deleteChildItem = (childIndex: number) => {
    const updatedChildren = item.children.filter((_, i) => i !== childIndex)
    onUpdate({
      ...item,
      children: updatedChildren,
    })
  }

  const moveChildItem = (childIndex: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? childIndex - 1 : childIndex + 1
    if (newIndex < 0 || newIndex >= item.children.length) return

    const updatedChildren = [...item.children]
    const temp = updatedChildren[childIndex]
    updatedChildren[childIndex] = updatedChildren[newIndex]
    updatedChildren[newIndex] = temp

    // Mettre à jour les orderIndex
    updatedChildren.forEach((child, i) => {
      child.orderIndex = i
    })

    onUpdate({
      ...item,
      children: updatedChildren,
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'M':
        return <Folder className="h-4 w-4" />
      case 'P':
        return <Play className="h-4 w-4" />
      case 'L':
        return <ExternalLink className="h-4 w-4" />
      case 'D':
        return <BarChart3 className="h-4 w-4" />
      default:
        return <Play className="h-4 w-4" />
    }
  }

  return (
    <div className={cn('space-y-2', level > 0 && 'ml-6 border-l-2 border-muted pl-4')}>
      <Card className={cn(!item.isVisible && 'opacity-60 border-dashed')}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setExpanded(!expanded)}
              >
                <GripVertical className="h-4 w-4" />
              </Button>
              {getTypeIcon(item.type)}
              <span className="font-medium">{item.title || 'Sans titre'}</span>
              <Badge variant="outline" className="text-xs">
                {currentType?.label}
              </Badge>
              {!item.isVisible && (
                <Badge variant="secondary" className="text-xs">
                  Masqué
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              {onMoveUp && (
                <Button variant="ghost" size="sm" onClick={onMoveUp}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
              )}
              {onMoveDown && (
                <Button variant="ghost" size="sm" onClick={onMoveDown}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input
                  value={item.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  placeholder="Titre de l'élément"
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={item.type} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {menuTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(type.value)}
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Icône</Label>
                <Input
                  value={item.icon || ''}
                  onChange={(e) => handleFieldChange('icon', e.target.value)}
                  placeholder="Nom de l'icône Lucide"
                />
              </div>

              <div className="space-y-2">
                <Label>Ordre</Label>
                <Input
                  type="number"
                  value={item.orderIndex}
                  onChange={(e) => handleFieldChange('orderIndex', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label>Visible</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    checked={item.isVisible}
                    onCheckedChange={(checked) => handleFieldChange('isVisible', checked)}
                  />
                  <span className="text-sm">{item.isVisible ? 'Visible' : 'Masqué'}</span>
                </div>
              </div>
            </div>

            {/* Champs spécifiques selon le type */}
            {item.type === 'P' && (
              <div className="space-y-2">
                <Label>ID du Programme</Label>
                <Input
                  value={item.programId || ''}
                  onChange={(e) => handleFieldChange('programId', e.target.value)}
                  placeholder="/dashboard, /admin/users, etc."
                />
              </div>
            )}

            {item.type === 'L' && (
              <div className="space-y-2">
                <Label>URL Externe</Label>
                <Input
                  value={item.externalUrl || ''}
                  onChange={(e) => handleFieldChange('externalUrl', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            )}

            {item.type === 'D' && (
              <div className="space-y-2">
                <Label>ID Query Builder</Label>
                <Input
                  value={item.queryBuilderId || ''}
                  onChange={(e) => handleFieldChange('queryBuilderId', e.target.value)}
                  placeholder="UUID de la vue Query Builder"
                />
              </div>
            )}

            {/* Gestion des droits d'accès */}
            <MenuItemRightsEditor
              item={item}
              availableGroups={availableGroups}
              availableRoles={availableRoles}
              availablePermissions={availablePermissions}
              parentItem={parentItem}
              onUpdate={onUpdate}
              className="mt-4"
            />

            {/* Gestion des enfants pour les dossiers */}
            {currentType?.canHaveChildren && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Éléments enfants ({item.children.length})</Label>
                  <Button size="sm" onClick={addChildItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un enfant
                  </Button>
                </div>

                {item.children.length > 0 && (
                  <div className="space-y-2">
                    {item.children.map((child, childIndex) => (
                      <MenuItemEditor
                        key={child.id || `child-${childIndex}`}
                        item={child}
                        index={childIndex}
                        menuTypes={menuTypes}
                        level={level + 1}
                        onUpdate={(updatedChild) => updateChildItem(childIndex, updatedChild)}
                        onDelete={() => deleteChildItem(childIndex)}
                        onMoveUp={
                          childIndex > 0 ? () => moveChildItem(childIndex, 'up') : undefined
                        }
                        onMoveDown={
                          childIndex < item.children.length - 1
                            ? () => moveChildItem(childIndex, 'down')
                            : undefined
                        }
                        parentItem={item}
                        availableGroups={availableGroups}
                        availableRoles={availableRoles}
                        availablePermissions={availablePermissions}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
