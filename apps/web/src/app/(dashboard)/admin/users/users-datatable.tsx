'use client'

import type { ColumnConfig } from '@erp/ui'
import { Avatar, AvatarFallback, Badge, Button, DataTable, PageHeader, usePersistedTableSettings } from '@erp/ui'
import {
  Building,
  Calendar,
  Download,
  Mail,
  Settings,
  Shield,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { BulkProfileManagement } from '../../../../components/admin/bulk-profile-management'
import { useTranslation } from '../../../../lib/i18n/hooks'
import type { User } from '../../../../types/auth'
import { callClientApi } from '../../../../utils/backend-api'

// We'll need to move this function inside the component to access translations
const formatDate = (date: string | Date | null | undefined, t: (key: string) => string) => {
  if (!date) return t('users.never')
  const d = new Date(date)
  if (Number.isNaN(d?.getTime())) return t('users.invalidDate')

  const now = new Date()
  const diff = now?.getTime() - d?.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return `${d?.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })} (${t('users.today')})`
  } else if (days === 1) {
    return (
      t('users.yesterday') +
      ' ' +
      d?.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    )
  } else if (days < 7) {
    return `${days} ${t('users.daysAgo')}`
  } else {
    return d?.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: d?.getFullYear() !== now?.getFullYear() ? 'numeric' : undefined,
    })
  }
}

