'use client'

export const dynamic = 'force-dynamic'

import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  PageContainer,
  PageGrid,
  PageSection,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  useFormFieldIds,
} from '@erp/ui'
import { Building, Calendar, Mail, Phone, Shield, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AdminGuard } from '../../../../components/auth/admin-guard'
import { useTranslation } from '../../../../lib/i18n/hooks'
import type { User } from '../../../../types/auth'
import { callClientApi } from '../../../../utils/backend-api'
import { UsersDataTable } from './users-datatable'

export default function UsersManagementPage() {
  const router = useRouter()
  const { t } = useTranslation('admin')
  const [selectedUser] = useState<User | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUserEdit = (user: { id: string }) => {
    router?.push(`/admin/users/${user.id}`)
  }

  const handleUserCreate = () => {
    setIsCreateDialogOpen(true)
  }

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false)
    // Trigger refresh of the users list
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <AdminGuard
      requiredRoles={['SUPER_ADMIN', 'ADMIN']}
      requiredPermissions={['USER_VIEW']}
      showUnauthorized={true}
    >
      <PageContainer maxWidth="full" padding="default">
        <PageSection spacing="default">
          <UsersDataTable key={refreshKey} onUserEdit={handleUserEdit} onUserCreate={handleUserCreate} />
        </PageSection>
      </PageContainer>

      {/* User details dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedUser && (
            <>
              <DialogHeader className="pb-6 border-b border-border/50">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                      {(selectedUser.firstName?.[0] || '').toUpperCase()}
                      {(selectedUser.lastName?.[0] || '').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-xl">
                      {selectedUser.firstName || selectedUser.lastName
                        ? `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim()
                        : t('users.user')}
                    </DialogTitle>
                    <DialogDescription asChild>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedUser.email}</span>
                      </div>
                    </DialogDescription>
                  </div>
                  <Badge variant={selectedUser.isActive ? 'default' : 'secondary'}>
                    {selectedUser.isActive ? t('users.active') : t('users.inactive')}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="py-6 space-y-6">
                {/* Informations générales */}
                <Card>
                  <CardHeader className="pb-3">
                    <h3 className="text-lg font-semibold">{t('users.generalInfo')}</h3>
                  </CardHeader>
                  <CardContent>
                    <PageGrid cols={2}>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {selectedUser.email}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{t('users.phone')}</p>
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {selectedUser.phone || t('users.notSpecified')}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{t('users.department')}</p>
                        <p className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {selectedUser.department || t('users.notSpecified')}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{t('users.lastLogin')}</p>
                        <p className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {selectedUser.lastLogin
                            ? new Date(selectedUser.lastLogin).toLocaleDateString('fr-FR')
                            : t('users.never')}
                        </p>
                      </div>
                    </PageGrid>
                  </CardContent>
                </Card>

                {/* Rôles et groupes */}
                <PageGrid cols={2}>
                  <Card>
                    <CardHeader className="pb-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        {t('users.rolesCount', { count: selectedUser.roles?.length ?? 0 })}
                      </h3>
                    </CardHeader>
                    <CardContent>
                      {selectedUser.roles && selectedUser?.roles?.length > 0 ? (
                        <div className="space-y-2">
                          {selectedUser?.roles?.map((role) => (
                            <div
                              key={role.id}
                              className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10"
                            >
                              <div>
                                <p className="font-medium">{role.name}</p>
                                <p className="text-sm text-muted-foreground">{role.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          {t('users.noRolesAssigned')}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Building className="h-5 w-5 text-purple-600" />
                        {t('users.groupsCount', { count: selectedUser.groups?.length ?? 0 })}
                      </h3>
                    </CardHeader>
                    <CardContent>
                      {selectedUser.groups && selectedUser?.groups?.length > 0 ? (
                        <div className="space-y-2">
                          {selectedUser?.groups?.map((group) => (
                            <div
                              key={group.id}
                              className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800/30"
                            >
                              <div>
                                <p className="font-medium">{group.name}</p>
                                <p className="text-sm text-muted-foreground">{group.type}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          {t('users.noGroupsAssigned')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </PageGrid>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('users.newUser')}</DialogTitle>
            <DialogDescription>
              {t('users.userManagementDescription')}
            </DialogDescription>
          </DialogHeader>
          <UserForm onSuccess={handleCreateSuccess} />
        </DialogContent>
      </Dialog>
    </AdminGuard>
  )
}

// User Form Component for creating users
function UserForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation('admin')
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role: 'OPERATEUR',
    actif: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fieldIds = useFormFieldIds(['nom', 'prenom', 'email', 'password', 'role', 'actif'])

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await callClientApi('admin/users', {
        method: 'POST',
        body: JSON.stringify(formData),
      })

      const data = await response?.json()

      if (response?.ok && data?.success) {
        onSuccess()
      } else {
        setError(data?.message || 'Error creating user')
      }
    } catch (err) {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={fieldIds.prenom}>{t('users.exportHeaders.firstName')}</Label>
          <Input
            id={fieldIds.prenom}
            value={formData.prenom}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({ ...prev, prenom: e?.target?.value }))
            }
            placeholder="John"
            required
          />
        </div>

        <div>
          <Label htmlFor={fieldIds.nom}>{t('users.exportHeaders.lastName')}</Label>
          <Input
            id={fieldIds.nom}
            value={formData.nom}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({ ...prev, nom: e?.target?.value }))
            }
            placeholder="Doe"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor={fieldIds.email}>{t('users.exportHeaders.email')}</Label>
        <Input
          id={fieldIds.email}
          type="email"
          value={formData.email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, email: e?.target?.value }))
          }
          placeholder="john.doe@example.com"
          required
        />
      </div>

      <div>
        <Label htmlFor={fieldIds.password}>{t('database.password')}</Label>
        <Input
          id={fieldIds.password}
          type="password"
          value={formData.password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev) => ({ ...prev, password: e?.target?.value }))
          }
          placeholder="••••••••"
          required
          minLength={8}
        />
        <p className="text-xs text-muted-foreground mt-1">Minimum 8 characters</p>
      </div>

      <div>
        <Label htmlFor={fieldIds.role}>{t('users.exportHeaders.roles')}</Label>
        <Select
          value={formData.role}
          onValueChange={(value: string) => setFormData((prev) => ({ ...prev, role: value }))}
        >
          <SelectTrigger id={fieldIds.role}>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OPERATEUR">Opérateur</SelectItem>
            <SelectItem value="TECHNICIEN">Technicien</SelectItem>
            <SelectItem value="COMMERCIAL">Commercial</SelectItem>
            <SelectItem value="MANAGER">Manager</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id={fieldIds.actif}
          checked={formData.actif}
          onCheckedChange={(checked: boolean) =>
            setFormData((prev) => ({ ...prev, actif: checked }))
          }
        />
        <Label htmlFor={fieldIds.actif}>{t('users.active')}</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? t('common.loading') : t('users.actions.create')}
        </Button>
      </div>
    </form>
  )
}
