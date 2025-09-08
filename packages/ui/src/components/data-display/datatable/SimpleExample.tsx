'use client'

import type { ColumnConfig } from './types'

// Interface des données d'exemple
interface SimpleEmployee {
  id: number
  nom: string
  poste: string
  salaire: number
  actif: boolean
}

// Données d'exemple
const sampleData: SimpleEmployee[] = [
  { id: 1, nom: 'Jean Dupont', poste: 'Développeur', salaire: 45000, actif: true },
  { id: 2, nom: 'Marie Martin', poste: 'Designer', salaire: 42000, actif: true },
  { id: 3, nom: 'Pierre Durand', poste: 'Manager', salaire: 55000, actif: false },
]

// Configuration simple des colonnes
const _simpleColumns: ColumnConfig<SimpleEmployee>[] = [
  {
    id: 'nom',
    key: 'nom',
    title: 'Nom',
    type: 'text',
    width: 200,
    editable: true,
    required: true,
    validation: {
      minLength: 2,
      maxLength: 50,
    },
  },
  {
    id: 'poste',
    key: 'poste',
    title: 'Poste',
    type: 'select',
    width: 150,
    editable: true,
    options: [
      { value: 'Développeur', label: 'Développeur', color: '#3b82f6' },
      { value: 'Designer', label: 'Designer', color: '#8b5cf6' },
      { value: 'Manager', label: 'Manager', color: '#ef4444' },
      { value: 'Analyste', label: 'Analyste', color: '#10b981' },
    ],
  },
  {
    id: 'salaire',
    key: 'salaire',
    title: 'Salaire',
    type: 'number',
    width: 120,
    editable: true,
    validation: {
      min: 20000,
      max: 100000,
    },
    format: {
      currency: 'EUR',
    },
    render: (value) => {
      if (typeof value === 'number') {
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
        }).format(value)
      }
      return String(value || 0)
    },
  },
  {
    id: 'actif',
    key: 'actif',
    title: 'Actif',
    type: 'boolean',
    width: 80,
    editable: true,
  },
]

import { useState } from 'react'
// import { AdvancedDataTable } from './AdvancedDataTable' // File doesn't exist yet

export function SimpleDataTableExample() {
  const [data, setData] = useState<SimpleEmployee[]>(sampleData)
  const [selectedRows, _setSelectedRows] = useState<string[]>([])

  // Configuration pour AdvancedDataTable
  const _simpleColumns: ColumnConfig<SimpleEmployee>[] = [
    {
      id: 'nom',
      key: 'nom',
      title: 'Nom',
      type: 'text',
      width: 200,
      sortable: true,
      searchable: true,
    },
    {
      id: 'poste',
      key: 'poste',
      title: 'Poste',
      type: 'text',
      width: 150,
      sortable: true,
    },
    {
      id: 'salaire',
      key: 'salaire',
      title: 'Salaire',
      type: 'number',
      width: 120,
      sortable: true,
      render: (value) => {
        if (typeof value === 'number') {
          return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
          }).format(value)
        }
        return String(value || 0)
      },
    },
    {
      id: 'actif',
      key: 'actif',
      title: 'Actif',
      type: 'boolean',
      width: 80,
      render: (value) => (value ? '✓' : '✗'),
    },
  ]

  // Action pour ajouter un nouvel employé
  const handleAddEmployee = () => {
    const newEmployee: SimpleEmployee = {
      id: Math.max(...data.map((e: SimpleEmployee) => e.id)) + 1,
      nom: 'Nouvel Employé',
      poste: 'Développeur',
      salaire: 35000,
      actif: true,
    }
    setData([...data, newEmployee])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Exemple de DataTable</h3>
          <p className="text-sm text-gray-600">
            Exemple fonctionnel d'utilisation du composant DataTable
          </p>
        </div>
        <button
          onClick={handleAddEmployee}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Ajouter un employé
        </button>
      </div>

      {/* <AdvancedDataTable
        data={data}
        columns={simpleColumns}
        keyField="id"
        tableId="simple-employees"
        userId="demo-user"
        sortable
        searchable
        selectable
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
        pagination={{
          page: 1,
          pageSize: 10,
          total: data.length,
          showSizeChanger: true,
          pageSizeOptions: [5, 10, 20],
        }}
      /> */}
      <div className="p-4 border rounded">
        <p>AdvancedDataTable component not yet implemented</p>
      </div>

      {selectedRows.length > 0 && (
        <div className="text-sm text-gray-600">{selectedRows.length} ligne(s) sélectionnée(s)</div>
      )}
    </div>
  )
}

export default SimpleDataTableExample
