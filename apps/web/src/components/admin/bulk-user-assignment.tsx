'use client'

import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
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
  useFormFieldIds,
} from '@erp/ui'
import { ArrowRight, Building, Calendar, Check, Filter, Mail, Search, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { callClientApi } from '../../utils/backend-api'

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
}

interface Group {
  id: string
  name: string
  description: string
  type: string
  userCount: number
}

interface BulkUserAssignmentProps {
  isOpen: boolean
  onClose: () => void
  targetGroup?: Group
  onAssignmentComplete: () => void
}

export function BulkUserAssignment({
  isOpen,
  onClose,
  targetGroup,
  onAssignmentComplete,
}: BulkUserAssignmentProps) {
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>(
    targetGroup ? [targetGroup.id] : []
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('__all__')
  const [roleFilter, setRoleFilter] = useState('__all__')
  const [showOnlyUnassigned, setShowOnlyUnassigned] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('select-users')

  // Generate unique IDs for form fields
  const fieldIds = useFormFieldIds(['search', 'department', 'role', 'unassigned-only'])

  const loadUsers = useCallback(async () => {
    try {
      const response = await callClientApi('admin/users?includeGroups=true')
      const data = await response?.json()
      if (data?.success) {
        setUsers(data?.data)
      }
    } catch (_error) {}
  }, [])

  const loadGroups = useCallback(async () => {
    try {
      const response = await callClientApi('admin/groups')
      const data = await response?.json()
      if (data?.success) {
        setGroups(data?.data)
      }
    } catch (_error) {}
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadUsers()
      loadGroups()
    }
  }, [isOpen, loadGroups, loadUsers])

  useEffect(() => {
    if (targetGroup) {
      setSelectedGroups([targetGroup.id])
    }
  }, [targetGroup])

  // Filtrage des utilisateurs
  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      user?.firstName?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
      user?.lastName?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
      user?.email?.toLowerCase().includes(searchTerm?.toLowerCase())

    const matchesDepartment = departmentFilter === '__all__' || !departmentFilter || user?.department === departmentFilter
    const matchesRole = roleFilter === '__all__' || !roleFilter || user.role === roleFilter

    const matchesGroupFilter =
      !showOnlyUnassigned ||
      !user?.currentGroups?.some((groupId) => selectedGroups?.includes(groupId))

    return matchesSearch && matchesDepartment && matchesRole && matchesGroupFilter
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers?.map((user) => user?.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleUserSelect = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId])
    } else {
      setSelectedUsers(selectedUsers?.filter((id) => id !== userId))
    }
  }

  const handleBulkAssignment = async () => {
    setLoading(true)
    try {
      const assignments: Array<{ groupId: string; userId: string; assignedAt: string }> = []

      for (const groupId of selectedGroups) {
        for (const userId of selectedUsers) {
          assignments?.push({
            groupId,
            userId,
            assignedAt: new Date().toISOString(),
          })
        }
      }

      // Appel API pour l'assignation en masse
      const response = await callClientApi('admin/groups/bulk-assignment', {
        method: 'POST',
        body: JSON.stringify({ assignments }),
      })

      if (response?.ok) {
        onAssignmentComplete()
        onClose()
        setSelectedUsers([])
        setSelectedGroups(targetGroup ? [targetGroup.id] : [])
      }
    } catch (_error) {
    } finally {
      setLoading(false)
    }
  }

  const departments = [...new Set(users?.map((u) => u.department).filter(Boolean))]
  const roles = [...new Set(users?.map((u) => u.role).filter(Boolean))]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assignation en masse d'utilisateurs
            {targetGroup && <Badge variant="outline">vers {targetGroup.name}</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="select-users">
                1. Sélectionner Utilisateurs ({selectedUsers.length})
              </TabsTrigger>
              <TabsTrigger
                value="select-groups"
                disabled={!targetGroup && selectedUsers.length === 0}
              >
                2. Sélectionner Groupes ({selectedGroups.length})
              </TabsTrigger>
              <TabsTrigger
                value="review"
                disabled={selectedUsers.length === 0 || selectedGroups.length === 0}
              >
                3. Révision & Confirmation
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor={fieldIds.search}>Recherche</Label>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id={fieldIds.search}
                          placeholder="Nom, prénom, email..."
                          value={searchTerm}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setSearchTerm(e?.target?.value)
                          }
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={fieldIds.department}>Département</Label>
                      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger id={fieldIds.department}>
                          <SelectValue placeholder="Tous les départements" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Tous les départements</SelectItem>
                          {departments?.map(
                            (dept) =>
                              dept && (
                                <SelectItem key={dept} value={dept}>
                                  {dept}
                                </SelectItem>
                              )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={fieldIds.role}>Rôle</Label>
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger id={fieldIds.role}>
                          <SelectValue placeholder="Tous les rôles" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Tous les rôles</SelectItem>
                          {roles?.map(
                            (role) =>
                              role && (
                                <SelectItem key={role} value={role}>
                                  {role}
                                </SelectItem>
                              )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={fieldIds['unassigned-only']}
                          checked={showOnlyUnassigned}
                          onCheckedChange={(checked) => setShowOnlyUnassigned(checked === true)}
                        />
                        <Label htmlFor={fieldIds['unassigned-only']} className="text-sm">
                          Non assignés uniquement
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Liste des utilisateurs */}
              <Card className="flex-1 overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Utilisateurs ({filteredUsers?.length})</CardTitle>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={
                          selectedUsers.length === filteredUsers?.length &&
                          filteredUsers?.length > 0
                        }
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
                        <TableHead>Rôle</TableHead>
                        <TableHead>Groupes actuels</TableHead>
                        <TableHead>Dernière connexion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers?.map((user) => (
                        <TableRow key={user?.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedUsers?.includes(user?.id)}
                              onCheckedChange={(checked: boolean) =>
                                handleUserSelect(user?.id, checked)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>
                                  {user?.firstName?.[0]}
                                  {user?.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {user?.firstName} {user?.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {user?.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user?.department && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {user?.department}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user?.role && <Badge variant="secondary">{user?.role}</Badge>}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user?.currentGroups?.map((groupId) => {
                                const group = groups?.find((g) => g.id === groupId)
                                return group ? (
                                  <Badge key={groupId} variant="outline" className="text-xs">
                                    {group?.name}
                                  </Badge>
                                ) : null
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user?.lastLogin && (
                              <span className="text-sm flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(user?.lastLogin).toLocaleDateString('fr-FR')}
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

            <TabsContent value="select-groups" className="space-y-4">
              {!targetGroup && (
                <Card>
                  <CardHeader>
                    <CardTitle>Sélectionner les groupes de destination</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {groups?.map((group) => (
                        <div
                          key={group?.id}
                          className="flex items-center space-x-3 p-3 border rounded-lg"
                        >
                          <Checkbox
                            checked={selectedGroups?.includes(group?.id)}
                            onCheckedChange={(checked: boolean) => {
                              if (checked) {
                                setSelectedGroups([...selectedGroups, group?.id])
                              } else {
                                setSelectedGroups(selectedGroups?.filter((id) => id !== group?.id))
                              }
                            }}
                          />
                          <div className="flex-1">
                            <p className="font-medium">{group?.name}</p>
                            <p className="text-sm text-muted-foreground">{group?.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">{group?.type}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {group?.userCount} membres
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {targetGroup && (
                <Card>
                  <CardHeader>
                    <CardTitle>Groupe de destination</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <h3 className="font-semibold">{targetGroup.name}</h3>
                      <p className="text-muted-foreground">{targetGroup.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{targetGroup.type}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {targetGroup.userCount} membres actuels
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="review" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Révision de l'assignation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-2">
                        Utilisateurs sélectionnés ({selectedUsers.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedUsers?.map((userId) => {
                          const user = users?.find((u) => u.id === userId)
                          return user ? (
                            <Badge key={userId} variant="outline">
                              {user?.firstName} {user?.lastName}
                            </Badge>
                          ) : null
                        })}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-2">
                        Groupes de destination ({selectedGroups.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedGroups?.map((groupId) => {
                          const group = groups?.find((g) => g.id === groupId)
                          return group ? (
                            <Badge key={groupId} variant="outline">
                              {group?.name}
                            </Badge>
                          ) : null
                        })}
                      </div>
                    </div>

                    <Separator />

                    <div className="bg-muted/30 p-4 rounded-lg">
                      <p className="font-medium">Résumé de l'opération :</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedUsers.length} utilisateur(s) seront ajoutés à{' '}
                        {selectedGroups.length} groupe(s).
                        <br />
                        Total d'assignations : {selectedUsers.length * selectedGroups.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>

          <div className="flex gap-2">
            {activeTab === 'select-users' && selectedUsers.length > 0 && (
              <Button type="button" onClick={() => setActiveTab('select-groups')}>
                Suivant : Groupes
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {activeTab === 'select-groups' && selectedGroups.length > 0 && (
              <Button type="button" onClick={() => setActiveTab('review')}>
                Suivant : Révision
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {activeTab === 'review' && (
              <Button
                type="button"
                onClick={handleBulkAssignment}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Assignation en cours...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirmer l'assignation
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
