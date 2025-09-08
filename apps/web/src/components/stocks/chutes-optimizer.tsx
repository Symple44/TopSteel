// apps/web/src/components/stocks/chutes-optimizer.tsx
'use client'

import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@erp/ui'
import { Calculator, CheckCircle, Recycle, Search, TrendingUp, Zap } from 'lucide-react'
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
  emplacement: string
  qualite: 'EXCELLENTE' | 'BONNE' | 'ACCEPTABLE' | 'DEGRADEE'
  valeurEstimee: number
  utilisationsProposees: UtilisationProposee[]
}

interface UtilisationProposee {
  id: string
  projetNom: string
  quantiteRequise: number
  economie: number
  priorite: number
  compatibilite: number // %
}

interface ChutesOptimizerProps {
  chutes: Chute[]
  onOptimize: (chuteId: string, utilisationId: string) => void
  onSearch: (query: string) => void
}

export function ChutesOptimizer({ chutes, onOptimize, onSearch }: ChutesOptimizerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChute, setSelectedChute] = useState<Chute | null>(null)
  const [optimizationResults, setOptimizationResults] = useState<
    { economie: number; utilisations: number }[]
  >([])

  const getQualityColor = (qualite: string) => {
    switch (qualite) {
      case 'EXCELLENTE':
        return 'text-green-600 bg-green-50'
      case 'BONNE':
        return 'text-blue-600 bg-blue-50'
      case 'ACCEPTABLE':
        return 'text-yellow-600 bg-yellow-50'
      case 'DEGRADEE':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const runOptimization = () => {
    // Simulation algorithme d'optimisation
    const results = chutes
      .map((chute) => ({
        chuteId: chute.id,
        economie: chute?.utilisationsProposees?.reduce((sum, u) => sum + u.economie, 0),
        utilisations: chute?.utilisationsProposees?.length,
        score: Math.round(Math.random() * 100),
      }))
      .sort((a, b) => b.economie - a.economie)

    setOptimizationResults(results)
  }

  const totalEconomie = optimizationResults?.reduce((sum, r) => sum + r.economie, 0)
  const totalChutesUtilisables = optimizationResults?.filter((r) => r.utilisations > 0).length

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Recycle className="h-5 w-5" />
              Optimiseur de Chutes
            </CardTitle>
            <Button type="button" onClick={runOptimization} className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Optimiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par matériau, dimensions..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSearchQuery(e?.target?.value)
                    onSearch(e?.target?.value)
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résultats d'optimisation */}
      {optimizationResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Économie totale</p>
                  <p className="text-2xl font-bold text-green-600">
                    {totalEconomie?.toLocaleString()} €
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Recycle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Chutes utilisables</p>
                  <p className="text-2xl font-bold text-blue-600">{totalChutesUtilisables}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calculator className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taux utilisation</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round((totalChutesUtilisables / chutes.length) * 100)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Liste des chutes avec opportunités */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liste des chutes */}
        <Card>
          <CardHeader>
            <CardTitle>Chutes disponibles ({chutes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {chutes?.map((chute) => (
                <button
                  type="button"
                  key={chute.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors w-full text-left ${
                    selectedChute?.id === chute.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedChute(chute)}
                  aria-label={`Sélectionner la chute ${chute.reference}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{chute.reference}</div>
                      <div className="text-sm text-gray-600">{chute.materiau}</div>
                      <div className="text-sm text-gray-500">
                        {chute?.dimensions?.longueur} × {chute?.dimensions?.largeur} ×{' '}
                        {chute?.dimensions?.epaisseur} mm
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-xs px-2 py-1 rounded ${getQualityColor(chute.qualite)}`}
                      >
                        {chute.qualite}
                      </div>
                      <div className="text-sm font-medium mt-1">{chute.valeurEstimee} €</div>
                    </div>
                  </div>

                  {chute?.utilisationsProposees?.length > 0 && (
                    <div className="mt-2 text-xs text-green-600">
                      {chute?.utilisationsProposees?.length} utilisation(s) proposée(s)
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Détails de la chute sélectionnée */}
        {selectedChute && (
          <Card>
            <CardHeader>
              <CardTitle>Utilisations proposées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedChute?.utilisationsProposees?.length === 0 ? (
                  <div className="text-center py-8">
                    <Recycle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Aucune utilisation proposée</p>
                    <p className="text-sm text-gray-400">
                      Cette chute ne correspond à aucun besoin actuel
                    </p>
                  </div>
                ) : (
                  selectedChute?.utilisationsProposees?.map((utilisation) => (
                    <div key={utilisation.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{utilisation.projetNom}</h4>
                          <p className="text-sm text-gray-600">
                            Quantité: {utilisation.quantiteRequise} unité(s)
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">
                            +{utilisation.economie} €
                          </div>
                          <div className="text-xs text-gray-500">
                            {utilisation.compatibilite}% compatible
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              utilisation.priorite >= 8
                                ? 'bg-red-100 text-red-600'
                                : utilisation.priorite >= 5
                                  ? 'bg-yellow-100 text-yellow-600'
                                  : 'bg-green-100 text-green-600'
                            }`}
                          >
                            Priorité {utilisation.priorite}/10
                          </span>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          onClick={() => onOptimize(selectedChute.id, utilisation.id)}
                          className="flex items-center gap-1"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Utiliser
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Algorithme d'optimisation en cours */}
      {optimizationResults.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calculator className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Optimiseur intelligent</h3>
            <p className="text-gray-600 mb-4">
              Cliquez sur "Optimiser" pour analyser vos chutes et trouver les meilleures
              opportunités d'utilisation.
            </p>
            <Button type="button" onClick={runOptimization} size="lg">
              <Zap className="h-4 w-4 mr-2" />
              Lancer l'optimisation
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
