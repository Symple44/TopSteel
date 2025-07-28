'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { apiClient } from '@/lib/api-client'
import { Save, X } from 'lucide-react'
import { MenuItemEditor } from './menu-item-editor'

interface Group {
  id: string
  name: string
  description: string
  type: 'DEPARTMENT' | 'TEAM' | 'PROJECT' | 'CUSTOM'
  isActive: boolean
}

interface Role {
  id: string
  name: string
  description: string
  isSystemRole: boolean
  isActive: boolean
}

interface Permission {
  id: string
  name: string
  description: string
  module: string
  action: string
}

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
  // Nouveaux champs pour les droits
  allowedGroups?: string[]
  requiredRoles?: string[]
  requiredPermissions?: string[]
  inheritFromParent?: boolean
  isPublic?: boolean
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
  const { t } = useTranslation('admin')
  const [formData, setFormData] = useState({
    name: configuration?.name || '',
    description: configuration?.description || ''
  })
  const [menuItems, setMenuItems] = useState<MenuItem[]>(configuration?.items || [])
  const [saving, setSaving] = useState(false)
  
  // États pour les données de droits
  const [availableGroups, setAvailableGroups] = useState<Group[]>([])
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([])
  const [rightsLoading, setRightsLoading] = useState(true)

  // Charger les données de droits au montage
  useEffect(() => {
    loadRightsData()
  }, [])

  const loadRightsData = async () => {
    setRightsLoading(true)
    try {
      const [groupsResponse, rolesResponse, permissionsResponse] = await Promise.all([
        apiClient.get('/admin/groups'),
        apiClient.get('/admin/roles'),
        apiClient.get('/admin/permissions')
      ])
      
      setAvailableGroups(groupsResponse.data?.data || [])
      setAvailableRoles(rolesResponse.data?.data || [])
      setAvailablePermissions(permissionsResponse.data?.data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des données de droits:', error)
      // Utiliser des données par défaut en cas d'erreur
      setAvailableGroups([])
      setAvailableRoles([])
      setAvailablePermissions([])
    } finally {
      setRightsLoading(false)
    }
  }

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
      title: t('menuConfig.editor.newMenuItem'),
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {configuration ? t('menuConfig.editor.editConfiguration') : t('menuConfig.editor.newConfiguration')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('menuConfig.editor.configurationName')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('menuConfig.editor.configurationNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('menuConfig.editor.configurationDescription')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('menuConfig.editor.configurationDescriptionPlaceholder')}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{t('menuConfig.editor.menuItems')}</CardTitle>
            <Button onClick={addMenuItem} size="sm">
              {t('menuConfig.editor.addMenuItem')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rightsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="text-muted-foreground mt-2">{t('menuConfig.editor.loadingRightsData')}</p>
            </div>
          ) : menuItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t('menuConfig.editor.noMenuItems')}</p>
              <p className="text-sm">{t('menuConfig.editor.addFirstMenuItem')}</p>
            </div>
          ) : (
            <div className="space-y-4">
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
                  availableGroups={availableGroups}
                  availableRoles={availableRoles}
                  availablePermissions={availablePermissions}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          {t('menuConfig.editor.cancel')}
        </Button>
        <Button onClick={handleSave} disabled={saving || !formData.name}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? t('menuConfig.editor.saving') : t('menuConfig.editor.save')}
        </Button>
      </div>
    </div>
  )
}