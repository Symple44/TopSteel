'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useProjets } from '@/hooks/use-projets'
import { useUI } from '@/hooks/use-ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Grid, List, Plus, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function ProjetsPage() {
  const { projets, isLoading, refetch } = useProjets()
  const { dataView, setDataView } = useUI()

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-current border-r-transparent" />
          <p className="mt-4 text-muted-foreground">Chargement des projets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projets</h1>
          <p className="text-muted-foreground">{projets.length} projet(s)</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View toggle */}
          <div className="flex rounded-md border">
            <Button
              variant={dataView === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDataView('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={dataView === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDataView('table')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>

          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau projet
          </Button>
        </div>
      </div>

      {/* Content */}
      {dataView === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projets.map((projet) => (
            <div key={projet.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{projet.reference}</h3>
                <Badge variant="outline">{projet.statut}</Badge>
              </div>
              
              <h4 className="font-medium mb-2">{projet.titre}</h4>
              <p className="text-sm text-muted-foreground mb-4">{projet.description}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Client:</span>
                  <span>{projet.client?.nom}</span>
                </div>
                <div className="flex justify-between">
                  <span>Montant:</span>
                  <span>{formatCurrency(projet.montantHT)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avancement:</span>
                  <span>{projet.avancement}%</span>
                </div>
              </div>

              <div className="mt-4 w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{ width: `${projet.avancement}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Référence</th>
                <th className="text-left p-4">Titre</th>
                <th className="text-left p-4">Client</th>
                <th className="text-left p-4">Statut</th>
                <th className="text-left p-4">Montant HT</th>
                <th className="text-left p-4">Avancement</th>
              </tr>
            </thead>
            <tbody>
              {projets.map((projet) => (
                <tr key={projet.id} className="border-b hover:bg-muted/50">
                  <td className="p-4 font-medium">{projet.reference}</td>
                  <td className="p-4">{projet.titre}</td>
                  <td className="p-4">{projet.client?.nom}</td>
                  <td className="p-4">
                    <Badge variant="outline">{projet.statut}</Badge>
                  </td>
                  <td className="p-4">{formatCurrency(projet.montantHT)}</td>
                  <td className="p-4">{projet.avancement}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
