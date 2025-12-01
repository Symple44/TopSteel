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
} from '@erp/ui'
import {
  ArrowRight,
  Building,
  Calendar,
  Check,
  Eye,
  EyeOff,
  Filter,
  Key,
  Mail,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Users,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { callClientApi } from '../../utils/backend-api'
import { useTranslation } from '../../lib/i18n/hooks'

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
  type:
    | 'assign_roles'
    | 'remove_roles'
    | 'assign_groups'
    | 'remove_groups'
    | 'activate'
    | 'deactivate'
    | 'reset_password'
    | 'update_department'
  label: string
  description: string
  icon: React.ReactNode
  requiresData?: boolean
}


// Function to get bulk operations with translations
const getBulkOperations = (t: (key: string) => string): BulkOperation[] => [
  {
    type: 'assign_roles',
    label: t('bulk.operations.assign_roles'),
    description: t('bulk.operations.assign_roles_desc'),
    icon: <Shield className="h-4 w-4" />,
    requiresData: true,
  },
  {
    type: 'remove_roles',
    label: t('bulk.operations.remove_roles'),
    description: t('bulk.operations.remove_roles_desc'),
    icon: <Shield className="h-4 w-4" />,
    requiresData: true,
  },
  {
    type: 'assign_groups',
    label: t('bulk.operations.assign_groups'),
    description: t('bulk.operations.assign_groups_desc'),
    icon: <Users className="h-4 w-4" />,
    requiresData: true,
  },
  {
    type: 'remove_groups',
    label: t('bulk.operations.remove_groups'),
    description: t('bulk.operations.remove_groups_desc'),
    icon: <Users className="h-4 w-4" />,
    requiresData: true,
  },
  {
    type: 'activate',
    label: t('bulk.operations.activate'),
    description: t('bulk.operations.activate_desc'),
    icon: <Eye className="h-4 w-4" />,
  },
  {
    type: 'deactivate',
    label: t('bulk.operations.deactivate'),
    description: t('bulk.operations.deactivate_desc'),
    icon: <EyeOff className="h-4 w-4" />,
  },
  {
    type: 'reset_password',
    label: t('bulk.operations.reset_password'),
    description: t('bulk.operations.reset_password_desc'),
    icon: <Key className="h-4 w-4" />,
  },
  {
    type: 'update_department',
    label: t('bulk.operations.update_department'),
    description: t('bulk.operations.update_department_desc'),
    icon: <Building className="h-4 w-4" />,
    requiresData: true,
  },
]

