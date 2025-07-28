'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AdminGuard } from '@/components/auth/admin-guard'
import { apiClient } from '@/lib/api-client'
import { toast } from '@/hooks/use-toast'
import { useTranslation } from '@/lib/i18n/hooks'
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle,
  Badge,
  Avatar,
  AvatarFallback,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@erp/ui'
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Building,
  Shield,
  Save,
  RefreshCw,
  Users,
  Calendar
} from 'lucide-react'
import { UserCompaniesDataTable } from './user-companies-datatable'
import BulkOperationsHistory from '@/components/admin/bulk-operations-history'

interface UserDetails {
  id: string
  email: string
  firstName?: string
  lastName?: string
  acronym?: string
  phone?: string
  department?: string
  isActive: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
  roles: Array<{
    id: string
    name: string
    description: string
  }>
  groups: Array<{
    id: string
    name: string
    type: string
  }>
}

export default function UserDetailsPage() {
  const { t } = useTranslation('admin')
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string
  
  const [user, setUser] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    loadUserDetails()
  }, [userId])

  const loadUserDetails = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get<UserDetails>(`/admin/users/${userId}`)
      setUser(response)
    } catch (error) {
      console.error('Erreur lors du chargement des détails utilisateur:', error)
      toast({
        title: t('common.error'),
        description: t('users.loadingError'),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/admin/users')
  }

  const handleRefresh = () => {
    loadUserDetails()
  }

  if (loading) {
    return (
      <AdminGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']} requiredPermissions={['USER_VIEW']}>
        <div className="space-y-6">
          <div className="animate-pulse bg-gray-200 h-20 w-full rounded" />
          <div className="animate-pulse bg-gray-200 h-96 w-full rounded" />
        </div>
      </AdminGuard>
    )
  }

  if (!user) {
    return (
      <AdminGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']} requiredPermissions={['USER_VIEW']}>
        <div className="text-center py-12">
          <p className="text-gray-500">{t('users.userNotFound')}</p>
          <Button onClick={handleBack} className="mt-4">
            {t('common.back')}
          </Button>
        </div>
      </AdminGuard>
    )
  }

  return (
    <AdminGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']} requiredPermissions={['USER_VIEW']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="hover:bg-gray-100"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                    {(user.firstName?.[0] || '').toUpperCase()}
                    {(user.lastName?.[0] || '').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {user.firstName || user.lastName 
                      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                      : t('users.user')
                    }
                  </h1>
                  <p className="text-sm text-gray-600 flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    {user.email}
                  </p>
                </div>
                
                <Badge 
                  variant={user.isActive ? 'default' : 'secondary'}
                  className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                >
                  {user.isActive ? t('users.active') : t('users.inactive')}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('users.refresh')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="general" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              {t('users.generalInfo')}
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex items-center">
              <Building className="h-4 w-4 mr-2" />
              {t('users.companiesAndRights')}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              {t('users.modificationHistory')}
            </TabsTrigger>
          </TabsList>

          {/* Tab: Informations générales */}
          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('users.personalInfo')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t('users.fullName')}</p>
                    <p className="text-gray-900">
                      {user.firstName || user.lastName 
                        ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                        : t('users.notProvided')
                      }
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t('users.email')}</p>
                    <p className="text-gray-900 flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {user.email}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t('users.phone')}</p>
                    <p className="text-gray-900 flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {user.phone || t('users.notProvided')}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t('users.department')}</p>
                    <p className="text-gray-900 flex items-center">
                      <Building className="h-4 w-4 mr-2 text-gray-400" />
                      {user.department || t('users.notProvided')}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t('users.lastConnection')}</p>
                    <p className="text-gray-900 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {user.lastLogin 
                        ? new Date(user.lastLogin).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : t('users.never')
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-blue-600" />
                      {t('users.globalRoles')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {user.roles && user.roles.length > 0 ? (
                      <div className="space-y-2">
                        {user.roles.map((role) => (
                          <div key={role.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div>
                              <p className="font-medium text-blue-900">{role.name}</p>
                              <p className="text-sm text-blue-600">{role.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-4">{t('users.noGlobalRoles')}</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Users className="h-5 w-5 mr-2 text-purple-600" />
                      {t('users.groups')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {user.groups && user.groups.length > 0 ? (
                      <div className="space-y-2">
                        {user.groups.map((group) => (
                          <div key={group.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                            <div>
                              <p className="font-medium text-purple-900">{group.name}</p>
                              <p className="text-sm text-purple-600">{group.type}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-4">{t('users.noGroupsAssigned')}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Sociétés et droits */}
          <TabsContent value="companies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('users.rightsManagement')}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {t('users.rightsManagementDescription')}
                </p>
              </CardHeader>
              <CardContent>
                <UserCompaniesDataTable userId={userId} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Historique des modifications */}
          <TabsContent value="history" className="space-y-6">
            <BulkOperationsHistory userId={userId} limit={50} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminGuard>
  )
}