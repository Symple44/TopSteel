'use client'

import { ChutesOptimizer } from '@/components/stocks/chutes-optimizer'
import { ChutesStats } from '@/components/stocks/chutes-stats'
import { ChutesTable } from '@/components/stocks/chutes-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Calculator, Recycle, Search } from 'lucide-react'
import { useState } from 'react'

  // Données mock pour les statistiques des chutes
    // Données mock pour les statistiques des chutes - Interface complète
  const mockStats = {
    totalChutes: 245,
    valeurTotale: 15420,           // Correction: valeurEstimee → valeurTotale
    tauxReutilisation: 68,         // Ajout: propriété manquante
    economiesRealisees: 8950,      // Conservé
    chutesExcellentes: 85,         // Ajout: propriété manquante
    chutesDegradees: 12,           // Ajout: propriété manquante
    evolutionMois: 15              // Ajout: propriété manquante (évolution en %)
  };

  // Données mock pour les chutes
    // Données mock pour les chutes - Interface Chute complète
    // Données mock pour les chutes - Enums corrigés
  const mockChutes = [
    {
      id: '1',
      reference: 'CHT-2025-001',
      materiau: 'Acier galvanisé',
      dimensions: { longueur: 120, largeur: 80, epaisseur: 2 },
      poids: 15.5,
      quantite: 1,
      unite: 'pièce',
      qualite: 'EXCELLENTE' as const,           // Enum corrigé
      emplacement: 'Zone A-12',
      valeurEstimee: 85,
      statut: 'DISPONIBLE' as const,            // Enum corrigé
      origine: { type: 'production', reference: 'OF-2025-089' },
      dateCreation: new Date('2025-01-15')
    },
    {
      id: '2', 
      reference: 'CHT-2025-002',
      materiau: 'Aluminium 6061',
      dimensions: { longueur: 200, largeur: 100, epaisseur: 3 },
      poids: 12.8,
      quantite: 2,
      unite: 'pièce',
      qualite: 'BONNE' as const,                // Enum corrigé
      emplacement: 'Zone B-05',
      valeurEstimee: 120,
      statut: 'RESERVEE' as const,              // Enum corrigé
      origine: { type: 'commande', reference: 'CMD-2025-045' },
      dateCreation: new Date('2025-01-10')
    },
    {
      id: '3',
      reference: 'CHT-2025-003', 
      materiau: 'Inox 316L',
      dimensions: { longueur: 150, largeur: 50, epaisseur: 1.5 },
      poids: 8.2,
      quantite: 3,
      unite: 'ml',
      qualite: 'ACCEPTABLE' as const,           // Enum corrigé
      emplacement: 'Zone C-08',
      valeurEstimee: 95,
      statut: 'DISPONIBLE' as const,            // Enum corrigé
      origine: { type: 'chantier', reference: 'CHANT-2025-012' },
      dateCreation: new Date('2025-01-08')
    }
  ];

  // Handlers pour les actions du tableau
  const handleView = (chute: any) => {
    console.log('Voir chute:', chute);
    // TODO: Ouvrir modal de détails
  };

  const handleEdit = (chute: any) => {
    console.log('Éditer chute:', chute);
    // TODO: Ouvrir modal d'édition
  };

  const handleDelete = (chute: any) => {
    console.log('Supprimer chute:', chute);
    // TODO: Confirmer et supprimer
  };

  const handleSearch = (searchTerm: string) => {
    console.log('Recherche:', searchTerm);
    // TODO: Filtrer les chutes
  };

export default function ChutesPage() {
  const [showOptimizer, setShowOptimizer] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Optimisation des Chutes</h1>
          <p className="text-muted-foreground">
            Gestion et valorisation des chutes métalliques
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calculator className="h-4 w-4 mr-2" />
            Calculer optimisation
          </Button>
          <Button onClick={() => setShowOptimizer(true)}>
            <Recycle className="h-4 w-4 mr-2" />
            Optimiseur
          </Button>
        </div>
      </div>

      {/* Stats chutes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valeur chutes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€12,450</div>
            <p className="text-xs text-muted-foreground">Stock disponible</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taux réutilisation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">67%</div>
            <p className="text-xs text-muted-foreground">+5% ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Économies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">€3,240</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chutes récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Cette semaine</p>
          </CardContent>
        </Card>
      </div>

      {/* Recherche et filtres */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par matériau, dimensions..."
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          Acier
        </Button>
        <Button variant="outline">
          Aluminium
        </Button>
        <Button variant="outline">
          Inox
        </Button>
      </div>

      {/* Statistiques détaillées */}
      <ChutesStats stats={mockStats} />

      {/* Table des chutes */}
      <Card>
        <CardHeader>
          <CardTitle>Inventaire des Chutes</CardTitle>
        </CardHeader>
        <CardContent>
          <ChutesTable chutes={mockChutes} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} onSearch={handleSearch} />
        </CardContent>
      </Card>

      {/* Optimiseur modal */}      {showOptimizer && (
        <div className="mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Optimiseur de Chutes</h3>
            <p className="text-blue-700 mb-4">
              Fonctionnalité d'optimisation en cours de développement. 
              Cette section permettra d'optimiser l'utilisation des chutes pour de nouveaux projets.
            </p>
            <button 
              onClick={() => setShowOptimizer(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}





