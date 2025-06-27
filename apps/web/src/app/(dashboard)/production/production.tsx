'use client'

import { useState } from 'react'
import { Plus, Search, Filter, Factory, Clock } from 'lucide-react'

export default function ProductionPage() {
  const [activeTab, setActiveTab] = useState('ordres')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Production</h1>
          <p className="text-muted-foreground">Gestion de la production</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md">
          <Plus className="h-4 w-4 mr-2" />
          Nouvel ordre
        </button>
      </div>

      <div className="border-b">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('ordres')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ordres'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Ordres de fabrication
          </button>
          <button
            onClick={() => setActiveTab('planning')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'planning'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Planning
          </button>
        </nav>
      </div>

      {activeTab === 'ordres' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un ordre..."
                className="w-full pl-10 pr-4 py-2 border rounded-md"
              />
            </div>
          </div>

          <div className="grid gap-4">
            <div className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Ordre OF-2025-001</h3>
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">En cours</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Projet:</span>
                  <span>Garde-corps Entreprise ABC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Début:</span>
                  <span>15/01/2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fin prévue:</span>
                  <span>22/01/2025</span>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Ordre OF-2025-002</h3>
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Planifié</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Projet:</span>
                  <span>Escalier Société XYZ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Début:</span>
                  <span>25/01/2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fin prévue:</span>
                  <span>05/02/2025</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'planning' && (
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Planning de production</h2>
          <p className="text-muted-foreground">Planning en cours de développement...</p>
        </div>
      )}
    </div>
  )
}
