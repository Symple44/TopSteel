import { Button, Input } from '@erp/ui'

import { Edit, Eye, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface Chute {
  id: string
  reference: string
  materiau: string
  dimensions: {
    longueur: number
    largeur: number
    epaisseur: number
  }
  quantite: number
  unite: string
  qualite: 'EXCELLENTE' | 'BONNE' | 'ACCEPTABLE' | 'DEGRADEE'
  emplacement: string
  valeurEstimee: number
  statut: 'DISPONIBLE' | 'RESERVEE' | 'UTILISEE' | 'REBUT'
  origine: {
    type: string
    reference: string
  }
  dateCreation: Date
  notes?: string
}

interface ChutesTableProps {
  chutes: Chute[]
  onView: (chute: Chute) => void
  onEdit: (chute: Chute) => void
  onDelete: (chute: Chute) => void
  onSearch: (searchTerm: string) => void
}

export function ChutesTable({ chutes, onView, onEdit, onDelete, onSearch }: ChutesTableProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    onSearch(e.target.value)
  }

  const getQualityBadge = (qualite: string) => {
    const _baseClasses = 'px-2 py-1 rounded-full text-xs font-medium'

    switch (qualite) {
      case 'EXCELLENTE':
        return <span className={'${baseClasses} bg-green-100 text-green-800'}>Excellente</span>
      case 'BONNE':
        return <span className={'${baseClasses} bg-blue-100 text-blue-800'}>Bonne</span>
      case 'ACCEPTABLE':
        return <span className={'${baseClasses} bg-yellow-100 text-yellow-800'}>Acceptable</span>
      case 'DEGRADEE':
        return <span className={'${baseClasses} bg-red-100 text-red-800'}>Dégradée</span>
      default:
        return <span className={'${baseClasses} bg-gray-100 text-gray-800'}>{qualite}</span>
    }
  }

  const getStatusBadge = (statut: string) => {
    const _baseClasses = 'px-2 py-1 rounded-full text-xs font-medium'

    switch (statut) {
      case 'DISPONIBLE':
        return <span className={'${baseClasses} bg-green-100 text-green-800'}>Disponible</span>
      case 'RESERVEE':
        return <span className={'${baseClasses} bg-orange-100 text-orange-800'}>Réservée</span>
      case 'UTILISEE':
        return <span className={'${baseClasses} bg-gray-100 text-gray-800'}>Utilisée</span>
      case 'REBUT':
        return <span className={'${baseClasses} bg-red-100 text-red-800'}>Rebut</span>
      default:
        return <span className={'${baseClasses} bg-gray-100 text-gray-800'}>{statut}</span>
    }
  }

  if (chutes.length === 0) {
    return (
      <div className="text-center py-8">
        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Aucune chute trouvée</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher une chute..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="pl-10"
        />
      </div>

      {/* Tableau responsive */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Référence</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Matériau</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Dimensions</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Qualité</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Statut</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Valeur</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {chutes.map((chute) => (
              <tr key={chute.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{chute.reference}</div>
                  <div className="text-sm text-gray-500">
                    {chute.dateCreation.toLocaleDateString()}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{chute.materiau}</td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {chute.dimensions.longueur} × {chute.dimensions.largeur} ×{' '}
                  {chute.dimensions.epaisseur} mm
                </td>
                <td className="px-4 py-3">{getQualityBadge(chute.qualite)}</td>
                <td className="px-4 py-3">{getStatusBadge(chute.statut)}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {chute.valeurEstimee} €
                </td>
                <td className="px-4 py-3">
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => onView(chute)} className="p-1">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(chute)} className="p-1">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(chute)}
                      className="p-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Résumé */}
      <div className="text-sm text-gray-500">
        {chutes.length} chute{chutes.length > 1 ? 's' : ''} trouvée{chutes.length > 1 ? 's' : ''}
      </div>
    </div>
  )
}
