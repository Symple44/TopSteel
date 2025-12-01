'use client'

import type { ColumnConfig } from '@erp/ui'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Label,
  PageHeader,
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
  usePersistedTableSettings,
} from '@erp/ui'
import {
  Building,
  Database,
  Edit,
  Eye,
  MapPin,
  Plus,
  Shield,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../../lib/i18n/hooks'
import { callClientApi } from '../../utils/backend-api'

interface Societe extends Record<string, unknown> {
  id: string
  nom: string
  code: string
  status: 'ACTIVE' | 'INACTIVE'
  databaseName: string
  createdAt: string
  updatedAt: string
  userCount: number
  users?: SocieteUser[]
  sites: {
    id: string
    nom: string
    code: string
    isPrincipal: boolean
  }[]
}

interface SocieteUser {
  id: string
  email: string
  firstName: string
  lastName: string
  globalRole: {
    id: string
    displayName: string
    color: string
    icon: string
  }
  societeRole: {
    id: string
    displayName: string
    color: string
    icon: string
  } | null
  isDefault: boolean
  grantedAt: string
}

interface SocieteStats {
  societeId: string
  societeName: string
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  roleDistribution: {
    role: {
      id: string
      displayName: string
      color: string
    }
    count: number
  }[]
  sitesCount: number
}

const formatDate = (date: string | Date | null | undefined, t: (key: string) => string) => {
  if (!date) return t('societes.never')
  const d = new Date(date)
  if (Number.isNaN(d?.getTime())) return t('societes.invalidDate')
  return d?.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const getColumns = (
  t: (key: string) => string,
  onViewDetails: (societe: Societe) => void,
  onViewStats: (societe: Societe) => void,
  onEdit: (societe: Societe) => void
): ColumnConfig<Societe>[] => [
  {
    id: 'societe',
    key: 'nom',
    title: t('societes.columns.societe'),
    type: 'text',
    sortable: true,
    searchable: true,
    locked: true,
    width: 280,
    getValue: (row) => `${row.nom} ${row.code}`,
    render: (_value: unknown, row: Societe) => (
      <div className="flex items-center space-x-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
            {row?.nom?.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-foreground">{row.nom}</p>
          <p className="text-sm text-muted-foreground">
            {t('societes.createdOn')} {formatDate(row.createdAt, t)}
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'code',
    key: 'code',
    title: t('societes.columns.code'),
    type: 'text',
    sortable: true,
    searchable: true,
    width: 120,
    render: (value: unknown) => (
      <Badge variant="outline">{value as string}</Badge>
    ),
  },
  {
    id: 'status',
    key: 'status',
    title: t('societes.columns.status'),
    type: 'select',
    sortable: true,
    width: 120,
    options: [
      { value: 'ACTIVE', label: t('societes.active'), color: '#10b981' },
      { value: 'INACTIVE', label: t('societes.inactive'), color: '#6b7280' },
    ],
    render: (value: unknown) => (
      <Badge
        variant={value === 'ACTIVE' ? 'default' : 'secondary'}
        className={
          value === 'ACTIVE'
            ? 'bg-success/20 text-success'
            : 'bg-gray-100 text-gray-800'
        }
      >
        {value === 'ACTIVE' ? t('societes.active') : t('societes.inactive')}
      </Badge>
    ),
  },
  {
    id: 'userCount',
    key: 'userCount',
    title: t('societes.columns.users'),
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
    id: 'sites',
    key: 'sites',
    title: t('societes.columns.sites'),
    type: 'number',
    sortable: true,
    width: 100,
    getValue: (row) => row?.sites?.length ?? 0,
    render: (_value: unknown, row: Societe) => (
      <div className="flex items-center space-x-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{row?.sites?.length ?? 0}</span>
      </div>
    ),
  },
  {
    id: 'databaseName',
    key: 'databaseName',
    title: t('societes.columns.database'),
    type: 'text',
    sortable: true,
    searchable: true,
    width: 150,
    render: (value: unknown) => (
      <Badge variant="outline" className="font-mono text-xs">
        {value as string}
      </Badge>
    ),
  },
  {
    id: 'actions',
    key: 'id',
    title: '',
    type: 'custom',
    width: 120,
    render: (_value: unknown, row: Societe) => (
      <div className="flex items-center space-x-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onViewDetails(row)
          }}
          title={t('societes.viewDetails')}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onViewStats(row)
          }}
          title={t('societes.viewStats')}
        >
          <Shield className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(row)
          }}
          title={t('societes.edit')}
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
]