export function BulkProfileManagement({ isOpen, onClose, onComplete }: BulkProfileManagementProps) {
  const { t } = useTranslation('admin')
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('__all__')
  const [roleFilter, setRoleFilter] = useState('__all__')
  const [statusFilter, setStatusFilter] = useState('__all__')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('select-users')

  // États pour les opérations spécifiques
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [newDepartment, setNewDepartment] = useState('')
  const [sendNotification, setSendNotification] = useState(true)
  const [operationReason, setOperationReason] = useState('')

  const loadUsers = useCallback(async () => {
    try {
      const response = await callClientApi('admin/users?includeGroups=true&includeRoles=true')
      const data = await response?.json()
      if (data?.success) {
        setUsers(data?.data)
      }
    } catch {}
  }, [])

  const loadRoles = useCallback(async () => {
    try {
      const response = await callClientApi('admin/roles')
      const data = await response?.json()
      if (data?.success) {
        setRoles(data?.data)
      }
    } catch {}
  }, [])

  const loadGroups = useCallback(async () => {
    try {
      const response = await callClientApi('admin/groups')
      const data = await response?.json()
      if (data?.success) {
        setGroups(data?.data)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadUsers()
      loadRoles()
      loadGroups()
    }
  }, [isOpen, loadGroups, loadRoles, loadUsers])

  // Filtrage des utilisateurs
  const filteredUsers = users?.filter((user) => {
    const matchesSearch =
      user?.firstName?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
      user?.lastName?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
      user?.email?.toLowerCase().includes(searchTerm?.toLowerCase())

    const matchesDepartment = departmentFilter === '__all__' || !departmentFilter || user?.department === departmentFilter
    const matchesRole = roleFilter === '__all__' || !roleFilter || user?.currentRoles?.includes(roleFilter)
    const matchesStatus =
      statusFilter === '__all__' || !statusFilter ||
      (statusFilter === 'active' && user?.isActive) ||
      (statusFilter === 'inactive' && !user?.isActive)

    return matchesSearch && matchesDepartment && matchesRole && matchesStatus
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

  const handleOperationSelect = (operation: BulkOperation) => {
    setSelectedOperation(operation)
    setActiveTab('configure-operation')
  }

  const handleBulkOperation = async () => {
    if (!selectedOperation) return

    setLoading(true)
    try {
      const operationData: Record<string, unknown> = {
        userIds: selectedUsers,
        operation: selectedOperation.type,
        reason: operationReason,
        sendNotification,
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

      const response = await callClientApi('admin/users/bulk-operations', {
        method: 'POST',
        body: JSON.stringify(operationData),
      })

      if (response?.ok) {
        onComplete()
        onClose()
        resetState()
      }
    } catch {
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

  const departments = [...new Set(users?.map((u) => u.department).filter(Boolean))]
  const userRoles = [...new Set(users?.flatMap((u) => u.currentRoles || []))]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('bulk.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="select-users">
                1. {t('bulk.tabs.selectUsers')} ({selectedUsers.length})
              </TabsTrigger>
              <TabsTrigger value="select-operation" disabled={selectedUsers.length === 0}>
                2. {t('bulk.tabs.selectOperation')}
              </TabsTrigger>
              <TabsTrigger value="configure-operation" disabled={!selectedOperation}>
                3. {t('bulk.tabs.configure')}
              </TabsTrigger>
              <TabsTrigger
                value="review"
                disabled={!selectedOperation || selectedUsers.length === 0}
              >
                4. {t('bulk.tabs.review')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="select-users" className="space-y-4 h-full overflow-hidden">
              {/* Filtres et recherche */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    {t('bulk.filters.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <Label>{t('bulk.filters.search')}</Label>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={t('bulk.filters.searchPlaceholder')}
                          value={searchTerm}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setSearchTerm(e?.target?.value)
                          }
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>{t('bulk.filters.department')}</Label>
                      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('bulk.filters.all')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">{t('bulk.filters.allDepartments')}</SelectItem>
                          {departments?.map((dept) => (
                            <SelectItem key={dept} value={dept || '__none__'}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t('bulk.filters.role')}</Label>
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('bulk.filters.all')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">{t('bulk.filters.allRoles')}</SelectItem>
                          {userRoles?.map((roleId) => {
                            const role = roles?.find((r) => r.id === roleId)
                            return role ? (
                              <SelectItem key={roleId} value={roleId}>
                                {role?.name}
                              </SelectItem>
                            ) : null
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t('bulk.filters.status')}</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('bulk.filters.all')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">{t('bulk.filters.all')}</SelectItem>
                          <SelectItem value="active">{t('bulk.filters.active')}</SelectItem>
                          <SelectItem value="inactive">{t('bulk.filters.inactive')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSearchTerm('')
                          setDepartmentFilter('__all__')
                          setRoleFilter('__all__')
                          setStatusFilter('__all__')
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        {t('bulk.filters.reset')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Liste des utilisateurs */}
              <Card className="flex-1 overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{t('bulk.userList.title')} ({filteredUsers?.length})</CardTitle>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={
                          selectedUsers.length === filteredUsers?.length &&
                          filteredUsers?.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-sm">{t('bulk.userList.selectAll')}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>{t('bulk.userList.columns.user')}</TableHead>
                        <TableHead>{t('bulk.userList.columns.department')}</TableHead>
                        <TableHead>{t('bulk.userList.columns.roles')}</TableHead>
                        <TableHead>{t('bulk.userList.columns.groups')}</TableHead>
                        <TableHead>{t('bulk.userList.columns.status')}</TableHead>
                        <TableHead>{t('bulk.userList.columns.lastLogin')}</TableHead>
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
                              <Badge variant="outline">{user?.department}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user?.currentRoles?.map((roleId) => {
                                const role = roles?.find((r) => r.id === roleId)
                                return role ? (
                                  <Badge key={roleId} variant="outline" className="text-xs">
                                    {role?.name}
                                  </Badge>
                                ) : null
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user?.currentGroups?.map((groupId) => {
                                const group = groups?.find((g) => g.id === groupId)
                                return group ? (
                                  <Badge key={groupId} variant="secondary" className="text-xs">
                                    {group?.name}
                                  </Badge>
                                ) : null
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user?.isActive ? 'default' : 'secondary'}>
                              {user?.isActive ? t('bulk.filters.active') : t('bulk.filters.inactive')}
                            </Badge>
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

            <TabsContent value="select-operation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('bulk.operations.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getBulkOperations(t)?.map((operation) => (
                      <button
                        type="button"
                        key={operation.type}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors text-left w-full ${
                          selectedOperation?.type === operation.type
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleOperationSelect(operation)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-gray-100 rounded-lg">{operation.icon}</div>
                          <div className="flex-1">
                            <h3 className="font-medium">{operation.label}</h3>
                            <p className="text-sm text-muted-foreground">{operation.description}</p>
                          </div>
                        </div>
                      </button>
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
                      {t('bulk.configure.title')} : {selectedOperation.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Configuration spécifique selon l'opération */}
                    {(selectedOperation.type === 'assign_roles' ||
                      selectedOperation.type === 'remove_roles') && (
                      <div>
                        <Label>{t('bulk.configure.rolesLabel')}</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2 border rounded-md p-3 max-h-48 overflow-y-auto">
                          {roles?.map((role) => (
                            <div key={role?.id} className="flex items-center space-x-2">
                              <Checkbox
                                checked={selectedRoles?.includes(role?.id)}
                                onCheckedChange={(checked: boolean) => {
                                  if (checked) {
                                    setSelectedRoles([...selectedRoles, role?.id])
                                  } else {
                                    setSelectedRoles(selectedRoles?.filter((id) => id !== role?.id))
                                  }
                                }}
                              />
                              <Label className="flex-1 cursor-pointer">
                                <span className="font-medium">{role?.name}</span>
                                <span className="text-sm text-muted-foreground block">
                                  {role?.description}
                                </span>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(selectedOperation.type === 'assign_groups' ||
                      selectedOperation.type === 'remove_groups') && (
                      <div>
                        <Label>{t('bulk.configure.groupsLabel')}</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2 border rounded-md p-3 max-h-48 overflow-y-auto">
                          {groups?.map((group) => (
                            <div key={group?.id} className="flex items-center space-x-2">
                              <Checkbox
                                checked={selectedGroups?.includes(group?.id)}
                                onCheckedChange={(checked: boolean) => {
                                  if (checked) {
                                    setSelectedGroups([...selectedGroups, group?.id])
                                  } else {
                                    setSelectedGroups(
                                      selectedGroups?.filter((id) => id !== group?.id)
                                    )
                                  }
                                }}
                              />
                              <Label className="flex-1 cursor-pointer">
                                <span className="font-medium">{group?.name}</span>
                                <span className="text-sm text-muted-foreground block">
                                  {group?.description}
                                </span>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedOperation.type === 'update_department' && (
                      <div>
                        <Label>{t('bulk.configure.newDepartment')}</Label>
                        <Input
                          value={newDepartment}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setNewDepartment(e?.target?.value)
                          }
                          placeholder={t('bulk.configure.newDepartmentPlaceholder')}
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Switch checked={sendNotification} onCheckedChange={setSendNotification} />
                      <Label>{t('bulk.configure.sendNotification')}</Label>
                    </div>

                    <div>
                      <Label>{t('bulk.configure.reason')}</Label>
                      <Textarea
                        value={operationReason}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setOperationReason(e?.target?.value)
                        }
                        placeholder={t('bulk.configure.reasonPlaceholder')}
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
                  <CardTitle>{t('bulk.review.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-2">{t('bulk.review.selectedOperation')}</h4>
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
                      <h4 className="font-medium mb-2">
                        {t('bulk.review.affectedUsers')} ({selectedUsers.length})
                      </h4>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
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

                    <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                      <p className="font-medium text-warning">⚠️ {t('bulk.review.warning')}</p>
                      <p className="text-sm text-warning mt-1">
                        {t('bulk.review.warningMessagePrefix')} {selectedUsers.length} {t('bulk.review.warningMessageSuffix')}
                        {sendNotification && ` ${t('bulk.review.notificationNote')}`}
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
            {t('common.cancel')}
          </Button>

          <div className="flex gap-2">
            {activeTab === 'select-users' && selectedUsers.length > 0 && (
              <Button type="button" onClick={() => setActiveTab('select-operation')}>
                {t('bulk.actions.nextOperation')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {activeTab === 'select-operation' && selectedOperation && (
              <Button type="button" onClick={() => setActiveTab('configure-operation')}>
                {t('bulk.actions.nextConfigure')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {activeTab === 'configure-operation' && selectedOperation && (
              <Button type="button" onClick={() => setActiveTab('review')}>
                {t('bulk.actions.nextReview')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {activeTab === 'review' && (
              <Button
                type="button"
                onClick={handleBulkOperation}
                disabled={loading}
                variant="destructive"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {t('bulk.actions.processing')}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {t('bulk.actions.confirm')}
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
