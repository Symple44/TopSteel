'use client'

import type { ColumnConfig } from '@erp/ui'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Checkbox,
  DataTable,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
import {
  Building,
  Edit,
  FolderOpen,
  Plus,
  Settings,
  Shield,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  UsersIcon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PermissionHide } from '../../components/auth/permission-guard'
import { useTranslation } from '../../lib/i18n/hooks'
import { callClientApi } from '../../utils/backend-api'
import { BulkUserAssignment } from './bulk-user-assignment'

interface Group extends Record<string, unknown> {
  id: string
  name: string
  description: string
  type: 'DEPARTMENT' | 'TEAM' | 'PROJECT' | 'CUSTOM'
  isActive: boolean
  userCount: number
  createdAt: string
  updatedAt: string
}

interface GroupUser {
  id: string
  userId: string
  email: string
  firstName: string
  lastName: string
  assignedAt: string
  assignedBy: string
  expiresAt?: string
}

interface Role {
  id: string
  name: string
  description: string
}

const GROUP_TYPE_ICONS = {
  DEPARTMENT: Building,
  TEAM: Users,
  PROJECT: FolderOpen,
  CUSTOM: Settings,
}

const GROUP_TYPE_COLORS = {
  DEPARTMENT: 'bg-info/20 text-info',
  TEAM: 'bg-success/20 text-success',
  PROJECT: 'bg-primary/20 text-primary',
  CUSTOM: 'bg-gray-100 text-gray-800',
}

const formatDate = (date: string | Date) => {
  const d = new Date(date)
  return d?.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const getColumns = (
  t: (key: string) => string,
  onEdit: (group: Group) => void,
  onDelete: (group: Group) => void,
  onViewDetails: (group: Group) => void,
  onBulkAssignment: (group: Group) => void
): ColumnConfig<Group>[] => [
  {
    id: 'name',
    key: 'name',
    title: t('groups.columns.name'),
    type: 'text',
    sortable: true,
    searchable: true,
    locked: true,
    width: 280,
    getValue: (row) => `${row.name} ${row.description}`,
    render: (_value: unknown, row: Group) => {
      const Icon = GROUP_TYPE_ICONS[row.type] || Settings
      return (
        <div className="flex items-center space-x-3">
          <div
            className={`p-2 rounded-lg ${GROUP_TYPE_COLORS?.[row.type]?.replace('text-', 'bg-').replace('-800', '-100') || 'bg-gray-100'}`}
          >
            <Icon
              className={`h-5 w-5 ${GROUP_TYPE_COLORS?.[row.type]?.replace('bg-', 'text-').replace('-100', '-600') || 'text-gray-600'}`}
            />
          </div>
          <div>
            <p className="font-semibold text-foreground">{row.name}</p>
            <p className="text-sm text-muted-foreground line-clamp-1">{row.description}</p>
          </div>
        </div>
      )
    },
  },
  {
    id: 'type',
    key: 'type',
    title: t('groups.columns.type'),
    type: 'select',
    sortable: true,
    width: 140,
    options: [
      { value: 'DEPARTMENT', label: t('groups.types.DEPARTMENT'), color: '#3b82f6' },
      { value: 'TEAM', label: t('groups.types.TEAM'), color: '#10b981' },
      { value: 'PROJECT', label: t('groups.types.PROJECT'), color: '#8b5cf6' },
      { value: 'CUSTOM', label: t('groups.types.CUSTOM'), color: '#6b7280' },
    ],
    render: (value: unknown, row: Group) => (
      <Badge className={GROUP_TYPE_COLORS[row.type] || 'bg-gray-100 text-gray-800'}>
        {t(`groups.types.${value}`) || (value as string)}
      </Badge>
    ),
  },
  {
    id: 'isActive',
    key: 'isActive',
    title: t('groups.columns.status'),
    type: 'select',
    sortable: true,
    width: 100,
    options: [
      { value: true, label: t('groups.active'), color: '#10b981' },
      { value: false, label: t('groups.inactive'), color: '#6b7280' },
    ],
    render: (value: unknown) => (
      <Badge variant={value ? 'default' : 'secondary'}>
        {value ? t('groups.active') : t('groups.inactive')}
      </Badge>
    ),
  },
  {
    id: 'userCount',
    key: 'userCount',
    title: t('groups.columns.members'),
    type: 'number',
    sortable: true,
    width: 120,
    render: (value: unknown) => (
      <div className="flex items-center space-x-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{value as number}</span>
      </div>
    ),
  },
  {
    id: 'createdAt',
    key: 'createdAt',
    title: t('groups.columns.createdAt'),
    type: 'datetime',
    sortable: true,
    width: 140,
    render: (value: unknown) => (
      <span className="text-muted-foreground">{formatDate(value as string)}</span>
    ),
  },
  {
    id: 'actions',
    key: 'id',
    title: '',
    type: 'custom',
    width: 160,
    render: (_value: unknown, row: Group) => (
      <div className="flex items-center space-x-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onViewDetails(row)
          }}
          title={t('groups.details')}
        >
          {t('groups.details')}
        </Button>
        <PermissionHide permission={undefined} roles={['SUPER_ADMIN', 'ADMIN']}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onBulkAssignment(row)
            }}
            title={t('groups.bulkAssignmentTooltip')}
          >
            <UsersIcon className="h-4 w-4" />
          </Button>
        </PermissionHide>
        <PermissionHide permission={undefined} roles={['SUPER_ADMIN', 'ADMIN']}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(row)
            }}
            title={t('groups.edit')}
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
            title={t('groups.delete')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </PermissionHide>
      </div>
    ),
  },
]

