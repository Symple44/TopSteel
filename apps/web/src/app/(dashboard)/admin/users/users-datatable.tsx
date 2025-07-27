'use client'

import React, { useState, useEffect } from 'react'
import { DataTable } from '@/components/ui/datatable/DataTable'
import { ColumnConfig } from '@/components/ui/datatable/types'
import { Button, Badge, Avatar, AvatarFallback } from '@erp/ui'
import { UserPlus, Download, Mail, Calendar, Shield, Building, Users, UserCheck, Settings } from 'lucide-react'
import BulkProfileManagement from '@/components/admin/bulk-profile-management'

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

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return 'Jamais'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'Date invalide'
  
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }) + ' (aujourd\'hui)'
  } else if (days === 1) {
    return 'Hier à ' + d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } else if (days < 7) {
    return `Il y a ${days} jours`
  } else {
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }
}

const columns: ColumnConfig<User>[] = [
  {
    id: 'user',
    key: 'firstName',
    title: 'Utilisateur',
    description: 'Informations de l\'utilisateur (nom, prénom, email)',
    type: 'text',
    sortable: true,
    searchable: true,
    locked: true,
    width: 280,
    // Fonction pour extraire la valeur pour le filtrage/tri
    getValue: (row) => {
      const fullName = row.firstName || row.lastName 
        ? `${row.firstName || ''} ${row.lastName || ''}`.trim()
        : 'Utilisateur'
      return `${fullName} ${row.email}`
    },
    render: (_, row) => (
      <div className="flex items-center space-x-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
            {(row.firstName?.[0] || '').toUpperCase()}{(row.lastName?.[0] || '').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-foreground">
            {row.firstName || row.lastName 
              ? `${row.firstName || ''} ${row.lastName || ''}`.trim()
              : 'Utilisateur'
            }
          </p>
          <p className="text-sm text-muted-foreground flex items-center">
            <Mail className="h-3 w-3 mr-1.5 text-muted-foreground" />
            {row.email}
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'roles',
    key: 'roles',
    title: 'Rôles',
    description: 'Rôles assignés à l\'utilisateur',
    type: 'select',
    sortable: true,
    searchable: true,
    width: 200,
    // Options pour le filtrage
    options: [
      { value: 'SUPER_ADMIN', label: 'Super Admin', color: '#dc2626' },
      { value: 'ADMIN', label: 'Admin', color: '#ea580c' },
      { value: 'MANAGER', label: 'Manager', color: '#0ea5e9' },
      { value: 'COMMERCIAL', label: 'Commercial', color: '#10b981' },
      { value: 'TECHNICIEN', label: 'Technicien', color: '#8b5cf6' }
    ],
    // Fonction pour extraire la valeur string pour le filtrage
    getValue: (row) => {
      const roles = Array.isArray(row.roles) ? row.roles : []
      return roles.map(role => role.name).join(', ')
    },
    render: (_, row) => {
      const roles = Array.isArray(row.roles) ? row.roles : []
      return (
        <div className="flex flex-wrap gap-1.5">
          {roles.map((role) => (
            <Badge 
              key={role.id} 
              variant="outline" 
              className="text-xs flex items-center font-medium"
            >
              <Shield className="h-3 w-3 mr-1" />
              {role.name}
            </Badge>
          ))}
          {roles.length === 0 && (
            <span className="text-sm text-muted-foreground">Aucun rôle</span>
          )}
        </div>
      )
    }
  },
  {
    id: 'groups',
    key: 'groups',
    title: 'Groupes',
    description: 'Groupes auxquels l\'utilisateur appartient',
    type: 'text',
    sortable: true,
    searchable: true,
    width: 200,
    // Fonction pour extraire la valeur string pour le filtrage
    getValue: (row) => {
      const groups = Array.isArray(row.groups) ? row.groups : []
      return groups.map(group => group.name).join(', ')
    },
    render: (_, row) => {
      const groups = Array.isArray(row.groups) ? row.groups : []
      return (
        <div className="flex flex-wrap gap-1.5">
          {groups.map((group) => (
            <Badge 
              key={group.id} 
              variant="secondary" 
              className="text-xs flex items-center font-medium"
            >
              <Building className="h-3 w-3 mr-1" />
              {group.name}
            </Badge>
          ))}
          {groups.length === 0 && (
            <span className="text-sm text-muted-foreground">Aucun groupe</span>
          )}
        </div>
      )
    }
  },
  {
    id: 'department',
    key: 'department',
    title: 'Département',
    type: 'text',
    sortable: true,
    searchable: true,
    editable: true,
    width: 150,
    render: (value) => (
      <span className="text-foreground font-medium">{value || <span className="text-muted-foreground">-</span>}</span>
    )
  },
  {
    id: 'lastLogin',
    key: 'lastLogin',
    title: 'Dernière connexion',
    type: 'datetime',
    sortable: true,
    searchable: false,
    width: 180,
    format: {
      dateFormat: 'dd/MM/yyyy HH:mm'
    },
    render: (value) => (
      <div className="flex items-center text-sm">
        <div className="flex items-center space-x-1.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className={value ? "text-foreground font-medium" : "text-muted-foreground"}>
            {formatDate(value)}
          </span>
        </div>
      </div>
    )
  },
  {
    id: 'isActive',
    key: 'isActive',
    title: 'Statut',
    type: 'select',
    sortable: true,
    editable: true,
    width: 100,
    options: [
      { value: true, label: 'Actif', color: '#10b981' },
      { value: false, label: 'Inactif', color: '#6b7280' }
    ],
    render: (value) => (
      <Badge variant={value ? 'default' : 'secondary'}>
        {value ? 'Actif' : 'Inactif'}
      </Badge>
    )
  },
  {
    id: 'createdAt',
    key: 'createdAt',
    title: 'Créé le',
    type: 'datetime',
    sortable: true,
    searchable: false,
    width: 150,
    format: {
      dateFormat: 'dd/MM/yyyy'
    },
    render: (value) => (
      <span className="text-muted-foreground font-medium">{formatDate(value)}</span>
    )
  }
]

interface UsersDataTableProps {
  onUserEdit?: (user: User) => void
  onUserCreate?: () => void
}

export function UsersDataTable({ onUserEdit, onUserCreate }: UsersDataTableProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBulkManagementOpen, setIsBulkManagementOpen] = useState(false)

  // Charger les utilisateurs
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/users?includePermissions=true', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      const data = await response.json()
      
      if (response.ok && data.success && data.data) {
        setUsers(data.data)
      } else {
        setError('Erreur lors du chargement des utilisateurs')
        console.error('Erreur API:', {
          status: response.status,
          statusText: response.statusText,
          data
        })
      }
    } catch (error) {
      setError('Erreur de connexion au serveur')
      console.error('Erreur lors du chargement des utilisateurs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCellEdit = (newValue: any, row: User, column: ColumnConfig<User>) => {
    setUsers(prevData => 
      prevData.map(user => 
        user.id === row.id 
          ? { ...user, [column.key]: newValue }
          : user
      )
    )
    // Ici on pourrait envoyer la mise à jour au serveur
  }

  const handleCreate = () => {
    if (onUserCreate) {
      onUserCreate()
    }
  }

  const handleEdit = (row: User) => {
    if (onUserEdit) {
      onUserEdit(row)
    }
  }

  const handleDelete = (rows: User[]) => {
    const idsToDelete = rows.map(row => row.id)
    setUsers(users.filter(user => !idsToDelete.includes(user.id)))
    // Ici on pourrait envoyer la suppression au serveur
  }

  const exportUsers = () => {
    const headers = ['Email', 'Nom', 'Prénom', 'Département', 'Statut', 'Rôles', 'Groupes', 'Dernière connexion']
    const rows = users.map(user => [
      user.email,
      user.lastName || '',
      user.firstName || '',
      user.department || '',
      user.isActive ? 'Actif' : 'Inactif',
      user.roles.map(r => r.name).join(', '),
      user.groups.map(g => g.name).join(', '),
      formatDate(user.lastLogin)
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

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground/80 text-lg">
            Vue complète des utilisateurs avec DataTable avancé
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={exportUsers}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" onClick={() => setIsBulkManagementOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Gestion en masse
          </Button>
          <Button onClick={handleCreate}>
            <UserPlus className="h-4 w-4 mr-2" />
            Nouvel utilisateur
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total utilisateurs</h3>
              <p className="text-3xl font-bold text-foreground">{users.length}</p>
            </div>
            <div className="p-3 bg-primary rounded-lg">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Utilisateurs actifs</h3>
              <p className="text-3xl font-bold text-foreground">{users.filter(u => u.isActive).length}</p>
            </div>
            <div className="p-3 bg-primary rounded-lg">
              <UserCheck className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Avec rôles</h3>
              <p className="text-3xl font-bold text-foreground">{users.filter(u => u.roles.length > 0).length}</p>
            </div>
            <div className="p-3 bg-secondary rounded-lg">
              <Shield className="h-6 w-6 text-secondary-foreground" />
            </div>
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Avec groupes</h3>
              <p className="text-3xl font-bold text-foreground">{users.filter(u => u.groups.length > 0).length}</p>
            </div>
            <div className="p-3 bg-secondary rounded-lg">
              <Building className="h-6 w-6 text-secondary-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        data={users}
        columns={columns}
        keyField="id"
        tableId="admin-users"
        editable
        selectable
        sortable
        searchable
        filterable
        height={600}
        actions={{
          create: handleCreate,
          edit: handleEdit,
          delete: handleDelete
        }}
        onCellEdit={handleCellEdit}
        onRowDoubleClick={handleEdit}
        loading={loading}
        error={error}
        className="border rounded-lg"
      />

      {/* Dialog de gestion en masse */}
      <BulkProfileManagement
        isOpen={isBulkManagementOpen}
        onClose={() => setIsBulkManagementOpen(false)}
        onComplete={() => {
          loadUsers()
        }}
      />
    </div>
  )
}