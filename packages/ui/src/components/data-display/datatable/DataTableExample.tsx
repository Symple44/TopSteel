'use client'

/**
 * Exemple d'utilisation du DataTable refactorisé
 */

import React from 'react'
import { DataTable } from './DataTableV2'
import type { ColumnConfig } from './types'
import { Edit, Trash, Eye } from 'lucide-react'

// Type des données d'exemple
interface User {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'inactive' | 'pending'
  createdAt: Date
  credits: number
}

// Données d'exemple
const sampleData: User[] = [
  {
    id: 1,
    name: 'Jean Dupont',
    email: 'jean.dupont@example.com',
    role: 'Admin',
    status: 'active',
    createdAt: new Date('2024-01-15'),
    credits: 1250.50,
  },
  {
    id: 2,
    name: 'Marie Martin',
    email: 'marie.martin@example.com',
    role: 'User',
    status: 'active',
    createdAt: new Date('2024-02-20'),
    credits: 500.00,
  },
  {
    id: 3,
    name: 'Pierre Bernard',
    email: 'pierre.bernard@example.com',
    role: 'Manager',
    status: 'pending',
    createdAt: new Date('2024-03-10'),
    credits: 750.25,
  },
]

// Configuration des colonnes
const columns: ColumnConfig<User>[] = [
  {
    id: 'name',
    key: 'name',
    title: 'Nom',
    type: 'text',
    sortable: true,
    searchable: true,
    editable: true,
  },
  {
    id: 'email',
    key: 'email',
    title: 'Email',
    type: 'text',
    sortable: true,
    searchable: true,
  },
  {
    id: 'role',
    key: 'role',
    title: 'Rôle',
    type: 'select',
    sortable: true,
    editable: true,
    options: [
      { value: 'Admin', label: 'Administrateur' },
      { value: 'Manager', label: 'Gestionnaire' },
      { value: 'User', label: 'Utilisateur' },
    ],
  },
  {
    id: 'status',
    key: 'status',
    title: 'Statut',
    type: 'select',
    sortable: true,
    options: [
      { value: 'active', label: 'Actif', color: '#10b981' },
      { value: 'inactive', label: 'Inactif', color: '#ef4444' },
      { value: 'pending', label: 'En attente', color: '#f59e0b' },
    ],
  },
  {
    id: 'credits',
    key: 'credits',
    title: 'Crédits',
    type: 'number',
    sortable: true,
    format: {
      decimals: 2,
      prefix: '€ ',
    },
  },
  {
    id: 'createdAt',
    key: 'createdAt',
    title: 'Date de création',
    type: 'date',
    sortable: true,
  },
]

/**
 * Composant d'exemple montrant l'utilisation du DataTable
 */
export function DataTableExample() {
  const [data, setData] = React.useState(sampleData)
  const [selectedRows, setSelectedRows] = React.useState<Set<string | number>>(new Set())

  // Actions sur les lignes
  const actions = [
    {
      label: 'Voir',
      icon: <Eye className="h-4 w-4" />,
      onClick: (row: User) => {
        console.log('Voir:', row)
      },
    },
    {
      label: 'Modifier',
      icon: <Edit className="h-4 w-4" />,
      onClick: (row: User) => {
        console.log('Modifier:', row)
      },
    },
    {
      label: 'Supprimer',
      icon: <Trash className="h-4 w-4" />,
      variant: 'destructive' as const,
      onClick: (row: User) => {
        setData(prev => prev.filter(u => u.id !== row.id))
      },
      separator: true,
    },
  ]

  // Gestion de l'édition de cellule
  const handleCellEdit = (row: User, column: ColumnConfig<User>, value: any) => {
    console.log('Edit:', { row, column, value })
    setData(prev => 
      prev.map(u => 
        u.id === row.id 
          ? { ...u, [column.key]: value }
          : u
      )
    )
  }

  // Gestion de la sélection
  const handleSelectionChange = (selection: any) => {
    setSelectedRows(selection.selectedRows)
    console.log('Selection:', selection)
  }

  // Ajout d'un nouvel utilisateur
  const handleAddNew = () => {
    const newUser: User = {
      id: Math.max(...data.map(u => u.id)) + 1,
      name: 'Nouvel utilisateur',
      email: 'nouveau@example.com',
      role: 'User',
      status: 'pending',
      createdAt: new Date(),
      credits: 0,
    }
    setData(prev => [...prev, newUser])
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Exemple DataTable Refactorisé</h1>
      
      {/* Affichage des lignes sélectionnées */}
      {selectedRows.size > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm">
            {selectedRows.size} ligne(s) sélectionnée(s): {Array.from(selectedRows).join(', ')}
          </p>
        </div>
      )}

      {/* DataTable */}
      <DataTable
        title="Gestion des utilisateurs"
        data={data}
        columns={columns}
        keyField="id"
        
        // Fonctionnalités activées
        sortable={true}
        filterable={true}
        searchable={true}
        selectable={true}
        editable={true}
        exportable={true}
        pagination={{
          page: 1,
          pageSize: 10,
          total: data.length,
        }}
        
        // Apparence
        striped={true}
        bordered={true}
        hoverable={true}
        height="600px"
        
        // Actions et callbacks
        actions={actions}
        onAddNew={handleAddNew}
        onCellEdit={handleCellEdit}
        onSelectionChange={handleSelectionChange}
        onRowClick={(row) => console.log('Row clicked:', row)}
        onRowDoubleClick={(row) => console.log('Row double-clicked:', row)}
        
        // Pour la persistance des paramètres
        tableId="users-table"
      />

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Fonctionnalités disponibles:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
          <li>✅ Tri des colonnes (cliquer sur l'en-tête)</li>
          <li>✅ Recherche globale</li>
          <li>✅ Filtres par colonne</li>
          <li>✅ Sélection multiple</li>
          <li>✅ Édition inline (double-clic sur une cellule éditable)</li>
          <li>✅ Export CSV/Excel/JSON</li>
          <li>✅ Pagination</li>
          <li>✅ Actions sur les lignes</li>
          <li>✅ Colonnes redimensionnables et réorganisables</li>
          <li>✅ Sauvegarde des préférences utilisateur</li>
        </ul>
      </div>
    </div>
  )
}