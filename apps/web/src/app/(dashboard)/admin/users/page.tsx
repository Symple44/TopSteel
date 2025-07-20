'use client'

import { useState, useEffect } from 'react'
import { AdminGuard } from '@/components/auth/admin-guard'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Avatar,
  AvatarFallback,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Checkbox
} from '@erp/ui'
import { PermissionHide } from '@/components/auth/permission-guard'
import { 
  Users,
  Shield,
  UserPlus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  UserCheck,
  UserX,
  Building,
  Calendar,
  Mail,
  Phone
} from 'lucide-react'
// Fonction utilitaire pour formater les dates
const formatDate = (date: string | Date) => {
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const formatDateTime = (date: string | Date) => {
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  department?: string
  isActive: boolean
  createdAt: string
  lastLogin?: string
  roles: {
    id: string
    name: string
    description: string
    assignedAt: string
    expiresAt?: string
  }[]
  groups: {
    id: string
    name: string
    type: string
    assignedAt: string
  }[]
  permissions: {
    moduleId: string
    moduleName: string
    level: string
    source: 'role' | 'group'
  }[]
}

export default function UsersManagementPage() {
  return (
    <AdminGuard 
      requiredRoles={['SUPER_ADMIN', 'ADMIN']}
      requiredPermissions={['USER_VIEW']}
      showUnauthorized={true}
    >
      <UsersManagementContent />
    </AdminGuard>
  )
}

function UsersManagementContent() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterGroup, setFilterGroup] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  
  // Charger les utilisateurs
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users?includePermissions=true')
      const data = await response.json()
      if (data.success) {
        setUsers(data.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrer les utilisateurs
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === 'all' || 
      user.roles.some(role => role.id === filterRole)
    
    const matchesGroup = filterGroup === 'all' || 
      user.groups.some(group => group.id === filterGroup)
    
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive)

    return matchesSearch && matchesRole && matchesGroup && matchesStatus
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(u => u.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId])
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId))
    }
  }

  const exportUsers = () => {
    // Créer un CSV des utilisateurs
    const headers = ['Email', 'Nom', 'Prénom', 'Département', 'Statut', 'Rôles', 'Groupes']
    const rows = filteredUsers.map(user => [
      user.email,
      user.lastName,
      user.firstName,
      user.department || '',
      user.isActive ? 'Actif' : 'Inactif',
      user.roles.map(r => r.name).join(', '),
      user.groups.map(g => g.name).join(', ')
    ])
    
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `utilisateurs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="mt-4 text-gray-600">Chargement des utilisateurs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground mt-2">
            Vue complète des utilisateurs, leurs rôles et permissions
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportUsers}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <PermissionHide permission="USER_CREATE" roles={['SUPER_ADMIN', 'ADMIN']}>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Nouvel utilisateur
            </Button>
          </PermissionHide>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-medium text-muted-foreground">Total utilisateurs</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <h3 className="text-sm font-medium text-muted-foreground">Actifs</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{users.filter(u => u.isActive).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <h3 className="text-sm font-medium text-muted-foreground">Avec rôles</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{users.filter(u => u.roles.length > 0).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-orange-600" />
              <h3 className="text-sm font-medium text-muted-foreground">Avec groupes</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{users.filter(u => u.groups.length > 0).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
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
            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer par groupe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les groupes</SelectItem>
                <SelectItem value="direction">Direction</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="technique">Technique</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Actions groupées */}
      {selectedUsers.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedUsers.length} utilisateur(s) sélectionné(s)
              </p>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  Assigner un rôle
                </Button>
                <Button variant="outline" size="sm">
                  Ajouter à un groupe
                </Button>
                <Button variant="outline" size="sm" className="text-red-600">
                  Désactiver
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tableau des utilisateurs */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Rôles</TableHead>
                <TableHead>Groupes</TableHead>
                <TableHead>Département</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked: boolean) => handleSelectUser(user.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {user.firstName[0]}{user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role.id} variant="outline" className="text-xs">
                          {role.name}
                        </Badge>
                      ))}
                      {user.roles.length === 0 && (
                        <span className="text-sm text-muted-foreground">Aucun rôle</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.groups.map((group) => (
                        <Badge key={group.id} variant="secondary" className="text-xs">
                          {group.name}
                        </Badge>
                      ))}
                      {user.groups.length === 0 && (
                        <span className="text-sm text-muted-foreground">Aucun groupe</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.department || '-'}
                  </TableCell>
                  <TableCell>
                    {user.lastLogin ? (
                      <span className="text-sm">
                        {formatDateTime(user.lastLogin)}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Jamais</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'default' : 'secondary'}>
                      {user.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user)
                        setIsDetailOpen(true)
                      }}
                    >
                      Détails
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de détails utilisateur */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>Détails de l'utilisateur</DialogTitle>
              </DialogHeader>
              <UserDetailView user={selectedUser} onClose={() => setIsDetailOpen(false)} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Composant pour afficher les détails d'un utilisateur
function UserDetailView({ user, onClose }: { user: User, onClose: () => void }) {
  return (
    <div className="space-y-6">
      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Nom complet</p>
              <p className="font-medium">{user.firstName} {user.lastName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                {user.email}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Téléphone</p>
              <p className="font-medium flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                {user.phone || 'Non renseigné'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Département</p>
              <p className="font-medium">{user.department || 'Non renseigné'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Créé le</p>
              <p className="font-medium">
                {formatDate(user.createdAt)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Statut</p>
              <Badge variant={user.isActive ? 'default' : 'secondary'}>
                {user.isActive ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="roles">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roles">Rôles ({user.roles.length})</TabsTrigger>
          <TabsTrigger value="groups">Groupes ({user.groups.length})</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              {user.roles.length > 0 ? (
                <div className="space-y-3">
                  {user.roles.map((role) => (
                    <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{role.name}</p>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Assigné le {formatDate(role.assignedAt)}
                          {role.expiresAt && ` • Expire le ${formatDate(role.expiresAt)}`}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Aucun rôle assigné</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              {user.groups.length > 0 ? (
                <div className="space-y-3">
                  {user.groups.map((group) => (
                    <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{group.name}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {group.type}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ajouté le {formatDate(group.assignedAt)}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Aucun groupe assigné</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {Object.entries(
                  user.permissions.reduce((acc, perm) => {
                    if (!acc[perm.moduleName]) acc[perm.moduleName] = []
                    acc[perm.moduleName].push(perm)
                    return acc
                  }, {} as Record<string, typeof user.permissions>)
                ).map(([module, perms]) => (
                  <div key={module} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">{module}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {perms.map((perm, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span>{perm.level}</span>
                          <Badge variant={perm.source === 'role' ? 'default' : 'secondary'} className="text-xs">
                            {perm.source === 'role' ? 'Rôle' : 'Groupe'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}