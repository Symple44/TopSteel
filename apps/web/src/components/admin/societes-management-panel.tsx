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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Label,
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
} from '@erp/ui'
import { Building, Database, Edit, Eye, MapPin, Plus, Shield, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { callClientApi } from '@/utils/backend-api'

interface Societe {
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

export function SocietesManagementPanel() {
  const [societes, setSocietes] = useState<Societe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSociete, setSelectedSociete] = useState<Societe | null>(null)
  const [selectedSocieteStats, setSelectedSocieteStats] = useState<SocieteStats | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isStatsOpen, setIsStatsOpen] = useState(false)
  const [_isCreateSocieteOpen, setIsCreateSocieteOpen] = useState(false)
  const [_isEditSocieteOpen, setIsEditSocieteOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Charger les sociétés
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
        setError('Impossible de charger les sociétés')
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }, [])

  // Charger les détails d'une société
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
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Erreur de connexion')
    }
  }, [])

  // Charger les statistiques d'une société
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
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Erreur de connexion')
    }
  }, [])

  // Charger les données initiales
  useEffect(() => {
    loadSocietes()
  }, [loadSocietes])

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Sociétés</h1>
          <p className="text-gray-600 mt-2">
            Administration des sociétés et gestion des utilisateurs
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setIsCreateSocieteOpen(true)
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouvelle société
        </Button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sociétés</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{societes.length}</div>
            <p className="text-xs text-muted-foreground">
              {societes?.filter((s) => s.status === 'ACTIVE').length} actives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {societes?.reduce((sum, s) => sum + s.userCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Répartis dans toutes les sociétés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sites</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {societes?.reduce((sum, s) => sum + s?.sites?.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Sites de production</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bases de données</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(societes?.map((s) => s.databaseName)).size}
            </div>
            <p className="text-xs text-muted-foreground">Instances uniques</p>
          </CardContent>
        </Card>
      </div>

      {/* Table des sociétés */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des sociétés</CardTitle>
          <CardDescription>Gestion des sociétés et de leurs utilisateurs</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>{error}</p>
              <Button type="button" onClick={loadSocietes} variant="outline" className="mt-4">
                Réessayer
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Société</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Utilisateurs</TableHead>
                  <TableHead>Sites</TableHead>
                  <TableHead>Base de données</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {societes?.map((societe) => (
                  <TableRow key={societe.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                          {societe?.nom?.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold">{societe.nom}</p>
                          <p className="text-sm text-muted-foreground">
                            Créée le {new Date(societe.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{societe.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={societe.status === 'ACTIVE' ? 'default' : 'secondary'}
                        className={
                          societe.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {societe.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{societe.userCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{societe?.sites?.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {societe.databaseName}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => loadSocieteDetails(societe.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => loadSocieteStats(societe.id)}
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSociete(societe)
                            setIsEditSocieteOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog détails société */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la société: {selectedSociete?.nom}</DialogTitle>
            <DialogDescription>
              Informations complètes sur la société et ses utilisateurs
            </DialogDescription>
          </DialogHeader>

          {selectedSociete && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="users">
                  Utilisateurs ({selectedSociete.users?.length ?? 0})
                </TabsTrigger>
                <TabsTrigger value="sites">Sites ({selectedSociete?.sites?.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nom</Label>
                    <p className="text-lg font-semibold">{selectedSociete.nom}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Code</Label>
                    <p className="text-lg font-semibold">{selectedSociete.code}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <Badge
                      variant={selectedSociete.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className="mt-1"
                    >
                      {selectedSociete.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Base de données
                    </Label>
                    <p className="text-lg font-semibold font-mono">
                      {selectedSociete.databaseName}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                {selectedSociete.users && selectedSociete?.users?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Rôle global</TableHead>
                        <TableHead>Rôle société</TableHead>
                        <TableHead>Par défaut</TableHead>
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
                              <span className="text-muted-foreground">Aucun</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.isDefault ? (
                              <Badge variant="default">Oui</Badge>
                            ) : (
                              <span className="text-muted-foreground">Non</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun utilisateur assigné à cette société
                  </p>
                )}
              </TabsContent>

              <TabsContent value="sites" className="space-y-4">
                {selectedSociete?.sites?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom du site</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Type</TableHead>
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
                              <Badge variant="default">Principal</Badge>
                            ) : (
                              <Badge variant="secondary">Secondaire</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun site configuré pour cette société
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
            <DialogTitle>Statistiques: {selectedSocieteStats?.societeName}</DialogTitle>
            <DialogDescription>Répartition des utilisateurs et des rôles</DialogDescription>
          </DialogHeader>

          {selectedSocieteStats && (
            <div className="space-y-6">
              {/* Statistiques générales */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedSocieteStats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">utilisateurs</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Actifs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {selectedSocieteStats.activeUsers}
                    </div>
                    <p className="text-xs text-muted-foreground">utilisateurs</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Inactifs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {selectedSocieteStats.inactiveUsers}
                    </div>
                    <p className="text-xs text-muted-foreground">utilisateurs</p>
                  </CardContent>
                </Card>
              </div>

              {/* Répartition des rôles */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Répartition des rôles</h3>
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
                <p className="text-sm text-muted-foreground">Sites de production</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
