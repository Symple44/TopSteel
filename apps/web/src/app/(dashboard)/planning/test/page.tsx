'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { Badge } from '@erp/ui'
import { Button } from '@erp/ui/primitives'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@erp/ui'

// Données fictives de planning
const planningData = [
  {
    id: 1,
    projet: 'Structure métallique - Bâtiment A',
    client: 'Construction ABC',
    dateDebut: '20 Jan',
    dateFin: '15 Fév 2025',
    progression: 45,
    statut: 'en_cours',
    equipe: ['Jean Dupont', 'Marie Martin', 'Pierre Durand'],
    taches: [
      { id: 1, nom: 'Découpe des poutres', progression: 100, statut: 'termine' },
      { id: 2, nom: 'Assemblage structure principale', progression: 60, statut: 'en_cours' },
      { id: 3, nom: 'Soudure des joints', progression: 20, statut: 'en_cours' },
      { id: 4, nom: 'Traitement anti-corrosion', progression: 0, statut: 'a_faire' },
      { id: 5, nom: 'Contrôle qualité', progression: 0, statut: 'a_faire' },
    ],
    materiaux: [
      { nom: 'Poutre HEA 200', quantite: 50, unite: 'm', disponible: true },
      { nom: 'Plaque acier 10mm', quantite: 200, unite: 'm²', disponible: true },
      { nom: 'Boulons M20', quantite: 500, unite: 'pcs', disponible: false },
    ],
  },
  {
    id: 2,
    projet: 'Passerelle piétonne',
    client: 'Ville de Nantes',
    dateDebut: '1 Fév',
    dateFin: '30 Mar 2025',
    progression: 15,
    statut: 'en_cours',
    equipe: ['Sophie Lambert', 'Thomas Bernard'],
    taches: [
      { id: 1, nom: 'Étude et conception', progression: 100, statut: 'termine' },
      { id: 2, nom: 'Approvisionnement matériaux', progression: 40, statut: 'en_cours' },
      { id: 3, nom: 'Fabrication éléments', progression: 10, statut: 'en_cours' },
      { id: 4, nom: 'Assemblage en atelier', progression: 0, statut: 'a_faire' },
      { id: 5, nom: 'Installation sur site', progression: 0, statut: 'a_faire' },
    ],
    materiaux: [
      { nom: 'Tube carré 100x100', quantite: 80, unite: 'm', disponible: true },
      { nom: 'Tôle striée 5mm', quantite: 50, unite: 'm²', disponible: true },
      { nom: 'Garde-corps normé', quantite: 40, unite: 'm', disponible: true },
    ],
  },
  {
    id: 3,
    projet: 'Escalier hélicoïdal',
    client: 'Entreprise XYZ',
    dateDebut: '15 Jan',
    dateFin: '31 Jan 2025',
    progression: 85,
    statut: 'en_cours',
    equipe: ['Luc Moreau', 'Claire Petit'],
    taches: [
      { id: 1, nom: 'Calcul et dimensionnement', progression: 100, statut: 'termine' },
      { id: 2, nom: 'Fabrication limon central', progression: 100, statut: 'termine' },
      { id: 3, nom: 'Fabrication marches', progression: 100, statut: 'termine' },
      { id: 4, nom: 'Assemblage', progression: 80, statut: 'en_cours' },
      { id: 5, nom: 'Finition et peinture', progression: 20, statut: 'en_cours' },
    ],
    materiaux: [
      { nom: 'Tube Ø200 ép.10', quantite: 6, unite: 'm', disponible: true },
      { nom: 'Tôle pliée 4mm', quantite: 30, unite: 'm²', disponible: true },
      { nom: 'Main courante inox', quantite: 15, unite: 'm', disponible: true },
    ],
  },
  {
    id: 4,
    projet: 'Charpente industrielle',
    client: 'Logistique Express',
    dateDebut: '1 Mar',
    dateFin: '30 Mai 2025',
    progression: 0,
    statut: 'planifie',
    equipe: ['À définir'],
    taches: [
      { id: 1, nom: 'Relevé sur site', progression: 0, statut: 'a_faire' },
      { id: 2, nom: 'Étude technique', progression: 0, statut: 'a_faire' },
      { id: 3, nom: 'Fabrication fermes', progression: 0, statut: 'a_faire' },
      { id: 4, nom: 'Fabrication pannes', progression: 0, statut: 'a_faire' },
      { id: 5, nom: 'Montage sur site', progression: 0, statut: 'a_faire' },
    ],
    materiaux: [
      { nom: 'IPE 300', quantite: 200, unite: 'm', disponible: false },
      { nom: 'HEA 240', quantite: 150, unite: 'm', disponible: false },
      { nom: 'Cornière 80x80', quantite: 100, unite: 'm', disponible: false },
    ],
  },
  {
    id: 5,
    projet: 'Rénovation pont roulant',
    client: 'Industrie Métallurgique SA',
    dateDebut: '10 Jan',
    dateFin: '25 Jan 2025',
    progression: 100,
    statut: 'termine',
    equipe: ['Michel Roux', 'David Garcia'],
    taches: [
      { id: 1, nom: 'Diagnostic structure', progression: 100, statut: 'termine' },
      { id: 2, nom: 'Remplacement rails', progression: 100, statut: 'termine' },
      { id: 3, nom: 'Révision mécanismes', progression: 100, statut: 'termine' },
      { id: 4, nom: 'Tests de charge', progression: 100, statut: 'termine' },
      { id: 5, nom: 'Certification', progression: 100, statut: 'termine' },
    ],
    materiaux: [
      { nom: 'Rail de roulement', quantite: 40, unite: 'm', disponible: true },
      { nom: 'Galets de roulement', quantite: 8, unite: 'pcs', disponible: true },
      { nom: 'Câble acier Ø20', quantite: 100, unite: 'm', disponible: true },
    ],
  },
]

