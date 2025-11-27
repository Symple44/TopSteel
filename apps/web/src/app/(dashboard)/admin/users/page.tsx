'use client'

export const dynamic = 'force-dynamic'

import {
  Avatar,
  AvatarFallback,
  Badge,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  PageContainer,
  PageGrid,
  PageSection,
} from '@erp/ui'
import { Building, Calendar, Mail, Phone, Shield, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AdminGuard } from '../../../../components/auth/admin-guard'
import { useTranslation } from '../../../../lib/i18n/hooks'
import type { User } from '../../../../types/auth'
import { UsersDataTable } from './users-datatable'

export default function UsersManagementPage() {
  const router = useRouter()
  const { t } = useTranslation('admin')
  const [selectedUser] = useState<User | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const handleUserEdit = (user: { id: string }) => {
    router?.push(`/admin/users/${user.id}`)
  }

  const handleUserCreate = () => {}

  return (
    <AdminGuard
      requiredRoles={['SUPER_ADMIN', 'ADMIN']}
      requiredPermissions={['USER_VIEW']}
      showUnauthorized={true}
    >
      <PageContainer maxWidth="full" padding="default">
        <PageSection spacing="none">
          <UsersDataTable onUserEdit={handleUserEdit} onUserCreate={handleUserCreate} />
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
    </AdminGuard>
  )
}
