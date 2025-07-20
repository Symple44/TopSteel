'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Textarea,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Switch,
  Avatar,
  AvatarFallback,
  Checkbox
} from '@erp/ui'
import { PermissionHide } from '@/components/auth/permission-guard'
import { 
  Users,
  Shield,
  Plus,
  Edit,
  Trash2,
  Building,
  Briefcase,
  FolderOpen,
  Settings,
  UserPlus,
  UserMinus
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

interface Group {
  id: string
  name: string
  description: string
  type: 'DEPARTMENT' | 'TEAM' | 'PROJECT' | 'CUSTOM'
  isActive: boolean
  userCount: number
  roleCount: number
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

const GROUP_TYPE_LABELS = {
  DEPARTMENT: 'Département',
  TEAM: 'Équipe',
  PROJECT: 'Projet',
  CUSTOM: 'Personnalisé'
}

const GROUP_TYPE_ICONS = {
  DEPARTMENT: Building,
  TEAM: Users,
  PROJECT: FolderOpen,
  CUSTOM: Settings
}

const GROUP_TYPE_COLORS = {
  DEPARTMENT: 'bg-blue-100 text-blue-800',
  TEAM: 'bg-green-100 text-green-800',
  PROJECT: 'bg-purple-100 text-purple-800',
  CUSTOM: 'bg-gray-100 text-gray-800'
}

export default function GroupManagementPanel() {
  const [groups, setGroups] = useState<Group[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [groupUsers, setGroupUsers] = useState<GroupUser[]>([])
  const [groupRoles, setGroupRoles] = useState<Role[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('groups')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGroups()
    loadRoles()
  }, [])

  const loadGroups = async () => {
    try {
      const response = await fetch('/api/admin/groups')
      const data = await response.json()
      if (data.success) {
        setGroups(data.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des groupes:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles')
      const data = await response.json()
      if (data.success) {
        setRoles(data.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rôles:', error)
    }
  }

  const loadGroupDetails = async (groupId: string) => {
    try {
      // Charger les utilisateurs du groupe
      const usersResponse = await fetch(`/api/admin/groups/${groupId}/users`)
      const usersData = await usersResponse.json()
      if (usersData.success) {
        setGroupUsers(usersData.data)
      }

      // Charger les rôles du groupe
      const rolesResponse = await fetch(`/api/admin/groups/${groupId}/roles`)
      const rolesData = await rolesResponse.json()
      if (rolesData.success) {
        setGroupRoles(rolesData.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/groups/${groupId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        loadGroups()
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

  const openDetailDialog = async (group: Group) => {
    setSelectedGroup(group)
    setIsDetailDialogOpen(true)
    await loadGroupDetails(group.id)
  }

  // Regrouper les groupes par type
  const groupsByType = groups.reduce((acc, group) => {
    if (!acc[group.type]) acc[group.type] = []
    acc[group.type].push(group)
    return acc
  }, {} as Record<string, Group[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="mt-4 text-gray-600">Chargement des groupes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Groupes</h1>
          <p className="text-muted-foreground mt-2">
            Organisez vos utilisateurs en groupes avec des rôles partagés
          </p>
        </div>
        <PermissionHide permission={undefined} roles={['SUPER_ADMIN', 'ADMIN']}>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau groupe
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un nouveau groupe</DialogTitle>
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

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(GROUP_TYPE_LABELS).map(([type, label]) => {
          const Icon = GROUP_TYPE_ICONS[type as keyof typeof GROUP_TYPE_ICONS]
          const count = groupsByType[type]?.length || 0
          return (
            <Card key={type}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Icon className="h-5 w-5 text-blue-600" />
                  <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
                </div>
                <p className="text-2xl font-bold mt-2">{count}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="groups">Tous les groupes ({groups.length})</TabsTrigger>
          <TabsTrigger value="by-type">Par type</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="space-y-4">
          <div className="grid gap-4">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onEdit={() => {
                  setSelectedGroup(group)
                  setIsEditDialogOpen(true)
                }}
                onDelete={() => handleDeleteGroup(group.id)}
                onViewDetails={() => openDetailDialog(group)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="by-type" className="space-y-6">
          {Object.entries(groupsByType).map(([type, typeGroups]) => (
            <Card key={type}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Badge className={GROUP_TYPE_COLORS[type as keyof typeof GROUP_TYPE_COLORS]}>
                    {GROUP_TYPE_LABELS[type as keyof typeof GROUP_TYPE_LABELS]}
                  </Badge>
                  <span className="text-lg">({typeGroups.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {typeGroups.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      onEdit={() => {
                        setSelectedGroup(group)
                        setIsEditDialogOpen(true)
                      }}
                      onDelete={() => handleDeleteGroup(group.id)}
                      onViewDetails={() => openDetailDialog(group)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Dialog d'édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le groupe: {selectedGroup?.name}</DialogTitle>
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
            <DialogTitle>Détails du groupe: {selectedGroup?.name}</DialogTitle>
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
    </div>
  )
}

// Composant pour afficher une carte de groupe
function GroupCard({ 
  group, 
  onEdit, 
  onDelete, 
  onViewDetails 
}: { 
  group: Group
  onEdit: () => void
  onDelete: () => void
  onViewDetails: () => void
}) {
  const Icon = GROUP_TYPE_ICONS[group.type]
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className={`p-2 rounded-lg ${GROUP_TYPE_COLORS[group.type].replace('text-', 'bg-').replace('-800', '-100')}`}>
              <Icon className={`h-6 w-6 ${GROUP_TYPE_COLORS[group.type].replace('bg-', 'text-').replace('-100', '-600')}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-lg">{group.name}</h3>
                <Badge className={GROUP_TYPE_COLORS[group.type]}>
                  {GROUP_TYPE_LABELS[group.type]}
                </Badge>
                <Badge variant={group.isActive ? "default" : "secondary"}>
                  {group.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
              <p className="text-muted-foreground mb-3">{group.description}</p>
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{group.userCount} membres</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="h-4 w-4" />
                  <span>{group.roleCount} rôles</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>Créé le {formatDate(group.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewDetails}
            >
              Détails
            </Button>
            <PermissionHide permission={undefined} roles={['SUPER_ADMIN', 'ADMIN']}>
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </PermissionHide>
            <PermissionHide permission={undefined} roles={['SUPER_ADMIN']}>
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </PermissionHide>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Composant pour créer/éditer un groupe
function GroupForm({ 
  group, 
  roles,
  onSave 
}: { 
  group?: Group | null
  roles: Role[]
  onSave: () => void 
}) {
  const [formData, setFormData] = useState({
    name: group?.name || '',
    description: group?.description || '',
    type: group?.type || 'TEAM' as 'DEPARTMENT' | 'TEAM' | 'PROJECT' | 'CUSTOM',
    isActive: group?.isActive ?? true,
    roleIds: [] as string[]
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = group 
        ? `/api/admin/groups/${group.id}`
        : '/api/admin/groups'
      
      const response = await fetch(url, {
        method: group ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        onSave()
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nom du groupe</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Ex: Équipe commerciale..."
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Décrivez le rôle et les responsabilités de ce groupe..."
          required
        />
      </div>
      
      <div>
        <Label htmlFor="type">Type de groupe</Label>
        <Select
          value={formData.type}
          onValueChange={(value: string) => setFormData(prev => ({ ...prev, type: value as typeof formData.type }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(GROUP_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!group && (
        <div>
          <Label>Rôles par défaut</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Sélectionnez les rôles qui seront automatiquement attribués aux membres du groupe
          </p>
          <div className="space-y-2 border rounded-lg p-3 max-h-48 overflow-y-auto">
            {roles.map((role) => (
              <div key={role.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`role-${role.id}`}
                  checked={formData.roleIds.includes(role.id)}
                  onCheckedChange={(checked: boolean) => {
                    if (checked) {
                      setFormData(prev => ({ ...prev, roleIds: [...prev.roleIds, role.id] }))
                    } else {
                      setFormData(prev => ({ ...prev, roleIds: prev.roleIds.filter(id => id !== role.id) }))
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
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, isActive: checked }))}
        />
        <Label htmlFor="isActive">Groupe actif</Label>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onSave}>
          Annuler
        </Button>
        <Button type="submit">
          {group ? 'Modifier' : 'Créer'}
        </Button>
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
  onRefresh 
}: { 
  group: Group | null
  users: GroupUser[]
  roles: Role[]
  allRoles: Role[]
  onRefresh: () => void
}) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(roles.map(r => r.id))
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)

  if (!group) return null

  const handleUpdateRoles = async () => {
    try {
      const response = await fetch(`/api/admin/groups/${group.id}/roles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleIds: selectedRoles })
      })
      
      if (response.ok) {
        onRefresh()
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des rôles:', error)
    }
  }

  const handleRemoveUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/groups/${group.id}/users/${userId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        onRefresh()
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations du groupe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <Badge className={GROUP_TYPE_COLORS[group.type]}>
                {GROUP_TYPE_LABELS[group.type]}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Statut</p>
              <Badge variant={group.isActive ? 'default' : 'secondary'}>
                {group.isActive ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Créé le</p>
              <p>{formatDate(group.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Modifié le</p>
              <p>{formatDate(group.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="members">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members">Membres ({users.length})</TabsTrigger>
          <TabsTrigger value="roles">Rôles ({roles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Membres du groupe</h3>
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Ajouter un membre
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un membre au groupe</DialogTitle>
                </DialogHeader>
                {/* Formulaire d'ajout d'utilisateur */}
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Ajouté le</TableHead>
                  <TableHead>Ajouté par</TableHead>
                  <TableHead>Expire le</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
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
                      {formatDate(user.assignedAt)}
                    </TableCell>
                    <TableCell>{user.assignedBy}</TableCell>
                    <TableCell>
                      {user.expiresAt 
                        ? formatDate(user.expiresAt)
                        : '-'
                      }
                    </TableCell>
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
                Aucun membre dans ce groupe
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Rôles du groupe</h3>
            <PermissionHide permission={undefined} roles={['SUPER_ADMIN']}>
              <Button size="sm" onClick={handleUpdateRoles}>
                Sauvegarder les modifications
              </Button>
            </PermissionHide>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                {allRoles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      checked={selectedRoles.includes(role.id)}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          setSelectedRoles([...selectedRoles, role.id])
                        } else {
                          setSelectedRoles(selectedRoles.filter(id => id !== role.id))
                        }
                      }}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{role.name}</p>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
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