const statusConfig: Record<string, { label: string; color: string }> = {
  planifie: { label: 'Planifié', color: 'bg-gray-500' },
  en_cours: { label: 'En cours', color: 'bg-blue-500' },
  termine: { label: 'Terminé', color: 'bg-green-500' },
  en_retard: { label: 'En retard', color: 'bg-red-500' },
}

const taskStatusConfig: Record<string, { label: string; color: string }> = {
  a_faire: { label: 'À faire', color: 'text-gray-600' },
  en_cours: { label: 'En cours', color: 'text-blue-600' },
  termine: { label: 'Terminé', color: 'text-green-600' },
}

export default function TestPlanningPage() {
  const [selectedProject, setSelectedProject] = useState<(typeof projets)[0] | null>(null)
  const [viewMode, setViewMode] = useState('list') // 'list', 'gantt', 'calendar'

  const getProgressBarColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500'
    if (progress >= 60) return 'bg-blue-500'
    if (progress >= 30) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Planning de Production - Test</h1>
          <p className="text-muted-foreground mt-2">
            Visualisation des projets en cours et planifiés
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
          >
            Liste
          </Button>
          <Button
            variant={viewMode === 'gantt' ? 'default' : 'outline'}
            onClick={() => setViewMode('gantt')}
          >
            Gantt
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            onClick={() => setViewMode('calendar')}
          >
            Calendrier
          </Button>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Projets actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">sur 5 projets total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Progression moyenne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">48%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '48%' }}></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Équipes mobilisées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">techniciens</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alertes matériaux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">2</div>
            <p className="text-xs text-muted-foreground">commandes en attente</p>
          </CardContent>
        </Card>
      </div>

      {/* Vue Liste */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {planningData.map((projet) => (
            <Card key={projet.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{projet.projet}</CardTitle>
                    <CardDescription className="mt-1">
                      Client: {projet.client} | {projet.dateDebut} - {projet.dateFin}
                    </CardDescription>
                  </div>
                  <Badge className={`${statusConfig[projet.statut].color} text-white`}>
                    {statusConfig[projet.statut].label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progression */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progression globale</span>
                    <span className="font-medium">{projet.progression}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${getProgressBarColor(projet.progression)}`}
                      style={{ width: `${projet.progression}%` }}
                    ></div>
                  </div>
                </div>

                {/* Équipe */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">👥 Équipe:</span>
                  <div className="flex gap-1">
                    {projet.equipe.map((membre) => (
                      <Badge key={membre} variant="secondary" className="text-xs">
                        {membre}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Tâches */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">🔧 Tâches</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {projet.taches.map((tache) => (
                      <div
                        key={tache.id}
                        className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded"
                      >
                        <span className={taskStatusConfig[tache.statut].color}>{tache.nom}</span>
                        <Badge variant="outline" className="text-xs">
                          {tache.progression}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Matériaux */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">📦 Matériaux critiques</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {projet.materiaux
                      .filter((m) => !m.disponible)
                      .map((materiau) => (
                        <Badge
                          key={`${materiau.nom}-${materiau.quantite}`}
                          variant="destructive"
                          className="text-xs"
                        >
                          ⚠️ {materiau.nom} - {materiau.quantite} {materiau.unite}
                        </Badge>
                      ))}
                    {projet.materiaux.filter((m) => !m.disponible).length === 0 && (
                      <Badge variant="secondary" className="text-xs text-green-700 bg-green-100">
                        ✅ Tous les matériaux disponibles
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setSelectedProject(projet)}>
                    Voir détails
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Vue Gantt (simplifiée) */}
      {viewMode === 'gantt' && (
        <Card>
          <CardHeader>
            <CardTitle>Vue Gantt</CardTitle>
            <CardDescription>Chronologie des projets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {planningData.map((projet) => (
                <div key={projet.id} className="flex items-center gap-4">
                  <div className="w-48 text-sm font-medium truncate">{projet.projet}</div>
                  <div className="flex-1 relative h-10 bg-gray-100 rounded">
                    <div
                      className={`absolute h-full rounded ${statusConfig[projet.statut].color}`}
                      style={{
                        left: '10%',
                        width: '40%',
                        opacity: 0.8,
                      }}
                    >
                      <div
                        className="h-full bg-white bg-opacity-50"
                        style={{ width: `${projet.progression}%` }}
                      ></div>
                    </div>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium">
                      {projet.progression}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <span>Janvier</span>
              <span>Février</span>
              <span>Mars</span>
              <span>Avril</span>
              <span>Mai</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vue Calendrier */}
      {viewMode === 'calendar' && (
        <Card>
          <CardHeader>
            <CardTitle>Vue Calendrier</CardTitle>
            <CardDescription>Planning mensuel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((jour) => (
                <div key={jour} className="text-center text-sm font-medium p-2">
                  {jour}
                </div>
              ))}
              {Array.from({ length: 35 }, (_, i) => (
                <div key={`calendar-day-${i + 1}`} className="aspect-square border rounded p-1 text-xs">
                  {i + 1 <= 31 && (
                    <>
                      <div className="font-medium">{i + 1}</div>
                      {i === 19 && (
                        <div className="mt-1 p-1 bg-blue-100 rounded text-blue-700 truncate">
                          Struct. A
                        </div>
                      )}
                      {i === 14 && (
                        <div className="mt-1 p-1 bg-green-100 rounded text-green-700 truncate">
                          Escalier
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de détails (simple) */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-auto">
            <CardHeader>
              <CardTitle>{selectedProject.projet}</CardTitle>
              <CardDescription>Détails complets du projet</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Contenu détaillé ici */}
              <Button onClick={() => setSelectedProject(null)}>Fermer</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
