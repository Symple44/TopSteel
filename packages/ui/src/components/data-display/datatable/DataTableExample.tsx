'use client'

import { useState } from 'react'
import { Button } from '../../primitives/button'
import { DataTable } from './DataTable'
import type { ColumnConfig } from './types'

interface ExampleData {
  id: number
  nom: string
  age: number
  email: string
  salaire: number
  dateEmbauche: Date
  actif: boolean
  statut: 'actif' | 'inactif' | 'suspendu'
  competences: string[]
  total?: number
  commentaires?: string
}

const exampleData: ExampleData[] = [
  {
    id: 1,
    nom: 'Jean Dupont',
    age: 35,
    email: 'jean.dupont@example.com',
    salaire: 45000,
    dateEmbauche: new Date('2020-01-15'),
    actif: true,
    statut: 'actif',
    competences: ['JavaScript', 'React', 'TypeScript'],
    commentaires:
      '<p><strong>Excellent développeur</strong> avec une grande expérience en <em>React</em>.</p><ul><li>Très motivé</li><li>Travail en équipe exemplaire</li><li>Formation continue</li></ul>',
  },
  {
    id: 2,
    nom: 'Marie Martin',
    age: 28,
    email: 'marie.martin@example.com',
    salaire: 52000,
    dateEmbauche: new Date('2021-03-22'),
    actif: true,
    statut: 'actif',
    competences: ['Python', 'Django', 'PostgreSQL'],
    commentaires:
      '<p>Développeuse <strong>backend</strong> talentueuse.</p><p style="color: #0066cc;">Spécialiste en optimisation de bases de données.</p>',
  },
  {
    id: 3,
    nom: 'Pierre Durand',
    age: 42,
    email: 'pierre.durand@example.com',
    salaire: 38000,
    dateEmbauche: new Date('2019-07-10'),
    actif: false,
    statut: 'suspendu',
    competences: ['PHP', 'Laravel'],
    commentaires:
      '<p><span style="color: #ff0000;">⚠️ Suspension temporaire</span></p><blockquote>En attente de formation sur les nouvelles technologies.</blockquote>',
  },
]

const columns: ColumnConfig<ExampleData>[] = [
  {
    id: 'nom',
    key: 'nom',
    title: 'Nom',
    description: "Nom complet de l'employé (prénom et nom)",
    type: 'text',
    sortable: true,
    searchable: true,
    editable: true,
    required: true,
    locked: true, // Colonne verrouillée (non déplaçable)
    width: 200,
    validation: {
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-ZÀ-ÿ\s-]+$/,
    },
  },
  {
    id: 'age',
    key: 'age',
    title: 'Âge',
    description: "Âge de l'employé (entre 18 et 65 ans)",
    type: 'number',
    sortable: true,
    editable: true,
    required: true,
    width: 80,
    validation: {
      min: 18,
      max: 65,
    },
    format: {
      suffix: ' ans',
    },
    render: (value) => `${value || 0} ans`,
  },
  {
    id: 'email',
    key: 'email',
    title: 'Email',
    type: 'text',
    sortable: true,
    searchable: true,
    editable: true,
    required: true,
    width: 250,
    validation: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      custom: (value) => {
        if (value && !value.includes('@')) {
          return 'Adresse email invalide'
        }
        return null
      },
    },
  },
  {
    id: 'salaire',
    key: 'salaire',
    title: 'Salaire',
    type: 'number',
    sortable: true,
    editable: true,
    width: 120,
    validation: {
      min: 20000,
      max: 200000,
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
    id: 'dateEmbauche',
    key: 'dateEmbauche',
    title: "Date d'embauche",
    type: 'date',
    sortable: true,
    editable: true,
    width: 150,
    validation: {
      custom: (value) => {
        if (value instanceof Date && value > new Date()) {
          return 'La date ne peut pas être dans le futur'
        }
        return null
      },
    },
    render: (value) => {
      if (value instanceof Date) {
        return value.toLocaleDateString('fr-FR')
      }
      return String(value || '')
    },
  },
  {
    id: 'actif',
    key: 'actif',
    title: 'Actif',
    type: 'boolean',
    sortable: true,
    editable: true,
    width: 80,
  },
  {
    id: 'statut',
    key: 'statut',
    title: 'Statut',
    type: 'select',
    sortable: true,
    editable: true,
    width: 120,
    options: [
      { value: 'actif', label: 'Actif', color: '#10b981' },
      { value: 'inactif', label: 'Inactif', color: '#6b7280' },
      { value: 'suspendu', label: 'Suspendu', color: '#ef4444' },
    ],
  },
  {
    id: 'competences',
    key: 'competences',
    title: 'Compétences',
    type: 'multiselect',
    editable: true,
    width: 200,
    render: (value) => {
      if (Array.isArray(value)) {
        return (
          <div className="flex flex-wrap gap-1">
            {value.slice(0, 2).map((skill, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {skill}
              </span>
            ))}
            {value.length > 2 && <span className="text-xs text-gray-500">+{value.length - 2}</span>}
          </div>
        )
      }
      return null
    },
  },
  {
    id: 'commentaires',
    key: 'commentaires',
    title: 'Commentaires',
    description: 'Notes et commentaires avec mise en forme',
    type: 'richtext',
    sortable: false,
    searchable: true,
    editable: true,
    width: 300,
    validation: {
      maxLength: 5000,
    },
  },
  {
    id: 'total',
    key: 'total',
    title: 'Total (Formule)',
    type: 'formula',
    width: 120,
    formula: {
      expression: '=C1*12', // Âge * 12 (exemple simple)
      dependencies: ['age'],
    },
    format: {
      decimals: 0,
      suffix: ' points',
    },
    render: (value) => {
      if (typeof value === 'number') {
        return `${value.toFixed(0)} points`
      }
      return String(value || 0)
    },
  },
]