interface SocietesDataTableProps {
  onSocieteCreate?: () => void
  hideHeader?: boolean
}

export function SocietesDataTable({ onSocieteCreate, hideHeader = false }: SocietesDataTableProps) {
  const { t } = useTranslation('admin')
  const [societes, setSocietes] = useState<Societe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSociete, setSelectedSociete] = useState<Societe | null>(null)
  const [selectedSocieteStats, setSelectedSocieteStats] = useState<SocieteStats | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isStatsOpen, setIsStatsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Create columns with translation and callbacks
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const columns = useMemo(
    () =>
      getColumns(
        t,
        (societe) => loadSocieteDetails(societe.id),
        (societe) => loadSocieteStats(societe.id),
        (societe) => {
          setSelectedSociete(societe)
          // Could open edit dialog here
        }
      ),
    [] // Retirer t pour éviter la boucle infinie
  )

  // Persistance des préférences de la DataTable
  const { settings, setSettings } = usePersistedTableSettings('admin-societes', columns)

  const loadSocietes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await callClientApi('admin/societes?includeUsers=false', {
        method: 'GET',
      })

      if (!response?.ok) {
        throw new Error('Erreur lors du chargement des sociétés')
      }

      const data = await response?.json()
      if (data?.success && data?.data) {
        setSocietes(data?.data)
      } else {
        setError('Erreur lors du chargement des sociétés')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }, []) // Retirer t pour éviter la boucle infinie

  const loadSocieteDetails = useCallback(async (societeId: string) => {
    try {
      const response = await callClientApi(`admin/societes/${societeId}`, {
        method: 'GET',
      })

      if (!response?.ok) {
        throw new Error('Erreur lors du chargement des détails')
      }

      const data = await response?.json()
      if (data?.success && data?.data) {
        setSelectedSociete(data?.data)
        setIsDetailsOpen(true)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion')
    }
  }, [])

  const loadSocieteStats = useCallback(async (societeId: string) => {
    try {
      const response = await callClientApi(`admin/societes/${societeId}/stats`, {
        method: 'GET',
      })

      if (!response?.ok) {
        throw new Error('Erreur lors du chargement des statistiques')
      }

      const data = await response?.json()
      if (data?.success && data?.data) {
        setSelectedSocieteStats(data?.data)
        setIsStatsOpen(true)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion')
    }
  }, [])

  useEffect(() => {
    loadSocietes()
  }, [loadSocietes])

  const handleCreate = () => {
    if (onSocieteCreate) {
      onSocieteCreate()
    }
  }

  // Stats calculations
  const totalUsers = useMemo(() => societes?.reduce((sum, s) => sum + s.userCount, 0), [societes])
  const totalSites = useMemo(() => societes?.reduce((sum, s) => sum + (s?.sites?.length ?? 0), 0), [societes])
  const activeSocietes = useMemo(() => societes?.filter((s) => s.status === 'ACTIVE').length, [societes])
  const uniqueDatabases = useMemo(() => new Set(societes?.map((s) => s.databaseName)).size, [societes])

  return (
    <div className="space-y-4">
      {/* Header */}
      {!hideHeader && (
        <PageHeader
          title={t('societes.title') || 'Gestion des Sociétés'}
          description={t('societes.description') || 'Administration des sociétés et gestion des utilisateurs'}
          icon={Building}
          iconBackground="bg-gradient-to-br from-emerald-500 to-teal-600"
          spacing="sm"
          actions={
            <Button type="button" size="sm" onClick={handleCreate}>
              <Plus className="h-4 w-4" />
              <span className="ml-2">{t('societes.newSociete') || 'Nouvelle société'}</span>
            </Button>
          }
        />
      )}

      {/* Statistiques compactes en ligne */}
      <div className="flex items-center gap-6 py-2 px-1 text-sm border-b border-border/50">
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{t('societes.stats.total')}:</span>
          <span className="font-semibold text-foreground">{societes.length}</span>
          <span className="text-muted-foreground">({activeSocietes} {t('societes.stats.active')})</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" />
          <span className="text-muted-foreground">{t('societes.stats.users')}:</span>
          <span className="font-semibold text-blue-600">{totalUsers}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{t('societes.stats.sites')}:</span>
          <span className="font-semibold text-foreground">{totalSites}</span>
        </div>
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{t('societes.stats.databases')}:</span>
          <span className="font-semibold text-foreground">{uniqueDatabases}</span>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        data={societes}
        columns={columns}
        keyField="id"
        tableId="admin-societes"
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
      />

      {/* Dialog détails société */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('societes.detailsTitle')}: {selectedSociete?.nom}</DialogTitle>
            <DialogDescription>
              {t('societes.detailsDescription')}
            </DialogDescription>
          </DialogHeader>

          {selectedSociete && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="overview">{t('societes.tabs.overview')}</TabsTrigger>
                <TabsTrigger value="users">
                  {t('societes.tabs.users')} ({selectedSociete.users?.length ?? 0})
                </TabsTrigger>
                <TabsTrigger value="sites">
                  {t('societes.tabs.sites')} ({selectedSociete?.sites?.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t('societes.fields.name')}</Label>
                    <p className="text-lg font-semibold">{selectedSociete.nom}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t('societes.fields.code')}</Label>
                    <p className="text-lg font-semibold">{selectedSociete.code}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t('societes.fields.status')}</Label>
                    <Badge
                      variant={selectedSociete.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className="mt-1"
                    >
                      {selectedSociete.status === 'ACTIVE' ? t('societes.active') : t('societes.inactive')}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t('societes.fields.database')}</Label>
                    <p className="text-lg font-semibold font-mono">{selectedSociete.databaseName}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                {selectedSociete.users && selectedSociete?.users?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('societes.userTable.user')}</TableHead>
                        <TableHead>{t('societes.userTable.globalRole')}</TableHead>
                        <TableHead>{t('societes.userTable.societeRole')}</TableHead>
                        <TableHead>{t('societes.userTable.default')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSociete?.users?.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-semibold">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              style={{ backgroundColor: user?.globalRole?.color }}
                              className="text-white"
                            >
                              {user?.globalRole?.displayName}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.societeRole ? (
                              <Badge
                                style={{ backgroundColor: user?.societeRole?.color }}
                                className="text-white"
                              >
                                {user?.societeRole?.displayName}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">{t('societes.none')}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.isDefault ? (
                              <Badge variant="default">{t('societes.yes')}</Badge>
                            ) : (
                              <span className="text-muted-foreground">{t('societes.no')}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {t('societes.noUsers')}
                  </p>
                )}
              </TabsContent>

              <TabsContent value="sites" className="space-y-4">
                {selectedSociete?.sites?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('societes.siteTable.name')}</TableHead>
                        <TableHead>{t('societes.siteTable.code')}</TableHead>
                        <TableHead>{t('societes.siteTable.type')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSociete?.sites?.map((site) => (
                        <TableRow key={site.id}>
                          <TableCell className="font-medium">{site.nom}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{site.code}</Badge>
                          </TableCell>
                          <TableCell>
                            {site.isPrincipal ? (
                              <Badge variant="default">{t('societes.principal')}</Badge>
                            ) : (
                              <Badge variant="secondary">{t('societes.secondary')}</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {t('societes.noSites')}
                  </p>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog statistiques société */}
      <Dialog open={isStatsOpen} onOpenChange={setIsStatsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('societes.statsTitle')}: {selectedSocieteStats?.societeName}</DialogTitle>
            <DialogDescription>{t('societes.statsDescription')}</DialogDescription>
          </DialogHeader>

          {selectedSocieteStats && (
            <div className="space-y-6">
              {/* Statistiques générales */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">{t('societes.statsCard.total')}</p>
                  <div className="text-2xl font-bold">{selectedSocieteStats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">{t('societes.statsCard.users')}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">{t('societes.statsCard.active')}</p>
                  <div className="text-2xl font-bold text-green-600">
                    {selectedSocieteStats.activeUsers}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('societes.statsCard.users')}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">{t('societes.statsCard.inactive')}</p>
                  <div className="text-2xl font-bold text-red-600">
                    {selectedSocieteStats.inactiveUsers}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('societes.statsCard.users')}</p>
                </div>
              </div>

              {/* Répartition des rôles */}
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('societes.roleDistribution')}</h3>
                <div className="space-y-3">
                  {selectedSocieteStats?.roleDistribution?.map((roleData) => (
                    <div
                      key={roleData?.role?.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Badge
                          style={{ backgroundColor: roleData?.role?.color }}
                          className="text-white"
                        >
                          {roleData?.role?.displayName}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">{roleData.count}</div>
                        <div className="text-xs text-muted-foreground">
                          {((roleData.count / selectedSocieteStats.totalUsers) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sites */}
              <div className="text-center py-4 border-t">
                <div className="text-2xl font-bold">{selectedSocieteStats.sitesCount}</div>
                <p className="text-sm text-muted-foreground">{t('societes.productionSites')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
