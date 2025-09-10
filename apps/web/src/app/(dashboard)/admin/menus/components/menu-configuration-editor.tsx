'use client'

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  useFormFieldIds,
} from '@erp/ui'
import { Save, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { postTyped, putTyped } from '@/lib/api-typed'
import { useTranslation } from '@/lib/i18n/hooks'
import type { Group, MenuConfiguration, MenuItem, Permission, Role } from '@/types/menu'
import { MenuItemEditor } from './menu-item-editor'

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
  onCancel,
}: MenuConfigurationEditorProps) {
  const { t } = useTranslation('admin')
  const [formData, setFormData] = useState({
    name: configuration?.name || '',
    description: configuration?.description || '',
  })
  const [menuItems, setMenuItems] = useState<MenuItem[]>(configuration?.items || [])
  const [saving, setSaving] = useState(false)

  // Generate unique IDs for form fields
  const fieldIds = useFormFieldIds(['name', 'description'])

  // États pour les données de droits
  const [availableGroups, setAvailableGroups] = useState<Group[]>([])
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([])
  const [rightsLoading, setRightsLoading] = useState(true)

  const loadRightsData = useCallback(async () => {
    setRightsLoading(true)
    try {
      const [groupsResponse, rolesResponse, permissionsResponse] = await Promise.all([
        apiClient?.get<{ data: Group[] }>('/admin/groups'),
        apiClient?.get<{ data: Role[] }>('/admin/roles'),
        apiClient?.get<{ data: Permission[] }>('/admin/permissions'),
      ])

      const groupsData = groupsResponse?.data ?? []
      const rolesData = rolesResponse?.data ?? []
      const permissionsData = permissionsResponse?.data ?? []

      setAvailableGroups(groupsData || [])
      setAvailableRoles(rolesData || [])
      setAvailablePermissions(permissionsData || [])
    } catch (_error) {
      // Utiliser des données par défaut en cas d'erreur
      setAvailableGroups([])
      setAvailableRoles([])
      setAvailablePermissions([])
    } finally {
      setRightsLoading(false)
    }
  }, [])

  // Charger les données de droits au montage
  useEffect(() => {
    loadRightsData()
  }, [loadRightsData])

  const handleSave = async () => {
    setSaving(true)
    try {
      const configData = {
        name: formData.name,
        description: formData.description,
        items: menuItems,
      }

      if (configuration?.id) {
        // Mise à jour
        await putTyped(`/admin/menus/configurations/${configuration.id}`, configData)
      } else {
        // Création
        await postTyped('/admin/menus/configurations', configData)
      }

      onSave(configData as MenuConfiguration)
    } catch (_error) {
    } finally {
      setSaving(false)
    }
  }

  const addMenuItem = () => {
    const newItem: MenuItem = {
      id: `menu-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: t('menuConfig?.editor?.newMenuItem'),
      type: 'P',
      icon: 'Play',
      orderIndex: menuItems.length,
      isVisible: true,
      children: [],
    }
    setMenuItems([...menuItems, newItem])
  }

  const updateMenuItem = (index: number, item: MenuItem) => {
    const updatedItems = [...menuItems]
    updatedItems[index] = item
    setMenuItems(updatedItems)
  }

  const deleteMenuItem = (index: number) => {
    const updatedItems = menuItems?.filter((_, i) => i !== index)
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
    updatedItems?.forEach((item, i) => {
      item.orderIndex = i
    })

    setMenuItems(updatedItems)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {configuration
              ? t('menuConfig?.editor?.editConfiguration')
              : t('menuConfig?.editor?.newConfiguration')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={fieldIds.name}>{t('menuConfig?.editor?.configurationName')}</Label>
              <Input
                id={fieldIds.name}
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, name: e?.target?.value })
                }
                placeholder={t('menuConfig?.editor?.configurationNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={fieldIds.description}>
                {t('menuConfig?.editor?.configurationDescription')}
              </Label>
              <Textarea
                id={fieldIds.description}
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, description: e?.target?.value })
                }
                placeholder={t('menuConfig?.editor?.configurationDescriptionPlaceholder')}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{t('menuConfig?.editor?.menuItems')}</CardTitle>
            <Button type="button" onClick={addMenuItem} size="sm">
              {t('menuConfig?.editor?.addMenuItem')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rightsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="text-muted-foreground mt-2">
                {t('menuConfig?.editor?.loadingRightsData')}
              </p>
            </div>
          ) : menuItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t('menuConfig?.editor?.noMenuItems')}</p>
              <p className="text-sm">{t('menuConfig?.editor?.addFirstMenuItem')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {menuItems?.map((item, index) => (
                <MenuItemEditor
                  key={item.id || `menu-item-${index}`}
                  item={item}
                  menuTypes={menuTypes}
                  onUpdate={(updatedItem) => updateMenuItem(index, updatedItem)}
                  onDelete={() => deleteMenuItem(index)}
                  onMoveUp={index > 0 ? () => moveMenuItem(index, 'up') : undefined}
                  onMoveDown={
                    index < menuItems.length - 1 ? () => moveMenuItem(index, 'down') : undefined
                  }
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
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          {t('menuConfig?.editor?.cancel')}
        </Button>
        <Button type="button" onClick={handleSave} disabled={saving || !formData.name}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? t('menuConfig?.editor?.saving') : t('menuConfig?.editor?.save')}
        </Button>
      </div>
    </div>
  )
}
