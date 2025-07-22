'use client'

import React from 'react'
import { DataTable } from './DataTable'
import { ColumnConfig } from './types'
import { useDataTable } from '@/hooks/use-datatable'
import { Badge } from '@erp/ui'

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
  { id: 3, nom: 'Pierre Durand', poste: 'Manager', salaire: 55000, actif: false }
]

// Configuration simple des colonnes
const simpleColumns: ColumnConfig<SimpleEmployee>[] = [
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
      maxLength: 50
    }
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
      { value: 'Analyste', label: 'Analyste', color: '#10b981' }
    ]
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
      max: 100000
    },
    format: {
      currency: 'EUR'
    },
    render: (value) => {
      if (typeof value === 'number') {
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR'
        }).format(value)
      }
      return String(value || 0)
    }
  },
  {
    id: 'actif',
    key: 'actif',
    title: 'Actif',
    type: 'boolean',
    width: 80,
    editable: true
  }
]

export function SimpleDataTableExample() {
  // Utilisation du hook personnalisé
  const {
    data,
    selection,
    selectedData,
    tableConfig,
    handleRowAdd,
    clearSelection
  } = useDataTable({
    tableId: 'simple-employees',
    initialData: sampleData,
    columns: simpleColumns,
    keyField: 'id'
  })

  // Action pour ajouter un nouvel employé
  const handleAddEmployee = () => {
    const newEmployee: SimpleEmployee = {
      id: Math.max(...data.map(e => e.id)) + 1,
      nom: 'Nouvel Employé',
      poste: 'Développeur',
      salaire: 35000,
      actif: true
    }
    handleRowAdd(newEmployee)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Exemple Simplifié</h3>
          <p className="text-sm text-gray-600">
            Utilisation du hook useDataTable pour une implémentation rapide
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {selection.selectedRows.size > 0 && (
            <>
              <Badge variant="outline">
                {selection.selectedRows.size} sélectionné(s)
              </Badge>
              <button 
                onClick={clearSelection}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Désélectionner
              </button>
            </>
          )}
        </div>
      </div>

      <DataTable
        {...tableConfig}
        actions={{
          ...tableConfig.actions,
          create: handleAddEmployee
        }}
        height={300}
        className="border rounded-lg"
      />

      {selectedData.length > 0 && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            Employés sélectionnés :
          </h4>
          <div className="space-y-1">
            {selectedData.map(emp => (
              <div key={emp.id} className="text-sm text-blue-700">
                {emp.nom} - {emp.poste} ({emp.salaire}€)
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p><strong>Code simplifié :</strong></p>
        <code className="block p-2 bg-gray-100 rounded text-xs">
{`const { tableConfig, handleRowAdd } = useDataTable({
  tableId: 'simple-employees',
  initialData: sampleData,
  columns: simpleColumns,
  keyField: 'id'
})

<DataTable {...tableConfig} />`}
        </code>
      </div>
    </div>
  )
}

export default SimpleDataTableExample