'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { apiClient } from '@/lib/api-client'
import { Save, X } from 'lucide-react'
import { MenuItemEditor } from './menu-item-editor'

interface MenuConfiguration {
  id?: string
  name: string
  description?: string
  isActive: boolean
  isSystem: boolean
  items: MenuItem[]
}

interface MenuItem {
  id?: string
  title: string
  type: 'M' | 'P' | 'L' | 'D'
  icon?: string
  orderIndex: number
  isVisible: boolean
  programId?: string
  externalUrl?: string
  queryBuilderId?: string
  children: MenuItem[]
}

interface MenuType {
  value: string
  label: string
  description: string
  icon: string
  canHaveChildren: boolean
  requiredFields: string[]
}

interface MenuConfigurationEditorProps {
  configuration?: MenuConfiguration
  menuTypes: MenuType[]
  onSave: (config: MenuConfiguration) => void
  onCancel: () => void
}

export function MenuConfigurationEditor({
  configuration,
  menuTypes,
  onSave,
  onCancel
}: MenuConfigurationEditorProps) {
  const [formData, setFormData] = useState({
    name: configuration?.name || '',
    description: configuration?.description || ''
  })
  const [menuItems, setMenuItems] = useState<MenuItem[]>(configuration?.items || [])
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const configData = {
        name: formData.name,
        description: formData.description,
        items: menuItems
      }

      if (configuration?.id) {
        // Mise à jour
        await apiClient.put(`/admin/menus/configurations/${configuration.id}`, configData)
      } else {
        // Création
        await apiClient.post('/admin/menus/configurations', configData)
      }

      onSave(configData as MenuConfiguration)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    } finally {
      setSaving(false)
    }
  }

  const addMenuItem = () => {
    const newItem: MenuItem = {
      title: 'Nouvel élément',
      type: 'P',
      icon: 'Play',
      orderIndex: menuItems.length,
      isVisible: true,
      children: []
    }
    setMenuItems([...menuItems, newItem])
  }

  const updateMenuItem = (index: number, item: MenuItem) => {
    const updatedItems = [...menuItems]
    updatedItems[index] = item
    setMenuItems(updatedItems)
  }

  const deleteMenuItem = (index: number) => {
    const updatedItems = menuItems.filter((_, i) => i !== index)
    setMenuItems(updatedItems)
  }

  const moveMenuItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= menuItems.length) return

    const updatedItems = [...menuItems]
    const temp = updatedItems[index]
    updatedItems[index] = updatedItems[newIndex]
    updatedItems[newIndex] = temp

    // Mettre à jour les orderIndex
    updatedItems.forEach((item, i) => {
      item.orderIndex = i
    })

    setMenuItems(updatedItems)
  }

  return (
    <div className=\"space-y-6\">
      <Card>
        <CardHeader>
          <CardTitle>
            {configuration ? 'Modifier la Configuration' : 'Nouvelle Configuration'}
          </CardTitle>
        </CardHeader>
        <CardContent className=\"space-y-4\">
          <div className=\"grid grid-cols-2 gap-4\">
            <div className=\"space-y-2\">
              <Label htmlFor=\"name\">Nom de la configuration</Label>
              <Input
                id=\"name\"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder=\"Nom de la configuration\"
              />
            </div>
            <div className=\"space-y-2\">
              <Label htmlFor=\"description\">Description</Label>
              <Textarea
                id=\"description\"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder=\"Description optionnelle\"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className=\"flex justify-between items-center\">
            <CardTitle>Éléments du Menu</CardTitle>
            <Button onClick={addMenuItem} size=\"sm\">
              Ajouter un élément
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {menuItems.length === 0 ? (
            <div className=\"text-center py-8 text-muted-foreground\">
              <p>Aucun élément de menu configuré</p>
              <p className=\"text-sm\">Cliquez sur \"Ajouter un élément\" pour commencer</p>
            </div>
          ) : (
            <div className=\"space-y-4\">
              {menuItems.map((item, index) => (
                <MenuItemEditor
                  key={index}
                  item={item}
                  index={index}
                  menuTypes={menuTypes}
                  onUpdate={(updatedItem) => updateMenuItem(index, updatedItem)}
                  onDelete={() => deleteMenuItem(index)}
                  onMoveUp={index > 0 ? () => moveMenuItem(index, 'up') : undefined}
                  onMoveDown={index < menuItems.length - 1 ? () => moveMenuItem(index, 'down') : undefined}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className=\"flex justify-end gap-2\">
        <Button variant=\"outline\" onClick={onCancel}>
          <X className=\"h-4 w-4 mr-2\" />
          Annuler
        </Button>
        <Button onClick={handleSave} disabled={saving || !formData.name}>
          <Save className=\"h-4 w-4 mr-2\" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>
    </div>
  )
}