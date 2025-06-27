'use client'

import { useState } from 'react'
import { Plus, Search, Filter } from 'lucide-react'

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-muted-foreground">Gestion de vos clients</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau client
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md"
          />
        </div>
        <button className="inline-flex items-center px-4 py-2 border rounded-md">
          <Filter className="h-4 w-4 mr-2" />
          Filtres
        </button>
      </div>

      <div className="border rounded-lg">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Liste des clients</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Entreprise ABC</h3>
                <p className="text-sm text-muted-foreground">contact@abc.fr</p>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-xs border rounded">Voir</button>
                <button className="px-3 py-1 text-xs border rounded">Modifier</button>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Société XYZ</h3>
                <p className="text-sm text-muted-foreground">info@xyz.com</p>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-xs border rounded">Voir</button>
                <button className="px-3 py-1 text-xs border rounded">Modifier</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