export function DataTableExample() {
  const [data, setData] = useState(exampleData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCellEdit = (newValue: any, row: ExampleData, column: ColumnConfig<ExampleData>) => {
    setData((prevData) =>
      prevData.map((item) => (item.id === row.id ? { ...item, [column.key]: newValue } : item))
    )
  }

  const handleCreate = () => {
    const newId = Math.max(...data.map((item) => item.id)) + 1
    const newRow: ExampleData = {
      id: newId,
      nom: '',
      age: 25,
      email: '',
      salaire: 30000,
      dateEmbauche: new Date(),
      actif: true,
      statut: 'actif',
      competences: [],
    }
    setData([...data, newRow])
  }

  const handleDelete = (rows: ExampleData[]) => {
    const idsToDelete = rows.map((row) => row.id)
    setData(data.filter((item) => !idsToDelete.includes(item.id)))
  }

  const handleEdit = (row: ExampleData) => {
    // Ici on pourrait ouvrir un modal ou naviger vers une page d'édition
    alert(`Édition de ${row.nom}`)
  }

  const simulateLoading = () => {
    setLoading(true)
    setError(null)
    setTimeout(() => {
      setLoading(false)
    }, 2000)
  }

  const simulateError = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setError('Erreur de connexion au serveur. Veuillez réessayer.')
    }, 1000)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Exemple DataTable avec Validation</h2>
        <div className="flex gap-2">
          <Button onClick={simulateLoading} variant="outline" size="sm">
            Simuler Chargement
          </Button>
          <Button onClick={simulateError} variant="outline" size="sm">
            Simuler Erreur
          </Button>
          <Button
            onClick={() => {
              setError(null)
              setLoading(false)
            }}
            variant="outline"
            size="sm"
          >
            Reset
          </Button>
        </div>
      </div>

      <DataTable
        data={data}
        columns={columns}
        keyField="id"
        tableId="example-employees" // ID unique pour la persistence
        editable
        selectable
        sortable
        searchable
        filterable
        height={600}
        actions={{
          create: handleCreate,
          edit: handleEdit,
          delete: handleDelete,
        }}
        onCellEdit={handleCellEdit}
        loading={loading}
        error={error}
        className="border rounded-lg"
      />

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Fonctionnalités :</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-1">Validation :</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Nom :</strong> 2-50 caractères, lettres uniquement
              </li>
              <li>
                <strong>Âge :</strong> Entre 18 et 65 ans
              </li>
              <li>
                <strong>Email :</strong> Format email valide
              </li>
              <li>
                <strong>Salaire :</strong> Entre 20k et 200k €
              </li>
              <li>
                <strong>Date :</strong> Pas dans le futur
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-1">Interactions :</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Cliquer sur une cellule pour éditer</li>
              <li>Drag & drop des en-têtes pour réorganiser</li>
              <li>Ctrl+C / Ctrl+V pour copier-coller</li>
              <li>Tri par colonne (cliquer en-tête)</li>
              <li>Recherche globale en temps réel</li>
              <li>Sauvegarde automatique des paramètres</li>
              <li>Export/réinitialisation des paramètres</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataTableExample
