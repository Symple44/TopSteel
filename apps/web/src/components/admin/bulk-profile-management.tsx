'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Checkbox,
  Badge,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Avatar,
  AvatarFallback,
  Label,
  Separator,
  Switch,
  Textarea
} from '@erp/ui'
import { 
  Search,
  Users,
  UserPlus,
  Filter,
  Download,
  Upload,
  Check,
  X,
  ArrowRight,
  Building,
  Mail,
  Calendar,
  Shield,
  Settings,
  Eye,
  EyeOff,
  UserX,
  Key,
  RefreshCw
} from 'lucide-react'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  department?: string
  role?: string
  lastLogin?: string
  isActive: boolean
  currentGroups?: string[]
  currentRoles?: string[]
}

interface Role {
  id: string
  name: string
  description: string
}

interface Group {
  id: string
  name: string
  description: string
  type: string
}

interface BulkProfileManagementProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

interface BulkOperation {
  type: 'assign_roles' | 'remove_roles' | 'assign_groups' | 'remove_groups' | 'activate' | 'deactivate' | 'reset_password' | 'update_department'
  label: string
  description: string
  icon: React.ReactNode
  requiresData?: boolean
}

const BULK_OPERATIONS: BulkOperation[] = [
  {
    type: 'assign_roles',
    label: 'Assigner des rôles',
    description: 'Ajouter des rôles aux utilisateurs sélectionnés',
    icon: <Shield className="h-4 w-4" />,
    requiresData: true
  },
  {
    type: 'remove_roles',
    label: 'Retirer des rôles',
    description: 'Supprimer des rôles des utilisateurs sélectionnés',
    icon: <Shield className="h-4 w-4" />,
    requiresData: true
  },
  {
    type: 'assign_groups',
    label: 'Assigner à des groupes',
    description: 'Ajouter les utilisateurs à des groupes',
    icon: <Users className="h-4 w-4" />,
    requiresData: true
  },
  {
    type: 'remove_groups',
    label: 'Retirer des groupes',
    description: 'Supprimer les utilisateurs des groupes',
    icon: <Users className="h-4 w-4" />,
    requiresData: true
  },
  {
    type: 'activate',
    label: 'Activer les comptes',
    description: 'Activer les comptes utilisateurs sélectionnés',
    icon: <Eye className="h-4 w-4" />
  },
  {
    type: 'deactivate',
    label: 'Désactiver les comptes',
    description: 'Désactiver les comptes utilisateurs sélectionnés',
    icon: <EyeOff className="h-4 w-4" />
  },
  {
    type: 'reset_password',
    label: 'Réinitialiser mots de passe',
    description: 'Envoyer des liens de réinitialisation par email',
    icon: <Key className="h-4 w-4" />
  },
  {
    type: 'update_department',
    label: 'Changer le département',
    description: 'Mettre à jour le département des utilisateurs',
    icon: <Building className="h-4 w-4" />,
    requiresData: true
  }
]

