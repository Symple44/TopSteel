'use client'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  useFormFieldIds,
} from '@erp/ui'
import { Edit, Eye, Lock, Plus, Settings, Shield, Trash2, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { GroupManagementPanel } from '../../components/admin/group-management-panel'
import { PermissionHide } from '../../components/auth/permission-guard'
import { useTranslation } from '../../lib/i18n/hooks'
import {
  ACCESS_LEVEL_COLORS,
  ACCESS_LEVEL_LABELS,
  type AccessLevel,
  MODULE_CATEGORY_COLORS,
  MODULE_CATEGORY_LABELS,
  type Module,
  type Role,
} from '../../types/permissions'
import { callClientApi } from '../../utils/backend-api'

interface RoleWithStats extends Role {
  userCount?: number
  moduleCount?: number
  permissionCount?: number
}

export function RoleManagementPanel() {
  const { t } = useTranslation('admin')
  const [roles, setRoles] = useState<RoleWithStats[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [selectedRole, setSelectedRole] = useState<RoleWithStats | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('roles')
  const [loading, setLoading] = useState(true)

  const loadRoles = useCallback(async () => {
    try {
      const response = await callClientApi('admin/roles')
      const data = await response?.json()
      if (data?.success) {
        // Ajouter des statistiques mockées
        const rolesWithStats = data?.data?.map((role: Role) => ({
          ...role,
          userCount: Math.floor(Math.random() * 20) + 1,
          moduleCount: Math.floor(Math.random() * 10) + 3,
          permissionCount: Math.floor(Math.random() * 30) + 10,
        }))
        setRoles(rolesWithStats)
      }
    } catch (_error) {
    } finally {
      setLoading(false)
    }
  }, [])

  const loadModules = useCallback(async () => {
    try {
      const response = await callClientApi('admin/modules?includePermissions=true')
      const data = await response?.json()
      if (data?.success) {
        setModules(data?.data)
      }
    } catch (_error) {}
  }, [])

  // Charger les données initiales
  useEffect(() => {
    loadRoles()
    loadModules()
  }, [loadModules, loadRoles])

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm(t('roles.deleteConfirm'))) {
      return
    }

    try {
      const response = await callClientApi(`admin/roles?id=${roleId}`, {
        method: 'DELETE',
      })

      if (response?.ok) {
        loadRoles()
      }
    } catch (_error) {}
  }

  const openPermissionDialog = (role: RoleWithStats) => {
    setSelectedRole(role)
    setIsPermissionDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="mt-4 text-gray-600">{t('roles.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{t('roles.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('roles.description')}
          </p>
        </div>
        <PermissionHide permission={undefined} roles={['SUPER_ADMIN', 'ADMIN']}>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('roles.newRole')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t('roles.createRole')}</DialogTitle>
              </DialogHeader>
              <RoleForm
                onSave={() => {
                  setIsCreateDialogOpen(false)
                  loadRoles()
                }}
              />
            </DialogContent>
          </Dialog>
        </PermissionHide>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="roles">{t('roles.tabs.roles')} ({roles.length})</TabsTrigger>
          <TabsTrigger value="groups">{t('roles.tabs.groups')}</TabsTrigger>
          <TabsTrigger value="modules">{t('roles.tabs.modules')} ({modules.length})</TabsTrigger>
          <TabsTrigger value="permissions">{t('roles.tabs.permissions')}</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid gap-4">
            {roles?.map((role) => (
              <Card key={role.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Shield className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-lg">{role.name}</h3>
                          {role.isSystemRole && (
                            <Badge variant="outline" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              {t('roles.system')}
                            </Badge>
                          )}
                          <Badge variant={role.isActive ? 'default' : 'secondary'}>
                            {role.isActive ? t('roles.active') : t('roles.inactive')}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-3">{role.description}</p>
                        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{role.userCount} {t('roles.users')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Settings className="h-4 w-4" />
                            <span>{role.moduleCount} {t('roles.modules')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="h-4 w-4" />
                            <span>{role.permissionCount} {t('roles.permissions')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPermissionDialog(role)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        {t('roles.permissionsButton')}
                      </Button>
                      <PermissionHide permission={undefined} roles={['SUPER_ADMIN', 'ADMIN']}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRole(role)
                            setIsEditDialogOpen(true)
                          }}
                          disabled={role.isSystemRole}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </PermissionHide>
                      <PermissionHide permission={undefined} roles={['SUPER_ADMIN']}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRole(role.id)}
                          disabled={role.isSystemRole}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </PermissionHide>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <GroupsView />
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <ModulesView modules={modules} />
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <PermissionsView />
        </TabsContent>
      </Tabs>

      {/* Dialog d'édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('roles.editRole')}: {selectedRole?.name}</DialogTitle>
          </DialogHeader>
          <RoleForm
            role={selectedRole}
            onSave={() => {
              setIsEditDialogOpen(false)
              loadRoles()
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de permissions */}
      <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('roles.permissionsFor')}: {selectedRole?.name}</DialogTitle>
          </DialogHeader>
          <PermissionEditor
            role={selectedRole}
            modules={modules}
            onSave={() => {
              setIsPermissionDialogOpen(false)
              loadRoles()
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Composant pour créer/éditer un rôle
function RoleForm({ role, onSave }: { role?: RoleWithStats | null; onSave: () => void }) {
  const { t } = useTranslation('admin')
  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
    isActive: role?.isActive ?? true,
  })

  // Generate unique IDs for form fields
  const fieldIds = useFormFieldIds(['name', 'description', 'isActive'])

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault()

    try {
      const method = role ? 'PUT' : 'POST'
      const body = role ? { id: role.id, ...formData } : formData

      const response = await callClientApi('admin/roles', {
        method,
        body: JSON.stringify(body),
      })

      if (response?.ok) {
        onSave()
      }
    } catch (_error) {}
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor={fieldIds.name}>{t('roles.form.name')}</Label>
        <Input
          id={fieldIds.name}
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, name: e?.target?.value }))
          }
          placeholder={t('roles.form.namePlaceholder')}
          required
        />
      </div>

      <div>
        <Label htmlFor={fieldIds.description}>{t('roles.form.description')}</Label>
        <Textarea
          id={fieldIds.description}
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev) => ({ ...prev, description: e?.target?.value }))
          }
          placeholder={t('roles.form.descriptionPlaceholder')}
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id={fieldIds.isActive}
          checked={formData.isActive}
          onCheckedChange={(checked: boolean) =>
            setFormData((prev) => ({ ...prev, isActive: checked }))
          }
        />
        <Label htmlFor={fieldIds.isActive}>{t('roles.form.isActive')}</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onSave}>
          {t('common.cancel')}
        </Button>
        <Button type="submit">{role ? t('common.save') : t('common.create')}</Button>
      </div>
    </form>
  )
}

