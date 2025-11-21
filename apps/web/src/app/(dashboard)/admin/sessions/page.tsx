'use client'

// Disable static generation due to client-side hooks
export const dynamic = 'force-dynamic'

import {
  Alert,
  AlertDescription,
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@erp/ui'
import {
  AlertTriangle,
  Clock,
  History,
  LogOut,
  MapPin,
  Monitor,
  RefreshCw,
  Search,
  User,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { AdminGuard } from '../../../../components/auth/admin-guard'
import { PermissionHide } from '../../../../components/auth/permission-guard'
import type { Role } from '../../../../hooks/use-permissions'
import { callClientApi } from '../../../../utils/backend-api'
import { useTranslation } from '../../../../lib/i18n/hooks'

// Fonction utilitaire pour formater les dates
const formatDateTime = (date: string | Date) => {
  const d = new Date(date)
  return d?.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatDuration = (start: string | Date) => {
  const now = new Date()
  const startTime = new Date(start)
  const diffMs = now?.getTime() - startTime?.getTime()

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

interface OnlineUser {
  id: string
  userId: string
  email: string
  firstName: string
  lastName: string
  role: string
  sessionId: string
  loginTime: string
  lastActivity: string
  ipAddress: string
  userAgent: string
  location?: {
    city: string
    country: string
    countryCode: string
  }
  deviceInfo: {
    browser: string
    os: string
    device: string
  }
  isIdle: boolean
  warningCount: number
}

interface ConnectionHistory {
  id: string
  userId: string
  email: string
  firstName: string
  lastName: string
  loginTime: string
  logoutTime?: string
  duration?: string
  ipAddress: string
  location?: {
    city: string
    country: string
  }
  deviceInfo: {
    browser: string
    os: string
  }
  status: 'active' | 'ended' | 'forced_logout'
}

export default function SessionsManagementPage() {
  return (
    <AdminGuard
      requiredRoles={['SUPER_ADMIN', 'ADMIN'] as Role[]}
      requiredPermissions={['SYSTEM_ADMIN']}
      showUnauthorized={true}
    >
      <SessionsManagementContent />
    </AdminGuard>
  )
}

function SessionsManagementContent() {
  const { t } = useTranslation()
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [connectionHistory, setConnectionHistory] = useState<ConnectionHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<OnlineUser | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'online' | 'history'>('online')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [onlineData, historyData] = await Promise.all([
        callClientApi('admin/sessions/online'),
        callClientApi('admin/sessions/history?limit=100'),
      ])

      const onlineResponse = onlineData as { success?: boolean; data?: OnlineUser[] }
      if (onlineResponse.success && onlineResponse.data) {
        setOnlineUsers(onlineResponse.data)
      }

      const historyResponse = historyData as { success?: boolean; data?: ConnectionHistory[] }
      if (historyResponse.success && historyResponse.data) {
        setConnectionHistory(historyResponse.data)
      }
    } catch (_error) {
    } finally {
      setLoading(false)
    }
  }, [])

  // Charger les données
  useEffect(() => {
    loadData()

    // Auto-refresh toutes les 30 secondes
    const interval = setInterval(() => {
      if (autoRefresh) {
        loadData()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh, loadData])

  // Filtrer les utilisateurs en ligne
  const filteredOnlineUsers = onlineUsers?.filter((user) => {
    const matchesSearch =
      searchTerm === '' ||
      user?.email?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm?.toLowerCase())

    const matchesRole = filterRole === 'all' || user.role === filterRole

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && !user.isIdle) ||
      (filterStatus === 'idle' && user.isIdle) ||
      (filterStatus === 'warning' && user.warningCount > 0)

    return matchesSearch && matchesRole && matchesStatus
  })

  const handleDisconnectUser = async (sessionId: string, userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir déconnecter cet utilisateur ?')) {
      return
    }

    try {
      const response = await callClientApi('admin/sessions/disconnect', {
        method: 'POST',
        body: JSON.stringify({ sessionId, userId }),
      })

      const responseData = response as { success?: boolean }
      if (responseData.success) {
        loadData() // Recharger les données
      }
    } catch (_error) {}
  }

  const handleViewProfile = (user: OnlineUser) => {
    // Rediriger vers le profil utilisateur
    window.open(`/admin/users/${user.userId}`, '_blank')
  }

  const handleViewHistory = async (user: OnlineUser) => {
    setSelectedUser(user)
    setIsDetailOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="mt-4 text-gray-600">Chargement des sessions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Sessions Utilisateurs</h1>
          <p className="text-muted-foreground mt-2">
            Surveillance des utilisateurs connectés et historique des connexions
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            type="button"
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button type="button" onClick={loadData} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Monitor className="h-5 w-5 text-green-600" />
              <h3 className="text-sm font-medium text-muted-foreground">En ligne</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{onlineUsers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-medium text-muted-foreground">Actifs</h3>
            </div>
            <p className="text-2xl font-bold mt-2">
              {onlineUsers?.filter((u) => !u.isIdle).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <h3 className="text-sm font-medium text-muted-foreground">Inactifs</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{onlineUsers?.filter((u) => u.isIdle).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="text-sm font-medium text-muted-foreground">Alertes</h3>
            </div>
            <p className="text-2xl font-bold mt-2">
              {onlineUsers?.filter((u) => u.warningCount > 0).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          type="button"
          variant={activeTab === 'online' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('online')}
          size="sm"
        >
          <Monitor className="h-4 w-4 mr-2" />
          Utilisateurs en ligne ({onlineUsers.length})
        </Button>
        <Button
          type="button"
          variant={activeTab === 'history' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('history')}
          size="sm"
        >
          <History className="h-4 w-4 mr-2" />
          Historique des connexions
        </Button>
      </div>

      {activeTab === 'online' && (
        <>
          {/* Filtres */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={t('search.byNameEmail')}
                      value={searchTerm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSearchTerm(e?.target?.value)
                      }
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrer par rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                    <SelectItem value="TECHNICIEN">Technicien</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="active">Actifs</SelectItem>
                    <SelectItem value="idle">Inactifs</SelectItem>
                    <SelectItem value="warning">Alertes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tableau des utilisateurs en ligne */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Connexion</TableHead>
                    <TableHead>Activité</TableHead>
                    <TableHead>Localisation</TableHead>
                    <TableHead>Appareil</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOnlineUsers?.map((user) => (
                    <TableRow key={user.sessionId}>
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
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{formatDateTime(user.loginTime)}</p>
                          <p className="text-muted-foreground">
                            Durée: {formatDuration(user.loginTime)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>Dernière: {formatDateTime(user.lastActivity)}</p>
                          <p className="text-muted-foreground">IP: {user.ipAddress}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {user.location ? (
                            <span>
                              {user?.location?.city}, {user?.location?.country}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Non déterminée</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{user?.deviceInfo?.browser}</p>
                          <p className="text-muted-foreground">{user?.deviceInfo?.os}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={user.isIdle ? 'secondary' : 'default'}
                            className={
                              user.isIdle
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-green-100 text-green-800'
                            }
                          >
                            {user.isIdle ? 'Inactif' : 'Actif'}
                          </Badge>
                          {user.warningCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {user.warningCount} alerte(s)
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center space-x-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewProfile(user)}
                            aria-label="Voir le profil"
                          >
                            <User className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewHistory(user)}
                            aria-label="Historique"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <PermissionHide permission={undefined} roles={['SUPER_ADMIN', 'ADMIN']}>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDisconnectUser(user.sessionId, user.userId)}
                              className="text-red-600 hover:text-red-700"
                              aria-label="Déconnecter"
                            >
                              <LogOut className="h-4 w-4" />
                            </Button>
                          </PermissionHide>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredOnlineUsers?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun utilisateur en ligne trouvé
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des connexions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Connexion</TableHead>
                  <TableHead>Déconnexion</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Appareil</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connectionHistory?.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {session.firstName?.[0]}
                            {session.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {session.firstName} {session.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{session.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{formatDateTime(session.loginTime)}</p>
                        <p className="text-muted-foreground">IP: {session.ipAddress}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {session.logoutTime ? (
                        <span className="text-sm">{formatDateTime(session.logoutTime)}</span>
                      ) : (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          {t('status.inProgress')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {session.duration ||
                        (session.status === 'active' ? formatDuration(session.loginTime) : '-')}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {session.location ? (
                          <span>
                            {session?.location?.city}, {session?.location?.country}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Non déterminée</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{session?.deviceInfo?.browser}</p>
                        <p className="text-muted-foreground">{session?.deviceInfo?.os}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          session.status === 'active'
                            ? 'default'
                            : session.status === 'forced_logout'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {session.status === 'active'
                          ? 'Actif'
                          : session.status === 'forced_logout'
                            ? 'Déconnexion forcée'
                            : 'Terminé'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog de détails utilisateur */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Historique de connexion - {selectedUser.firstName} {selectedUser.lastName}
                </DialogTitle>
              </DialogHeader>
              <UserConnectionHistory userId={selectedUser.userId} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Composant pour afficher l'historique de connexion d'un utilisateur
function UserConnectionHistory({ userId }: { userId: string }) {
  const [history, setHistory] = useState<ConnectionHistory[]>([])
  const [loading, setLoading] = useState(true)

  const loadUserHistory = useCallback(async () => {
    try {
      const data = await callClientApi(`admin/sessions/user/${userId}/history`)
      const historyResponse = data as { success?: boolean; data?: ConnectionHistory[] }
      if (historyResponse.success && historyResponse.data) {
        setHistory(historyResponse.data)
      }
    } catch (_error) {
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadUserHistory()
  }, [loadUserHistory])

  if (loading) {
    return <div className="text-center py-4">Chargement de l'historique...</div>
  }

  return (
    <div className="space-y-4">
      {/* Statistiques utilisateur */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total connexions</div>
            <div className="text-2xl font-bold">{history.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Cette semaine</div>
            <div className="text-2xl font-bold">
              {
                history?.filter((h) => {
                  const weekAgo = new Date()
                  weekAgo?.setDate(weekAgo?.getDate() - 7)
                  return new Date(h.loginTime) > weekAgo
                }).length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Déconnexions forcées</div>
            <div className="text-2xl font-bold text-red-600">
              {history?.filter((h) => h.status === 'forced_logout').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerte si déconnexions suspectes */}
      {history?.filter((h) => h.status === 'forced_logout').length > 3 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Cet utilisateur a subi plusieurs déconnexions forcées récemment. Cela pourrait indiquer
            un problème de sécurité.
          </AlertDescription>
        </Alert>
      )}

      {/* Liste des connexions */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {history?.map((session) => (
          <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <div className="text-sm font-medium">{formatDateTime(session.loginTime)}</div>
                <Badge
                  variant={
                    session.status === 'active'
                      ? 'default'
                      : session.status === 'forced_logout'
                        ? 'destructive'
                        : 'secondary'
                  }
                  className="text-xs"
                >
                  {session.status === 'active'
                    ? 'En cours'
                    : session.status === 'forced_logout'
                      ? 'Forcée'
                      : 'Normale'}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                IP: {session.ipAddress} •
                {session.location &&
                  ` ${session?.location?.city}, ${session?.location?.country} • `}
                {session?.deviceInfo?.browser} ({session?.deviceInfo?.os})
                {session.duration && ` • Durée: ${session.duration}`}
              </div>
            </div>
          </div>
        ))}
      </div>

      {history.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Aucun historique de connexion trouvé
        </div>
      )}
    </div>
  )
}
