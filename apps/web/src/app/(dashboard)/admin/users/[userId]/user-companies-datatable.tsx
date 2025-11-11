'use client'

import type { ColumnConfig } from '@erp/ui'
import {
  Badge,
  Button,
  Checkbox,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@erp/ui'
import { Building, MapPin, Save, Settings } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from '../../../../../hooks/use-toast'
import { apiClient } from '../../../../../lib/api-client'
import { postTyped } from '../../../../../lib/api-typed'

interface CompanyAccess extends Record<string, unknown> {
  id: string
  societeId: string
  societe: {
    id: string
    nom: string
    code: string
    ville: string
    isActive: boolean
  }
  userId: string
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'USER' | 'VIEWER' | 'GUEST'
  permissions: string[]
  restrictedPermissions: string[]
  allowedSiteIds: string[]
  isActive: boolean
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

interface Props {
  userId: string
}

const roleOptions = [
  { value: 'OWNER', label: 'Propriétaire', color: 'bg-red-100 text-red-800' },
  { value: 'ADMIN', label: 'Administrateur', color: 'bg-orange-100 text-orange-800' },
  { value: 'MANAGER', label: 'Manager', color: 'bg-blue-100 text-blue-800' },
  { value: 'USER', label: 'Utilisateur', color: 'bg-green-100 text-green-800' },
  { value: 'VIEWER', label: 'Observateur', color: 'bg-purple-100 text-purple-800' },
  { value: 'GUEST', label: 'Invité', color: 'bg-gray-100 text-gray-800' },
]

const availablePermissions = [
  { value: 'COMPANY_VIEW', label: 'Voir la société', category: 'Société' },
  { value: 'COMPANY_EDIT', label: 'Modifier la société', category: 'Société' },
  { value: 'COMPANY_DELETE', label: 'Supprimer la société', category: 'Société' },
  { value: 'USER_VIEW', label: 'Voir les utilisateurs', category: 'Utilisateurs' },
  { value: 'USER_EDIT', label: 'Modifier les utilisateurs', category: 'Utilisateurs' },
  { value: 'USER_DELETE', label: 'Supprimer les utilisateurs', category: 'Utilisateurs' },
  { value: 'PROJECT_VIEW', label: 'Voir les projets', category: 'Projets' },
  { value: 'PROJECT_EDIT', label: 'Modifier les projets', category: 'Projets' },
  { value: 'PROJECT_DELETE', label: 'Supprimer les projets', category: 'Projets' },
  { value: 'INVOICE_VIEW', label: 'Voir les factures', category: 'Facturation' },
  { value: 'INVOICE_EDIT', label: 'Modifier les factures', category: 'Facturation' },
  { value: 'INVOICE_DELETE', label: 'Supprimer les factures', category: 'Facturation' },
]

export function UserCompaniesDataTable({ userId }: Props) {
  const [data, setData] = useState<CompanyAccess[]>([])
  const [loading, setLoading] = useState(true)
  const [_allCompanies, setAllCompanies] = useState<{ id: string; name: string }[]>([])
  const [selectedCompany, setSelectedCompany] = useState<CompanyAccess | null>(null)
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)
  const [editingPermissions, setEditingPermissions] = useState<string[]>([])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      // Charger les accès actuels de l'utilisateur
      const userAccessResponse = await apiClient.get<CompanyAccess[]>(
        `/societes/users/${userId}/companies`
      )
      const userAccess = userAccessResponse ?? []

      // Charger toutes les sociétés
      const societesResponse = await apiClient.get<{ id: string; name: string }[]>('/societes')
      const allSocietes = societesResponse ?? []

      // Créer une entrée pour chaque société (même sans accès)
      const fullData = allSocietes?.map((societe) => {
        const existingAccess = userAccess?.find((access) => access.societeId === societe.id)
        if (existingAccess) {
          return existingAccess
        } else {
          // Créer un accès vide pour les sociétés sans accès
          return {
            id: `new-${societe.id}`,
            societeId: societe.id,
            societe: {
              id: societe.id,
              nom: societe.name,
              code: '',
              ville: '',
              isActive: true,
            },
            userId: userId,
            role: 'GUEST' as const,
            permissions: [],
            restrictedPermissions: [],
            allowedSiteIds: [],
            isActive: false,
            isDefault: false,
            createdAt: '',
            updatedAt: '',
          }
        }
      })

      setAllCompanies(allSocietes)
      setData(fullData)
    } catch (_error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les sociétés',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRoleChange = async (companyAccess: CompanyAccess, newRole: string) => {
    try {
      if (companyAccess?.id?.startsWith('new-')) {
        // Créer un nouvel accès
        await postTyped(`/societes/${companyAccess.societeId}/users`, {
          userId: userId,
          role: newRole,
          isActive: true,
        })
      } else {
        // Mettre à jour l'accès existant
        await apiClient?.patch(`/societes/users/${companyAccess.id}`, {
          role: newRole,
        })
      }

      toast({
        title: 'Succès',
        description: 'Le rôle a été mis à jour',
      })

      await loadData()
    } catch (_error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le rôle',
        variant: 'destructive',
      })
    }
  }

  const _handleActiveToggle = async (companyAccess: CompanyAccess) => {
    try {
      if (companyAccess?.id?.startsWith('new-')) {
        // Créer un nouvel accès actif
        await postTyped(`/societes/${companyAccess.societeId}/users`, {
          userId: userId,
          role: 'USER',
          isActive: true,
        })
      } else {
        // Toggle l'état actif
        await apiClient?.patch(`/societes/users/${companyAccess.id}`, {
          isActive: !companyAccess.isActive,
        })
      }

      toast({
        title: 'Succès',
        description: companyAccess.isActive ? 'Accès désactivé' : 'Accès activé',
      })

      await loadData()
    } catch (_error) {
      toast({
        title: 'Erreur',
        description: "Impossible de mettre à jour l'accès",
        variant: 'destructive',
      })
    }
  }

  const handleDefaultToggle = async (companyAccess: CompanyAccess) => {
    try {
      await postTyped(`/societes/users/${userId}/default-societe`, {
        societeId: companyAccess.societeId,
      })

      toast({
        title: 'Succès',
        description: 'Société par défaut mise à jour',
      })

      await loadData()
    } catch (_error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la société par défaut',
        variant: 'destructive',
      })
    }
  }

  const openPermissionsDialog = (companyAccess: CompanyAccess) => {
    setSelectedCompany(companyAccess)
    setEditingPermissions(companyAccess.permissions || [])
    setIsPermissionsDialogOpen(true)
  }

  const handleSavePermissions = async () => {
    if (!selectedCompany) return

    try {
      if (selectedCompany?.id?.startsWith('new-')) {
        // Créer un nouvel accès avec permissions
        await postTyped(`/societes/${selectedCompany.societeId}/users`, {
          userId: userId,
          role: selectedCompany.role || 'USER',
          permissions: editingPermissions,
          isActive: true,
        })
      } else {
        // Mettre à jour les permissions
        await apiClient?.patch(`/societes/users/${selectedCompany.id}/permissions`, {
          permissions: editingPermissions,
        })
      }

      toast({
        title: 'Succès',
        description: 'Les permissions ont été mises à jour',
      })

      setIsPermissionsDialogOpen(false)
      await loadData()
    } catch (_error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour les permissions',
        variant: 'destructive',
      })
    }
  }

  const columns: ColumnConfig<CompanyAccess>[] = [
    {
      id: 'societe',
      key: 'societe.nom',
      title: 'Société',
      type: 'text',
      sortable: true,
      width: 250,
      render: (_value: unknown, row: CompanyAccess, _column: ColumnConfig<CompanyAccess>) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Building className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{row?.societe?.nom}</p>
            <p className="text-sm text-gray-500 flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              {row?.societe?.ville || 'Non renseigné'}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      key: 'isActive',
      title: 'Statut',
      type: 'text',
      width: 120,
      render: (_value: unknown, row: CompanyAccess, _column: ColumnConfig<CompanyAccess>) => (
        <Badge
          variant={row.isActive ? 'default' : 'secondary'}
          className={row.isActive ? 'bg-green-600' : ''}
        >
          {row.isActive ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      id: 'role',
      key: 'role',
      title: 'Rôle',
      type: 'select',
      sortable: true,
      options: roleOptions,
      width: 180,
      render: (_value: unknown, row: CompanyAccess, _column: ColumnConfig<CompanyAccess>) => (
        <Select
          value={row.role}
          onValueChange={(value: string) => handleRoleChange(row, value)}
          disabled={!row.isActive}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roleOptions?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${option.color}`}>
                  {option.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      id: 'permissions',
      key: 'permissions',
      title: 'Permissions',
      type: 'text',
      width: 200,
      render: (_value: unknown, row: CompanyAccess, _column: ColumnConfig<CompanyAccess>) => (
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {row?.permissions?.length} permissions
          </Badge>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => openPermissionsDialog(row)}
            disabled={!row.isActive}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
    {
      id: 'isDefault',
      key: 'isDefault',
      title: 'Par défaut',
      type: 'boolean',
      width: 120,
      render: (_value: unknown, row: CompanyAccess, _column: ColumnConfig<CompanyAccess>) => (
        <Switch
          checked={row.isDefault}
          onCheckedChange={() => handleDefaultToggle(row)}
          disabled={!row.isActive}
          className="data-[state=checked]:bg-blue-600"
        />
      ),
    },
    {
      id: 'lastAccess',
      key: 'updatedAt',
      title: 'Dernier accès',
      type: 'date',
      sortable: true,
      width: 150,
      render: (_value: unknown, row: CompanyAccess, _column: ColumnConfig<CompanyAccess>) => {
        if (!row.updatedAt || row?.id?.startsWith('new-')) {
          return <span className="text-gray-400">Jamais</span>
        }
        return new Date(row.updatedAt).toLocaleDateString('fr-FR')
      },
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        searchable={true}
        keyField="id"
        className="border rounded-lg"
      />

      {/* Dialog des permissions */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gérer les permissions pour {selectedCompany?.societe.nom}</DialogTitle>
            <DialogDescription>
              Sélectionnez les permissions spécifiques pour cette société
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {Object.entries(
              availablePermissions?.reduce(
                (acc, perm) => {
                  if (!acc[perm.category]) acc[perm.category] = []
                  acc?.[perm.category]?.push(perm)
                  return acc
                },
                {} as Record<string, typeof availablePermissions>
              )
            ).map(([category, perms]) => (
              <div key={category}>
                <h4 className="font-medium text-gray-900 mb-3">{category}</h4>
                <div className="space-y-2">
                  {perms?.map((perm) => (
                    <Label
                      key={perm.value}
                      className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50"
                    >
                      <Checkbox
                        checked={editingPermissions?.includes(perm.value)}
                        onCheckedChange={(checked: boolean) => {
                          if (checked) {
                            setEditingPermissions([...editingPermissions, perm.value])
                          } else {
                            setEditingPermissions(
                              editingPermissions?.filter((p) => p !== perm.value)
                            )
                          }
                        }}
                      />
                      <span className="text-sm">{perm.label}</span>
                    </Label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPermissionsDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button type="button" onClick={handleSavePermissions}>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
