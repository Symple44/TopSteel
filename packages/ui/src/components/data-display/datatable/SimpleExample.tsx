'use client'

import { Badge } from '../badge'
// import { useDataTable } from '@/hooks/use-datatable' // TODO: Abstract this dependency
import { DataTable } from './DataTable'
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

export function SimpleDataTableExample() {
  // TODO: This component needs to be refactored to work without app-specific hooks
  // const { data, selection, selectedData, tableConfig, handleRowAdd, clearSelection } = useDataTable(
  //   {
  //     tableId: 'simple-employees',
  //     initialData: sampleData,
  //     columns: simpleColumns,
  //     keyField: 'id',
  //   }
  // )

  // Action pour ajouter un nouvel employé
  const handleAddEmployee = () => {
    const newEmployee: SimpleEmployee = {
      id: Math.max(...sampleData.map((e: SimpleEmployee) => e.id)) + 1,
      nom: 'Nouvel Employé',
      poste: 'Développeur',
      salaire: 35000,
      actif: true,
    }
    // handleRowAdd(newEmployee) // Commented out for now
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Exemple Simplifié</h3>
          <p className="text-sm text-gray-600">
            This component requires app-specific hooks and needs to be refactored
          </p>
        </div>
      </div>

      <div className="p-4 border rounded-lg bg-gray-50">
        <p className="text-sm text-gray-600">
          This component is temporarily disabled because it depends on app-specific hooks. To use
          this component, implement the required data management logic.
        </p>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>
          <strong>Code simplifié :</strong>
        </p>
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