interface GroupsDataTableProps {
  hideHeader?: boolean
}

export function GroupsDataTable({ hideHeader = false }: GroupsDataTableProps) {
  const { t } = useTranslation('admin')
  const [groups, setGroups] = useState<Group[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [groupUsers, setGroupUsers] = useState<GroupUser[]>([])
  const [groupRoles, setGroupRoles] = useState<Role[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBulkAssignmentOpen, setIsBulkAssignmentOpen] = useState(false)
  const [bulkAssignmentGroup, setBulkAssignmentGroup] = useState<Group | undefined>(undefined)

  const handleEdit = useCallback((group: Group) => {
    setSelectedGroup(group)
    setIsEditDialogOpen(true)
  }, [])

  const handleDelete = useCallback(async (group: Group) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) {
      return
    }

    try {
      const response = await callClientApi(`admin/groups/${group.id}`, {
        method: 'DELETE',
      })

      if (response?.ok) {
        loadGroups()
      }
    } catch (_error) {}
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleViewDetails = useCallback(async (group: Group) => {
    setSelectedGroup(group)
    setIsDetailDialogOpen(true)
    await loadGroupDetails(group.id)
  }, [])

  const handleBulkAssignment = useCallback((group: Group) => {
    setBulkAssignmentGroup(group)
    setIsBulkAssignmentOpen(true)
  }, [])

  // Create columns with translation and callbacks
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const columns = useMemo(
    () => getColumns(t, handleEdit, handleDelete, handleViewDetails, handleBulkAssignment),
    [handleEdit, handleDelete, handleViewDetails, handleBulkAssignment] // Retirer t pour éviter la boucle infinie
  )

  // Persistance des préférences de la DataTable
  const { settings, setSettings } = usePersistedTableSettings('admin-groups', columns)

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await callClientApi('admin/groups')
      const data = await response?.json()
      if (data?.success) {
        setGroups(data?.data)
      }
    } catch (_error) {
      setError('Erreur lors du chargement des groupes')
    } finally {
      setLoading(false)
    }
  }, []) // Retirer t des dépendances pour éviter la boucle infinie

  const loadRoles = useCallback(async () => {
    try {
      const response = await callClientApi('admin/roles')
      const data = await response?.json()
      if (data?.success) {
        setRoles(data?.data)
      }
    } catch (_error) {}
  }, [])

  useEffect(() => {
    loadGroups()
    loadRoles()
  }, [loadGroups, loadRoles])

  const loadGroupDetails = async (groupId: string) => {
    try {
      // Charger les utilisateurs du groupe
      const usersResponse = await callClientApi(`admin/groups/${groupId}/users`)
      const usersData = await usersResponse?.json()
      if (usersData?.success) {
        setGroupUsers(usersData?.data)
      }

      // Note: Group roles feature has been removed in schema simplification
      // Groups no longer have direct role assignments
      setGroupRoles([])
    } catch (_error) {}
  }

  const openBulkAssignment = (group?: Group) => {
    setBulkAssignmentGroup(group || undefined)
    setIsBulkAssignmentOpen(true)
  }

  // Stats by type
  const statsByType = useMemo(() => {
    return {
      DEPARTMENT: groups?.filter((g) => g.type === 'DEPARTMENT').length ?? 0,
      TEAM: groups?.filter((g) => g.type === 'TEAM').length ?? 0,
      PROJECT: groups?.filter((g) => g.type === 'PROJECT').length ?? 0,
      CUSTOM: groups?.filter((g) => g.type === 'CUSTOM').length ?? 0,
    }
  }, [groups])

  const totalMembers = useMemo(() => groups?.reduce((sum, g) => sum + g.userCount, 0), [groups])
  const activeGroups = useMemo(() => groups?.filter((g) => g.isActive).length, [groups])

  return (
    <div className="space-y-4">
      {/* Header */}
      {!hideHeader && (
        <PageHeader
          title={t('groups.title')}
          description={t('groups.description')}
          icon={Building}
          iconBackground="bg-gradient-to-br from-purple-500 to-pink-600"
          spacing="sm"
          actions={
            <div className="flex gap-2">
              <PermissionHide permission={undefined} roles={['SUPER_ADMIN', 'ADMIN']}>
                <Button variant="ghost" size="sm" onClick={() => openBulkAssignment()}>
                  <UsersIcon className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">{t('groups.bulkAssignment')}</span>
                </Button>
              </PermissionHide>
              <PermissionHide permission={undefined} roles={['SUPER_ADMIN', 'ADMIN']}>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4" />
                      <span className="ml-2">{t('groups.newGroup')}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{t('groups.createGroup')}</DialogTitle>
                    </DialogHeader>
                    <GroupForm
                      roles={roles}
                      onSave={() => {
                        setIsCreateDialogOpen(false)
                        loadGroups()
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </PermissionHide>
            </div>
          }
        />
      )}

      {/* Statistiques compactes en ligne */}
      <div className="flex items-center gap-6 py-2 px-1 text-sm border-b border-border/50">
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{t('groups.stats.total')}:</span>
          <span className="font-semibold text-foreground">{groups.length}</span>
          <span className="text-muted-foreground">({activeGroups} {t('groups.stats.active')})</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" />
          <span className="text-muted-foreground">{t('groups.stats.members')}:</span>
          <span className="font-semibold text-blue-600">{totalMembers}</span>
        </div>
        <div className="flex items-center gap-4 ml-4 pl-4 border-l border-border/50">
          {(['DEPARTMENT', 'TEAM', 'PROJECT', 'CUSTOM'] as const).map((type) => {
            const Icon = GROUP_TYPE_ICONS[type]
            return (
              <div key={type} className="flex items-center gap-1.5" title={t(`groups.types.${type}`)}>
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium text-foreground">{statsByType[type]}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        data={groups}
        columns={columns}
        keyField="id"
        tableId="admin-groups"
        selectable
        sortable
        searchable
        filterable
        exportable
        height={600}
        loading={loading}
        error={error}
        className="border rounded-lg"
        settings={settings}
        onSettingsChange={setSettings}
        onRowDoubleClick={(row) => handleViewDetails(row)}
      />

      {/* Dialog d'édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('groups.editGroup')}: {selectedGroup?.name}</DialogTitle>
          </DialogHeader>
          <GroupForm
            group={selectedGroup}
            roles={roles}
            onSave={() => {
              setIsEditDialogOpen(false)
              loadGroups()
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de détails */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('groups.detailsTitle')}: {selectedGroup?.name}</DialogTitle>
          </DialogHeader>
          <GroupDetails
            group={selectedGroup}
            users={groupUsers}
            roles={groupRoles}
            allRoles={roles}
            onRefresh={() => selectedGroup && loadGroupDetails(selectedGroup.id)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog d'assignation en masse */}
      <BulkUserAssignment
        isOpen={isBulkAssignmentOpen}
        onClose={() => setIsBulkAssignmentOpen(false)}
        targetGroup={bulkAssignmentGroup}
        onAssignmentComplete={() => {
          loadGroups()
          if (selectedGroup) {
            loadGroupDetails(selectedGroup.id)
          }
        }}
      />
    </div>
  )
}

// Composant pour créer/éditer un groupe
function GroupForm({
  group,
  roles,
  onSave,
}: {
  group?: Group | null
  roles: Role[]
  onSave: () => void
}) {
  const { t } = useTranslation('admin')
  const [formData, setFormData] = useState({
    name: group?.name || '',
    description: group?.description || '',
    type: group?.type || ('TEAM' as 'DEPARTMENT' | 'TEAM' | 'PROJECT' | 'CUSTOM'),
    isActive: group?.isActive ?? true,
    roleIds: [] as string[],
  })

  const fieldIds = useFormFieldIds(['name', 'description', 'type', 'isActive'])

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault()

    try {
      const url = group ? `admin/groups/${group.id}` : 'admin/groups'

      const response = await callClientApi(url, {
        method: group ? 'PUT' : 'POST',
        body: JSON.stringify(formData),
      })

      if (response?.ok) {
        onSave()
      }
    } catch (_error) {}
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor={fieldIds.name}>{t('groups.form.name')}</Label>
        <Input
          id={fieldIds.name}
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, name: e?.target?.value }))
          }
          placeholder={t('groups.form.namePlaceholder')}
          required
        />
      </div>

      <div>
        <Label htmlFor={fieldIds.description}>{t('groups.form.description')}</Label>
        <Textarea
          id={fieldIds.description}
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev) => ({ ...prev, description: e?.target?.value }))
          }
          placeholder={t('groups.form.descriptionPlaceholder')}
          required
        />
      </div>

      <div>
        <Label htmlFor={fieldIds.type}>{t('groups.form.type')}</Label>
        <Select
          value={formData.type}
          onValueChange={(value: string) =>
            setFormData((prev) => ({ ...prev, type: value as typeof formData.type }))
          }
        >
          <SelectTrigger id={fieldIds.type}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(['DEPARTMENT', 'TEAM', 'PROJECT', 'CUSTOM'] as const).map((type) => (
              <SelectItem key={type} value={type}>
                {t(`groups.types.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!group && (
        <div>
          <Label>{t('groups.form.defaultRoles')}</Label>
          <p className="text-sm text-muted-foreground mb-2">
            {t('groups.form.defaultRolesDescription')}
          </p>
          <div className="space-y-2 border rounded-lg p-3 max-h-48 overflow-y-auto">
            {roles?.map((role) => (
              <div key={role.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`role-${role.id}`}
                  checked={formData?.roleIds?.includes(role.id)}
                  onCheckedChange={(checked: boolean) => {
                    if (checked) {
                      setFormData((prev) => ({ ...prev, roleIds: [...prev.roleIds, role.id] }))
                    } else {
                      setFormData((prev) => ({
                        ...prev,
                        roleIds: prev?.roleIds?.filter((id) => id !== role.id),
                      }))
                    }
                  }}
                />
                <Label htmlFor={`role-${role.id}`} className="flex-1 cursor-pointer">
                  <span className="font-medium">{role.name}</span>
                  <span className="text-sm text-muted-foreground ml-2">{role.description}</span>
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch
          id={fieldIds.isActive}
          checked={formData.isActive}
          onCheckedChange={(checked: boolean) =>
            setFormData((prev) => ({ ...prev, isActive: checked }))
          }
        />
        <Label htmlFor={fieldIds.isActive}>{t('groups.form.isActive')}</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onSave}>
          {t('common.cancel')}
        </Button>
        <Button type="submit">{group ? t('common.save') : t('common.create')}</Button>
      </div>
    </form>
  )
}

// Composant pour afficher les détails d'un groupe
function GroupDetails({
  group,
  users,
  roles,
  allRoles,
  onRefresh,
}: {
  group: Group | null
  users: GroupUser[]
  roles: Role[]
  allRoles: Role[]
  onRefresh: () => void
}) {
  const { t } = useTranslation('admin')
  const [selectedRoles, setSelectedRoles] = useState<string[]>(roles?.map((r) => r.id))
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)

  if (!group) return null

  const handleUpdateRoles = async () => {
    // Note: Group roles feature has been removed in schema simplification
    // This function is kept for UI compatibility but does nothing
    console.warn('Group roles management is no longer available after schema simplification')
  }

  const handleRemoveUser = async (userId: string) => {
    try {
      const response = await callClientApi(`admin/groups/${group.id}/users/${userId}`, {
        method: 'DELETE',
      })

      if (response?.ok) {
        onRefresh()
      }
    } catch (_error) {}
  }

  return (
    <div className="space-y-6">
      {/* Info card */}
      <div className="p-4 border rounded-lg">
        <h4 className="font-semibold mb-3">{t('groups.info.title')}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t('groups.info.type')}</p>
            <Badge className={GROUP_TYPE_COLORS[group.type] || 'bg-gray-100 text-gray-800'}>
              {group.type ? (t(`groups.types.${group.type}`) || group.type) : t('groups.types.CUSTOM')}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('groups.info.status')}</p>
            <Badge variant={group.isActive ? 'default' : 'secondary'}>
              {group.isActive ? t('groups.active') : t('groups.inactive')}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('groups.info.createdAt')}</p>
            <p>{formatDate(group.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('groups.info.updatedAt')}</p>
            <p>{formatDate(group.updatedAt)}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="members">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="members">{t('groups.tabs.members')} ({users.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">{t('groups.membersSection.title')}</h3>
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t('groups.membersSection.addMember')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('groups.membersSection.addMemberTitle')}</DialogTitle>
                </DialogHeader>
                {/* Formulaire d'ajout d'utilisateur */}
              </DialogContent>
            </Dialog>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('groups.membersSection.user')}</TableHead>
                  <TableHead>{t('groups.membersSection.addedAt')}</TableHead>
                  <TableHead>{t('groups.membersSection.addedBy')}</TableHead>
                  <TableHead>{t('groups.membersSection.expiresAt')}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {user.firstName?.[0]}
                            {user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(user.assignedAt)}</TableCell>
                    <TableCell>{user.assignedBy}</TableCell>
                    <TableCell>{user.expiresAt ? formatDate(user.expiresAt) : '-'}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUser(user.userId)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {t('groups.membersSection.noMembers')}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