const getColumns = (t: (key: string) => string): ColumnConfig<User>[] => [
  {
    id: 'user',
    key: 'firstName',
    title: t('users.user'),
    description: t('users.userInfo'),
    type: 'text',
    sortable: true,

    locked: true,
    width: 280,
    // Fonction pour extraire la valeur pour le filtrage/tri
    getValue: (row) => {
      const fullName =
        row.firstName || row.lastName
          ? `${row.firstName || ''} ${row.lastName || ''}`.trim()
          : t('users.user')
      return `${fullName} ${row.email}`
    },
    render: (_value: unknown, row: User, _column: ColumnConfig<User>) => (
      <div className="flex items-center space-x-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
            {(row.firstName?.[0] || '').toUpperCase()}
            {(row.lastName?.[0] || '').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-foreground">
            {row.firstName || row.lastName
              ? `${row.firstName || ''} ${row.lastName || ''}`.trim()
              : t('users.user')}
          </p>
          <p className="text-sm text-muted-foreground flex items-center">
            <Mail className="h-3 w-3 mr-1.5 text-muted-foreground" />
            {row.email}
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'roles',
    key: 'roles',
    title: t('users.roles'),
    description: t('users.rolesAssigned'),
    type: 'select',
    sortable: true,

    width: 200,
    // Options pour le filtrage
    options: [
      { value: 'SUPER_ADMIN', label: 'Super Admin', color: '#dc2626' },
      { value: 'ADMIN', label: 'Admin', color: '#ea580c' },
      { value: 'MANAGER', label: 'Manager', color: '#0ea5e9' },
      { value: 'COMMERCIAL', label: 'Commercial', color: '#10b981' },
      { value: 'TECHNICIEN', label: 'Technicien', color: '#8b5cf6' },
    ],
    // Fonction pour extraire la valeur string pour le filtrage
    getValue: (row) => {
      const roles = Array.isArray(row.roles) ? row.roles : []
      return roles?.map((role) => role.name).join(', ')
    },
    render: (_value: unknown, row: User, _column: ColumnConfig<User>) => {
      const roles = Array.isArray(row.roles) ? row.roles : []
      return (
        <div className="flex flex-wrap gap-1.5">
          {roles?.map((role) => (
            <Badge
              key={role.id}
              variant="outline"
              className="text-xs flex items-center font-medium"
            >
              <Shield className="h-3 w-3 mr-1" />
              {role.name}
            </Badge>
          ))}
          {roles?.length === 0 && (
            <span className="text-sm text-muted-foreground">{t('users.noRoles')}</span>
          )}
        </div>
      )
    },
  },
  {
    id: 'groups',
    key: 'groups',
    title: t('users.groups'),
    description: t('users.groupsAssigned'),
    type: 'text',
    sortable: true,

    width: 200,
    // Fonction pour extraire la valeur string pour le filtrage
    getValue: (row) => {
      const groups = Array.isArray(row.groups) ? row.groups : []
      return groups?.map((group) => group.name).join(', ')
    },
    render: (_value: unknown, row: User, _column: ColumnConfig<User>) => {
      const groups = Array.isArray(row.groups) ? row.groups : []
      return (
        <div className="flex flex-wrap gap-1.5">
          {groups?.map((group) => (
            <Badge
              key={group.id}
              variant="secondary"
              className="text-xs flex items-center font-medium"
            >
              <Building className="h-3 w-3 mr-1" />
              {group.name}
            </Badge>
          ))}
          {groups?.length === 0 && (
            <span className="text-sm text-muted-foreground">{t('users.noGroups')}</span>
          )}
        </div>
      )
    },
  },
  {
    id: 'department',
    key: 'department',
    title: t('users.department'),
    type: 'text',
    sortable: true,

    editable: true,
    width: 150,
    render: (value: unknown, _row: User, _column: ColumnConfig<User>) => (
      <span className="text-foreground font-medium">
        {(value as React.ReactNode) || <span className="text-muted-foreground">-</span>}
      </span>
    ),
  },
  {
    id: 'lastLogin',
    key: 'lastLogin',
    title: t('users.lastLogin'),
    type: 'datetime',
    sortable: true,

    width: 180,
    format: {
      dateFormat: 'dd/MM/yyyy HH:mm',
    },
    render: (value: unknown, _row: User, _column: ColumnConfig<User>) => (
      <div className="flex items-center text-sm">
        <div className="flex items-center space-x-1.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className={value ? 'text-foreground font-medium' : 'text-muted-foreground'}>
            {formatDate(value as string | Date | null | undefined, t)}
          </span>
        </div>
      </div>
    ),
  },
  {
    id: 'isActive',
    key: 'isActive',
    title: t('users.status'),
    type: 'select',
    sortable: true,
    editable: true,
    width: 100,
    options: [
      { value: true, label: t('users.active'), color: '#10b981' },
      { value: false, label: t('users.inactive'), color: '#6b7280' },
    ],
    render: (value: unknown, _row: User, _column: ColumnConfig<User>) => (
      <Badge variant={value ? 'default' : 'secondary'}>
        {value ? t('users.active') : t('users.inactive')}
      </Badge>
    ),
  },
  {
    id: 'createdAt',
    key: 'createdAt',
    title: t('users.createdAt'),
    type: 'datetime',
    sortable: true,

    width: 150,
    format: {
      dateFormat: 'dd/MM/yyyy',
    },
    render: (value: unknown, _row: User, _column: ColumnConfig<User>) => (
      <span className="text-muted-foreground font-medium">
        {formatDate(value as string | Date | null | undefined, t)}
      </span>
    ),
  },
]

interface UsersDataTableProps {
  onUserEdit?: (user: User) => void
  onUserCreate?: () => void
  /** Masquer le header interne (si géré par le parent) */
  hideHeader?: boolean
  /** Callback pour exposer les actions au parent */
  onActionsReady?: (actions: React.ReactNode) => void
}

export function UsersDataTable({ onUserEdit, onUserCreate, hideHeader = false }: UsersDataTableProps) {
  const { t } = useTranslation('admin')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBulkManagementOpen, setIsBulkManagementOpen] = useState(false)

  // Create columns with translation support
  const columns = useMemo(() => getColumns(t), [t])

  // Persistance des préférences de la DataTable
  const { settings, setSettings } = usePersistedTableSettings('admin-users', columns)

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await callClientApi('admin/users?includePermissions=true', {
        method: 'GET',
      })
      const data = await response?.json()

      if (response?.ok && data?.success && data?.data) {
        setUsers(data?.data)
      } else {
        setError('Erreur lors du chargement des utilisateurs')
      }
    } catch (_error) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }, []) // Retirer t des dépendances pour éviter la boucle infinie

  // Charger les utilisateurs une seule fois au montage
  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Charger une seule fois au montage

  const handleCellEdit = (row: User, column: ColumnConfig<User>, value: unknown) => {
    setUsers((prevData) =>
      prevData?.map((user) => (user.id === row.id ? { ...user, [column.key]: value } : user))
    )
    // Here we could send the update to the server
  }

  const handleCreate = () => {
    if (onUserCreate) {
      onUserCreate()
    }
  }

  const handleEdit = (row: User) => {
    if (onUserEdit) {
      onUserEdit(row)
    }
  }

  const handleDelete = (rows: User[]) => {
    const idsToDelete = rows?.map((row) => row.id)
    setUsers(users?.filter((user) => !idsToDelete?.includes(user.id)))
    // Ici on pourrait envoyer la suppression au serveur
  }

  const exportUsers = () => {
    const headers = [
      t('users.exportHeaders.email'),
      t('users.exportHeaders.lastName'),
      t('users.exportHeaders.firstName'),
      t('users.exportHeaders.department'),
      t('users.exportHeaders.status'),
      t('users.exportHeaders.roles'),
      t('users.exportHeaders.groups'),
      t('users.exportHeaders.lastLogin'),
    ]
    const rows = users?.map((user) => [
      user.email,
      user.lastName || '',
      user.firstName || '',
      user.department || '',
      user.isActive ? t('users.active') : t('users.inactive'),
      user?.roles?.map((r) => r.name).join(', '),
      user?.groups?.map((g) => g.name).join(', '),
      formatDate(user.lastLogin, t),
    ])

    const csv = [headers, ...rows]
      .map((row) => row?.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL?.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-4">
      {/* Header avec PageHeader standard */}
      {!hideHeader && (
        <PageHeader
          title={t('users.userManagement')}
          description={t('users.userManagementDescription')}
          icon={Users}
          iconBackground="bg-gradient-to-br from-blue-600 to-cyan-600"
          spacing="sm"
          actions={
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={exportUsers}>
                <Download className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">{t('users.export')}</span>
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsBulkManagementOpen(true)}>
                <Settings className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">{t('users.bulkManagement')}</span>
              </Button>
              <Button type="button" size="sm" onClick={handleCreate}>
                <UserPlus className="h-4 w-4" />
                <span className="ml-2">{t('users.newUser')}</span>
              </Button>
            </div>
          }
        />
      )}

      {/* Statistiques compactes en ligne */}
      <div className="flex items-center gap-6 py-2 px-1 text-sm border-b border-border/50">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{t('users.totalUsers')}:</span>
          <span className="font-semibold text-foreground">{users.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-green-600" />
          <span className="text-muted-foreground">{t('users.activeUsers')}:</span>
          <span className="font-semibold text-green-600">{users?.filter((u) => u.isActive).length}</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{t('users.withRoles')}:</span>
          <span className="font-semibold text-foreground">{users?.filter((u) => u?.roles?.length && u.roles.length > 0).length}</span>
        </div>
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{t('users.withGroups')}:</span>
          <span className="font-semibold text-foreground">{users?.filter((u) => u?.groups?.length && u.groups.length > 0).length}</span>
        </div>
      </div>

      {/* DataTable avec persistance des préférences */}
      <DataTable
        data={users}
        columns={columns}
        keyField="id"
        tableId="admin-users"
        editable
        selectable
        sortable
        searchable
        filterable
        height={600}
        actions={[
          {
            label: t('users.actions.edit'),
            onClick: (row: User) => handleEdit(row),
          },
          {
            label: t('users.actions.delete'),
            onClick: (row: User) => handleDelete([row]),
            variant: 'destructive' as const,
          },
        ]}
        onCellEdit={handleCellEdit}
        onRowDoubleClick={handleEdit}
        loading={loading}
        error={error}
        className="border rounded-lg"
        settings={settings}
        onSettingsChange={setSettings}
      />

      {/* Dialog de gestion en masse */}
      <BulkProfileManagement
        isOpen={isBulkManagementOpen}
        onClose={() => setIsBulkManagementOpen(false)}
        onComplete={() => {
          loadUsers()
        }}
      />
    </div>
  )
}
