'use client'

import { Button } from '@erp/ui'
import { Filter, Plus, Search } from 'lucide-react'
import React from 'react'
import { useState } from 'react'

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Gestion de vos clients</p>
        </div>
        <Button className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau client
        </Button>
      </div>

      {/* Filtres et recherche */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            className="w-full pl-10 pr-4 py-2 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="inline-flex items-center px-4 py-2 border rounded-md">
          <Filter className="h-4 w-4 mr-2" />
          Filtres
        </Button>
      </div>

      {/* Liste des clients */}
      <div className="grid gap-4">
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Entreprise Dubois</h3>
              <p className="text-sm text-muted-foreground">contact@dubois.fr • +33 1 23 45 67 89</p>
            </div>
            <div className="flex space-x-2">
              <Button className="px-3 py-1 text-xs border rounded">Voir</Button>
              <Button className="px-3 py-1 text-xs border rounded">Modifier</Button>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Martin Construction</h3>
              <p className="text-sm text-muted-foreground">
                info@martin-construction.fr • +33 1 98 76 54 32
              </p>
            </div>
            <div className="flex space-x-2">
              <Button className="px-3 py-1 text-xs border rounded">Voir</Button>
              <Button className="px-3 py-1 text-xs border rounded">Modifier</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