export default function BulkProfileManagement({ 
  isOpen, 
  onClose, 
  onComplete 
}: BulkProfileManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('select-users')

  // États pour les opérations spécifiques
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [newDepartment, setNewDepartment] = useState('')
  const [sendNotification, setSendNotification] = useState(true)
  const [operationReason, setOperationReason] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadUsers()
      loadRoles()
      loadGroups()
    }
  }, [isOpen])

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users?includeGroups=true&includeRoles=true')
      const data = await response.json()
      if (data.success) {
        setUsers(data.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
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

  const loadGroups = async () => {
    try {
      const response = await fetch('/api/admin/groups')
      const data = await response.json()
      if (data.success) {
        setGroups(data.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des groupes:', error)
    }
  }

  // Filtrage des utilisateurs
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDepartment = !departmentFilter || user.department === departmentFilter
    const matchesRole = !roleFilter || user.currentRoles?.includes(roleFilter)
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive)

    return matchesSearch && matchesDepartment && matchesRole && matchesStatus
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleUserSelect = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId])
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId))
    }
  }

  const handleOperationSelect = (operation: BulkOperation) => {
    setSelectedOperation(operation)
    setActiveTab('configure-operation')
  }

  const handleBulkOperation = async () => {
    if (!selectedOperation) return

    setLoading(true)
    try {
      const operationData: any = {
        userIds: selectedUsers,
        operation: selectedOperation.type,
        reason: operationReason,
        sendNotification
      }

      // Ajouter les données spécifiques selon l'opération
      switch (selectedOperation.type) {
        case 'assign_roles':
        case 'remove_roles':
          operationData.roleIds = selectedRoles
          break
        case 'assign_groups':
        case 'remove_groups':
          operationData.groupIds = selectedGroups
          break
        case 'update_department':
          operationData.department = newDepartment
          break
      }

      const response = await fetch('/api/admin/users/bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operationData)
      })

      if (response.ok) {
        onComplete()
        onClose()
        resetState()
      }
    } catch (error) {
      console.error('Erreur lors de l\'opération en masse:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetState = () => {
    setSelectedUsers([])
    setSelectedOperation(null)
    setSelectedRoles([])
    setSelectedGroups([])
    setNewDepartment('')
    setOperationReason('')
    setActiveTab('select-users')
  }

  const departments = [...new Set(users.map(u => u.department).filter(Boolean))]
  const userRoles = [...new Set(users.flatMap(u => u.currentRoles || []))]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gestion en masse des profils utilisateurs
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="select-users">
                1. Utilisateurs ({selectedUsers.length})
              </TabsTrigger>
              <TabsTrigger value="select-operation" disabled={selectedUsers.length === 0}>
                2. Opération
              </TabsTrigger>
              <TabsTrigger value="configure-operation" disabled={!selectedOperation}>
                3. Configuration
              </TabsTrigger>
              <TabsTrigger value="review" disabled={!selectedOperation || selectedUsers.length === 0}>
                4. Confirmation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="select-users" className="space-y-4 h-full overflow-hidden">
              {/* Filtres et recherche */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filtres et recherche
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <Label>Recherche</Label>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Nom, prénom, email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Département</Label>
                      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tous" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Tous les départements</SelectItem>
                          {departments.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Rôle</Label>
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tous" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Tous les rôles</SelectItem>
                          {userRoles.map(roleId => {
                            const role = roles.find(r => r.id === roleId)
                            return role ? (
                              <SelectItem key={roleId} value={roleId}>{role.name}</SelectItem>
                            ) : null
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Statut</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tous" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Tous</SelectItem>
                          <SelectItem value="active">Actifs</SelectItem>
                          <SelectItem value="inactive">Inactifs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button variant="outline" onClick={() => {
                        setSearchTerm('')
                        setDepartmentFilter('')
                        setRoleFilter('')
                        setStatusFilter('')
                      }}>
                        <X className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Liste des utilisateurs */}
              <Card className="flex-1 overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      Utilisateurs ({filteredUsers.length})
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-sm">Tout sélectionner</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Département</TableHead>
                        <TableHead>Rôles</TableHead>
                        <TableHead>Groupes</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Dernière connexion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={(checked) => handleUserSelect(user.id, checked)}
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
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.department && (
                              <Badge variant="outline">{user.department}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.currentRoles?.map(roleId => {
                                const role = roles.find(r => r.id === roleId)
                                return role ? (
                                  <Badge key={roleId} variant="outline" className="text-xs">
                                    {role.name}
                                  </Badge>
                                ) : null
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.currentGroups?.map(groupId => {
                                const group = groups.find(g => g.id === groupId)
                                return group ? (
                                  <Badge key={groupId} variant="secondary" className="text-xs">
                                    {group.name}
                                  </Badge>
                                ) : null
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.isActive ? 'default' : 'secondary'}>
                              {user.isActive ? 'Actif' : 'Inactif'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.lastLogin && (
                              <span className="text-sm flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(user.lastLogin).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="select-operation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sélectionner une opération</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {BULK_OPERATIONS.map((operation) => (
                      <div 
                        key={operation.type}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedOperation?.type === operation.type 
                            ? 'border-primary bg-primary/5' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleOperationSelect(operation)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {operation.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{operation.label}</h3>
                            <p className="text-sm text-muted-foreground">{operation.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="configure-operation" className="space-y-4">
              {selectedOperation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {selectedOperation.icon}
                      Configuration : {selectedOperation.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Configuration spécifique selon l'opération */}
                    {(selectedOperation.type === 'assign_roles' || selectedOperation.type === 'remove_roles') && (
                      <div>
                        <Label>Rôles concernés</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2 border rounded-md p-3 max-h-48 overflow-y-auto">
                          {roles.map((role) => (
                            <div key={role.id} className="flex items-center space-x-2">
                              <Checkbox
                                checked={selectedRoles.includes(role.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedRoles([...selectedRoles, role.id])
                                  } else {
                                    setSelectedRoles(selectedRoles.filter(id => id !== role.id))
                                  }
                                }}
                              />
                              <Label className="flex-1 cursor-pointer">
                                <span className="font-medium">{role.name}</span>
                                <span className="text-sm text-muted-foreground block">{role.description}</span>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(selectedOperation.type === 'assign_groups' || selectedOperation.type === 'remove_groups') && (
                      <div>
                        <Label>Groupes concernés</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2 border rounded-md p-3 max-h-48 overflow-y-auto">
                          {groups.map((group) => (
                            <div key={group.id} className="flex items-center space-x-2">
                              <Checkbox
                                checked={selectedGroups.includes(group.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedGroups([...selectedGroups, group.id])
                                  } else {
                                    setSelectedGroups(selectedGroups.filter(id => id !== group.id))
                                  }
                                }}
                              />
                              <Label className="flex-1 cursor-pointer">
                                <span className="font-medium">{group.name}</span>
                                <span className="text-sm text-muted-foreground block">{group.description}</span>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedOperation.type === 'update_department' && (
                      <div>
                        <Label>Nouveau département</Label>
                        <Input
                          value={newDepartment}
                          onChange={(e) => setNewDepartment(e.target.value)}
                          placeholder="Ex: Production, Commercial, Technique..."
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={sendNotification}
                        onCheckedChange={setSendNotification}
                      />
                      <Label>Envoyer une notification par email</Label>
                    </div>

                    <div>
                      <Label>Raison de l'opération (optionnel)</Label>
                      <Textarea
                        value={operationReason}
                        onChange={(e) => setOperationReason(e.target.value)}
                        placeholder="Décrivez la raison de cette opération en masse..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="review" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Révision de l'opération</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-2">Opération sélectionnée</h4>
                      {selectedOperation && (
                        <div className="p-3 border rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2">
                            {selectedOperation.icon}
                            <span className="font-medium">{selectedOperation.label}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {selectedOperation.description}
                          </p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-2">Utilisateurs concernés ({selectedUsers.length})</h4>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {selectedUsers.map(userId => {
                          const user = users.find(u => u.id === userId)
                          return user ? (
                            <Badge key={userId} variant="outline">
                              {user.firstName} {user.lastName}
                            </Badge>
                          ) : null
                        })}
                      </div>
                    </div>

                    <Separator />

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="font-medium text-yellow-800">⚠️ Attention</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Cette opération va affecter {selectedUsers.length} utilisateur(s). 
                        Assurez-vous que cette action est bien intentionnelle.
                        {sendNotification && " Les utilisateurs recevront une notification par email."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          
          <div className="flex gap-2">
            {activeTab === 'select-users' && selectedUsers.length > 0 && (
              <Button onClick={() => setActiveTab('select-operation')}>
                Suivant : Opération
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            
            {activeTab === 'select-operation' && selectedOperation && (
              <Button onClick={() => setActiveTab('configure-operation')}>
                Suivant : Configuration
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            
            {activeTab === 'configure-operation' && selectedOperation && (
              <Button onClick={() => setActiveTab('review')}>
                Suivant : Révision
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            
            {activeTab === 'review' && (
              <Button 
                onClick={handleBulkOperation}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirmer l'opération
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}