// Composant pour afficher les modules
function ModulesView({ modules }: { modules: Module[] }) {
  const groupedModules = modules?.reduce(
    (acc, module) => {
      if (!acc[module.category]) acc[module.category] = []
      acc?.[module.category]?.push(module)
      return acc
    },
    {} as Record<string, Module[]>
  )

  return (
    <div className="space-y-6">
      {Object.entries(groupedModules).map(([category, categoryModules]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Badge
                className={MODULE_CATEGORY_COLORS[category as keyof typeof MODULE_CATEGORY_COLORS]}
              >
                {MODULE_CATEGORY_LABELS[category as keyof typeof MODULE_CATEGORY_LABELS]}
              </Badge>
              <span>({categoryModules.length} modules)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categoryModules?.map((module) => (
                <Card key={module.id} className="border-2 border-dashed">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-gray-100 rounded">
                        <Settings className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{module.name}</h4>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Composant pour afficher les permissions
function PermissionsView() {
  const { t } = useTranslation('admin')
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('roles.accessLevels.title')}</CardTitle>
        <CardDescription>
          {t('roles.accessLevels.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(ACCESS_LEVEL_LABELS).map(([level, label]) => (
            <div key={level} className="flex items-center space-x-3">
              <Badge className={ACCESS_LEVEL_COLORS[level as AccessLevel]}>{label}</Badge>
              <span className="text-sm text-muted-foreground">
                {t(`roles.accessLevels.${level.toLowerCase()}`)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Composant pour éditer les permissions d'un rôle
function PermissionEditor({
  role,
  modules,
  onSave,
}: {
  role: RoleWithStats | null
  modules: Module[]
  onSave: () => void
}) {
  const { t } = useTranslation('admin')
  const [permissions, setPermissions] = useState<
    {
      id: string
      permissionId: string
      name: string
      description: string
      moduleId: string
      accessLevel: AccessLevel
      isGranted: boolean
    }[]
  >([])
  const [loading, setLoading] = useState(true)

  const loadPermissions = useCallback(async () => {
    if (!role) return

    try {
      const response = await callClientApi(`admin/roles/${role.id}/permissions`)
      const data = await response?.json()
      if (data?.success) {
        setPermissions(data?.data?.rolePermissions)
      }
    } catch (_error) {
    } finally {
      setLoading(false)
    }
  }, [role])

  useEffect(() => {
    if (role) {
      loadPermissions()
    }
  }, [role, loadPermissions])

  const updatePermission = (permissionId: string, accessLevel: AccessLevel, isGranted: boolean) => {
    setPermissions((prev) =>
      prev?.map((p) =>
        (p.permissionId || p.id) === permissionId ? { ...p, accessLevel, isGranted } : p
      )
    )
  }

  const handleSave = async () => {
    if (!role) return

    try {
      const response = await callClientApi(`admin/roles/${role.id}/permissions`, {
        method: 'POST',
        body: JSON.stringify({ permissions }),
      })

      if (response?.ok) {
        onSave()
      }
    } catch (_error) {}
  }

  if (loading) {
    return <div className="text-center py-8">{t('roles.permissionEditor.loading')}</div>
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        {t('roles.permissionEditor.configure')} <strong>{role?.name}</strong>
      </div>

      <div className="space-y-6">
        {modules?.map((module) => {
          const modulePermissions = permissions?.filter((p) => p.moduleId === module.id)

          return (
            <Card key={module.id}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Badge className={MODULE_CATEGORY_COLORS[module.category]}>
                    {MODULE_CATEGORY_LABELS[module.category]}
                  </Badge>
                  <span>{module.name}</span>
                </CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('roles.permissionEditor.permission')}</TableHead>
                      <TableHead>{t('roles.permissionEditor.accessLevel')}</TableHead>
                      <TableHead>{t('roles.permissionEditor.authorized')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modulePermissions?.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell>{permission.permissionId || permission.name}</TableCell>
                        <TableCell>
                          <select
                            value={permission.accessLevel}
                            onChange={(e) =>
                              updatePermission(
                                permission.permissionId || permission.id,
                                e?.target?.value as AccessLevel,
                                permission.isGranted
                              )
                            }
                            className="border rounded px-2 py-1"
                          >
                            {Object.entries(ACCESS_LEVEL_LABELS).map(([level, label]) => (
                              <option key={level} value={level}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={permission.isGranted}
                            onCheckedChange={(checked: boolean) =>
                              updatePermission(
                                permission.permissionId || permission.id,
                                permission.accessLevel,
                                checked
                              )
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onSave}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSave}>{t('common.save')}</Button>
      </div>
    </div>
  )
}

// Composant pour afficher les groupes
function GroupsView() {
  return <GroupManagementPanel />
}
