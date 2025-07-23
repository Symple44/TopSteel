'use client'

import { useState } from 'react'
import { AdminGuard } from '@/components/auth/admin-guard'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  Card, 
  CardContent, 
  CardHeader, 
  Badge, 
  Avatar, 
  AvatarFallback 
} from '@erp/ui'
import { Mail, Phone, Calendar, Shield, Building } from 'lucide-react'
import { UsersDataTable } from './users-datatable'
export default function UsersManagementPage() {
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const handleUserEdit = (user: any) => {
    console.log('Ouverture du modal pour:', user) // Debug
    setSelectedUser(user)
    setIsDetailOpen(true)
  }

  const handleUserCreate = () => {
    // TODO: Implémenter la création d'utilisateur
    console.log('Créer un nouvel utilisateur')
  }

  return (
    <AdminGuard 
      requiredRoles={['SUPER_ADMIN', 'ADMIN']}
      requiredPermissions={['USER_VIEW']}
      showUnauthorized={true}
    >
      <UsersDataTable 
        onUserEdit={handleUserEdit}
        onUserCreate={handleUserCreate}
      />
      
      {/* Dialog pour les détails utilisateur */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          {selectedUser && (
            <>
              <DialogHeader className="pb-6 border-b">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-lg font-semibold">
                      {(selectedUser.firstName?.[0] || '').toUpperCase()}
                      {(selectedUser.lastName?.[0] || '').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <DialogTitle className="text-xl text-gray-900">
                      {selectedUser.firstName || selectedUser.lastName 
                        ? `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim()
                        : 'Utilisateur'
                      }
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 flex items-center mt-1">
                      <Mail className="h-4 w-4 mr-2" />
                      {selectedUser.email}
                    </DialogDescription>
                  </div>
                  <Badge 
                    variant={selectedUser.isActive ? 'default' : 'secondary'}
                    className={selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                  >
                    {selectedUser.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </DialogHeader>
              
              <div className="py-6 space-y-6">
                {/* Informations générales */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-gray-900">Informations générales</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="text-gray-900 flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {selectedUser.email}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">Téléphone</p>
                        <p className="text-gray-900 flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {selectedUser.phone || 'Non renseigné'}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">Département</p>
                        <p className="text-gray-900 flex items-center">
                          <Building className="h-4 w-4 mr-2 text-gray-400" />
                          {selectedUser.department || 'Non renseigné'}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">Dernière connexion</p>
                        <p className="text-gray-900 flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString('fr-FR') : 'Jamais'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Rôles et permissions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Shield className="h-5 w-5 mr-2 text-blue-600" />
                        Rôles ({selectedUser.roles?.length || 0})
                      </h3>
                    </CardHeader>
                    <CardContent>
                      {selectedUser.roles && selectedUser.roles.length > 0 ? (
                        <div className="space-y-3">
                          {selectedUser.roles.map((role: any) => (
                            <div key={role.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                              <div>
                                <p className="font-medium text-blue-900">{role.name}</p>
                                <p className="text-sm text-blue-600">{role.description}</p>
                              </div>
                              <Badge variant="outline" className="bg-white border-blue-200 text-blue-700">
                                Rôle
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-4">Aucun rôle assigné</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Building className="h-5 w-5 mr-2 text-purple-600" />
                        Groupes ({selectedUser.groups?.length || 0})
                      </h3>
                    </CardHeader>
                    <CardContent>
                      {selectedUser.groups && selectedUser.groups.length > 0 ? (
                        <div className="space-y-3">
                          {selectedUser.groups.map((group: any) => (
                            <div key={group.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                              <div>
                                <p className="font-medium text-purple-900">{group.name}</p>
                                <p className="text-sm text-purple-600">{group.type}</p>
                              </div>
                              <Badge variant="outline" className="bg-white border-purple-200 text-purple-700">
                                Groupe
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 py-4">Aucun groupe assigné</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminGuard>
  )
}