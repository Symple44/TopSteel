'use client'

import type { ColumnConfig } from '@erp/ui'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  PageHeader,
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
  usePersistedTableSettings,
} from '@erp/ui'
import { Edit, Eye, Lock, Plus, Settings, Shield, Trash2, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { GroupsDataTable } from './groups-datatable'
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

interface RoleWithStats extends Role, Record<string, unknown> {
  userCount?: number
  moduleCount?: number
  permissionCount?: number
}

const getColumns = (
  t: (key: string) => string,
  onEdit: (role: RoleWithStats) => void,
  onDelete: (role: RoleWithStats) => void,
  onPermissions: (role: RoleWithStats) => void
): ColumnConfig<RoleWithStats>[] => [
  {
    id: 'name',
    key: 'name',
    title: t('roles.columns.name'),
    type: 'text',
    sortable: true,
    searchable: true,
    locked: true,
    width: 280,
    getValue: (row) => `${row.name} ${row.description}`,
    render: (_value: unknown, row: RoleWithStats) => (
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Shield className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <p className="font-semibold text-foreground">{row.name}</p>
            {row.isSystemRole && (
              <Badge variant="outline" className="text-xs">
                <Lock className="h-3 w-3 mr-1" />
                {t('roles.system')}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">{row.description}</p>
        </div>
      </div>
    ),
  },
  {
    id: 'isActive',
    key: 'isActive',
    title: t('roles.columns.status'),
    type: 'select',
    sortable: true,
    width: 100,
    options: [
      { value: true, label: t('roles.active'), color: '#10b981' },
      { value: false, label: t('roles.inactive'), color: '#6b7280' },
    ],
    render: (value: unknown) => (
      <Badge variant={value ? 'default' : 'secondary'}>
        {value ? t('roles.active') : t('roles.inactive')}
      </Badge>
    ),
  },
  {
    id: 'userCount',
    key: 'userCount',
    title: t('roles.columns.users'),
    type: 'number',
    sortable: true,
    width: 100,
    render: (value: unknown) => (
      <div className="flex items-center space-x-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{value as number}</span>
      </div>
    ),
  },
  {
    id: 'moduleCount',
    key: 'moduleCount',
    title: t('roles.columns.modules'),
    type: 'number',
    sortable: true,
    width: 100,
    render: (value: unknown) => (
      <div className="flex items-center space-x-2">
        <Settings className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{value as number}</span>
      </div>
    ),
  },
  {
    id: 'permissionCount',
    key: 'permissionCount',
    title: t('roles.columns.permissions'),
    type: 'number',
    sortable: true,
    width: 120,
    render: (value: unknown) => (
      <div className="flex items-center space-x-2">
        <Eye className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{value as number}</span>
      </div>
    ),
  },
  {
    id: 'actions',
    key: 'id',
    title: '',
    type: 'custom',
    width: 180,
    render: (_value: unknown, row: RoleWithStats) => (
      <div className="flex items-center space-x-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onPermissions(row)
          }}
          title={t('roles.permissionsButton')}
        >
          <Settings className="h-4 w-4 mr-1" />
          {t('roles.permissionsButton')}
        </Button>
        <PermissionHide permission={undefined} roles={['SUPER_ADMIN', 'ADMIN']}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(row)
            }}
            disabled={row.isSystemRole}
            title={t('roles.edit')}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </PermissionHide>
        <PermissionHide permission={undefined} roles={['SUPER_ADMIN']}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(row)
            }}
            disabled={row.isSystemRole}
            title={t('roles.delete')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </PermissionHide>
      </div>
    ),
  },
]

interface RolesDataTableProps {
  hideHeader?: boolean
}

export function RolesDataTable({ hideHeader = false }: RolesDataTableProps) {
  const { t } = useTranslation('admin')
  const [roles, setRoles] = useState<RoleWithStats[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [selectedRole, setSelectedRole] = useState<RoleWithStats | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('roles')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleEdit = useCallback((role: RoleWithStats) => {
    setSelectedRole(role)
    setIsEditDialogOpen(true)
  }, [])

  const handleDelete = useCallback(async (role: RoleWithStats) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) {
      return
    }

    try {
      const response = await callClientApi(`admin/roles?id=${role.id}`, {
        method: 'DELETE',
      })

      if (response?.ok) {
        loadRoles()
      }
    } catch (_error) {}
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePermissions = useCallback((role: RoleWithStats) => {
    setSelectedRole(role)
    setIsPermissionDialogOpen(true)
  }, [])

  // Create columns with translation and callbacks
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const columns = useMemo(
    () => getColumns(t, handleEdit, handleDelete, handlePermissions),
    [handleEdit, handleDelete, handlePermissions] // Retirer t pour éviter la boucle infinie
  )

  // Persistance des préférences de la DataTable
  const { settings, setSettings } = usePersistedTableSettings('admin-roles', columns)

  const loadRoles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
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
      setError('Erreur lors du chargement des rôles')
    } finally {
      setLoading(false)
    }
  }, []) // Retirer t pour éviter la boucle infinie

  const loadModules = useCallback(async () => {
    try {
      const response = await callClientApi('admin/modules?includePermissions=true')
      const data = await response?.json()
      if (data?.success) {
        setModules(data?.data)
      }
    } catch (_error) {}
  }, [])

  useEffect(() => {
    loadRoles()
    loadModules()
  }, [loadModules, loadRoles])

  // Stats
  const activeRoles = useMemo(() => roles?.filter((r) => r.isActive).length, [roles])
  const systemRoles = useMemo(() => roles?.filter((r) => r.isSystemRole).length, [roles])
  const totalUsers = useMemo(() => roles?.reduce((sum, r) => sum + (r.userCount ?? 0), 0), [roles])

  return (
    <div className="space-y-4">
      {/* Header */}
      {!hideHeader && (
        <PageHeader
          title={t('roles.title')}
          description={t('roles.description')}
          icon={Shield}
          iconBackground="bg-gradient-to-br from-blue-500 to-indigo-600"
          spacing="sm"
          actions={
            <PermissionHide permission={undefined} roles={['SUPER_ADMIN', 'ADMIN']}>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                    <span className="ml-2">{t('roles.newRole')}</span>
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
          }
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="roles">{t('roles.tabs.roles')} ({roles.length})</TabsTrigger>
          <TabsTrigger value="groups">{t('roles.tabs.groups')}</TabsTrigger>
          <TabsTrigger value="modules">{t('roles.tabs.modules')} ({modules.length})</TabsTrigger>
          <TabsTrigger value="permissions">{t('roles.tabs.permissions')}</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          {/* Statistiques compactes en ligne */}
          <div className="flex items-center gap-6 py-2 px-1 text-sm border-b border-border/50">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t('roles.stats.total')}:</span>
              <span className="font-semibold text-foreground">{roles.length}</span>
              <span className="text-muted-foreground">({activeRoles} {t('roles.stats.active')})</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t('roles.stats.system')}:</span>
              <span className="font-semibold text-foreground">{systemRoles}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-muted-foreground">{t('roles.stats.users')}:</span>
              <span className="font-semibold text-blue-600">{totalUsers}</span>
            </div>
          </div>

          {/* DataTable */}
          <DataTable
            data={roles}
            columns={columns}
            keyField="id"
            tableId="admin-roles"
            selectable
            sortable
            searchable
            filterable
            exportable
            height={500}
            loading={loading}
            error={error}
            className="border rounded-lg"
            settings={settings}
            onSettingsChange={setSettings}
          />
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <GroupsDataTable hideHeader />
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
