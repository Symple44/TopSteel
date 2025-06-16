'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  FileText,
  Calendar,
  Euro,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDate, formatCurrency, getDaysUntil } from '@/lib/utils'
import { ProjetStatut } from '@/types'

// Données mockées pour la démonstration
const mockProjets = [
  {
    id: '1',
    reference: 'PRJ-2025-0142',
    client: {
      nom: 'Entreprise ABC',
      email: 'contact@abc.fr',
    },
    description: 'Garde-corps et escalier métallique pour bâtiment industriel',
    statut: ProjetStatut.EN_COURS,
    dateCreation: new Date('2025-06-15'),
    dateDebut: new Date('2025-06-20'),
    dateFin: new Date('2025-07-15'),
    montantHT: 45250,
    montantTTC: 54300,
    avancement: 65,
  },
  {
    id: '2',
    reference: 'PRJ-2025-0141',
    client: {
      nom: 'Société XYZ',
      email: 'info@xyz.fr',
    },
    description: 'Structure métallique pour hangar agricole 500m²',
    statut: ProjetStatut.DEVIS,
    dateCreation: new Date('2025-06-14'),
    montantHT: 32800,
    montantTTC: 39360,
    avancement: 15,
  },
  {
    id: '3',
    reference: 'PRJ-2025-0140',
    client: {
      nom: 'SARL Martin',
      email: 'martin@sarl.fr',
    },
    description: 'Portail coulissant automatisé et clôture périmétrique',
    statut: ProjetStatut.EN_COURS,
    dateCreation: new Date('2025-06-10'),
    dateDebut: new Date('2025-06-12'),
    dateFin: new Date('2025-06-25'),
    montantHT: 28500,
    montantTTC: 34200,
    avancement: 80,
  },
  {
    id: '4',
    reference: 'PRJ-2025-0139',
    client: {
      nom: 'Mairie de Saint-Herblain',
      email: 'contact@mairie-saint-herblain.fr',
    },
    description: 'Passerelle piétonne métallique au-dessus de la rivière',
    statut: ProjetStatut.EN_COURS,
    dateCreation: new Date('2025-06-08'),
    dateDebut: new Date('2025-06-10'),
    dateFin: new Date('2025-08-30'),
    montantHT: 125000,
    montantTTC: 150000,
    avancement: 45,
  },
  {
    id: '5',
    reference: 'PRJ-2025-0138',
    client: {
      nom: 'SCI Immobilière Ouest',
      email: 'contact@sci-ouest.fr',
    },
    description: 'Verrière et structure métallique pour extension',
    statut: ProjetStatut.TERMINE,
    dateCreation: new Date('2025-05-20'),
    dateDebut: new Date('2025-05-25'),
    dateFin: new Date('2025-06-10'),
    montantHT: 67800,
    montantTTC: 81360,
    avancement: 100,
  },
]

export default function ProjetsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('tous')
  const [sortBy, setSortBy] = useState('date_desc')

  const getStatusBadge = (statut: ProjetStatut) => {
    const statusConfig = {
      [ProjetStatut.BROUILLON]: { label: 'Brouillon', variant: 'outline' as const },
      [ProjetStatut.DEVIS]: { label: 'Devis', variant: 'secondary' as const },
      [ProjetStatut.ACCEPTE]: { label: 'Accepté', variant: 'default' as const },
      [ProjetStatut.EN_COURS]: { label: 'En cours', variant: 'default' as const },
      [ProjetStatut.TERMINE]: { label: 'Terminé', variant: 'secondary' as const },
      [ProjetStatut.ANNULE]: { label: 'Annulé', variant: 'destructive' as const },
    }
    
    const config = statusConfig[statut]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getProgressColor = (avancement: number) => {
    if (avancement < 30) return 'bg-red-500'
    if (avancement < 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const filteredProjets = mockProjets
    .filter((projet) => {
      const matchSearch = 
        projet.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        projet.client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        projet.description.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchStatus = filterStatus === 'tous' || projet.statut === filterStatus
      
      return matchSearch && matchStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return b.dateCreation.getTime() - a.dateCreation.getTime()
        case 'date_asc':
          return a.dateCreation.getTime() - b.dateCreation.getTime()
        case 'montant_desc':
          return b.montantHT - a.montantHT
        case 'montant_asc':
          return a.montantHT - b.montantHT
        default:
          return 0
      }
    })

  const totalMontantHT = filteredProjets.reduce((sum, projet) => sum + projet.montantHT, 0)
  const projetsEnCours = filteredProjets.filter(p => p.statut === ProjetStatut.EN_COURS).length
  const projetsEnRetard = filteredProjets.filter(p => {
    if (p.dateFin && p.statut === ProjetStatut.EN_COURS) {
      return getDaysUntil(p.dateFin) < 0
    }
    return false
  }).length

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projets</h1>
          <p className="text-muted-foreground">
            Gérez vos projets de métallerie
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button onClick={() => router.push('/projets/nouveau')}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau projet
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total projets</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredProjets.length}</div>
            <p className="text-xs text-muted-foreground">
              {projetsEnCours} en cours
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant total HT</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMontantHT)}</div>
            <p className="text-xs text-muted-foreground">
              Sur {filteredProjets.length} projets
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets en retard</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projetsEnRetard}</div>
            <p className="text-xs text-muted-foreground">
              À traiter en priorité
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de réussite</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">
              Devis acceptés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres et recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par référence, client ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                <SelectItem value={ProjetStatut.BROUILLON}>Brouillon</SelectItem>
                <SelectItem value={ProjetStatut.DEVIS}>Devis</SelectItem>
                <SelectItem value={ProjetStatut.ACCEPTE}>Accepté</SelectItem>
                <SelectItem value={ProjetStatut.EN_COURS}>En cours</SelectItem>
                <SelectItem value={ProjetStatut.TERMINE}>Terminé</SelectItem>
                <SelectItem value={ProjetStatut.ANNULE}>Annulé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Date (récent)</SelectItem>
                <SelectItem value="date_asc">Date (ancien)</SelectItem>
                <SelectItem value="montant_desc">Montant (élevé)</SelectItem>
                <SelectItem value="montant_asc">Montant (faible)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des projets */}
      <div className="grid gap-4">
        {filteredProjets.map((projet) => (
          <Card
            key={projet.id}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => router.push(`/projets/${projet.id}`)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{projet.reference}</h3>
                    {getStatusBadge(projet.statut)}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {projet.client.nom}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {projet.description}
                  </p>
                  
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Date de création</p>
                      <p className="text-sm font-medium">{formatDate(projet.dateCreation)}</p>
                    </div>
                    {projet.dateFin && (
                      <div>
                        <p className="text-sm text-muted-foreground">Date de fin prévue</p>
                        <p className="text-sm font-medium">
                          {formatDate(projet.dateFin)}
                          {getDaysUntil(projet.dateFin) >= 0 ? (
                            <span className="text-muted-foreground ml-1">
                              (J-{getDaysUntil(projet.dateFin)})
                            </span>
                          ) : (
                            <span className="text-red-600 ml-1">
                              (Retard: {Math.abs(getDaysUntil(projet.dateFin))}j)
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Montant HT</p>
                      <p className="text-sm font-medium">{formatCurrency(projet.montantHT)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avancement</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress
                          value={projet.avancement}
                          className="h-2 flex-1"
                        />
                        <span className="text-sm font-medium">{projet.avancement}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/projets/${projet.id}`)
                    }}>
                      <Eye className="mr-2 h-4 w-4" />
                      Voir détails
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/projets/${projet.id}/modifier`)
                    }}>
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                      <Copy className="mr-2 h-4 w-4" />
                      Dupliquer
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Aucun projet trouvé</p>
            <p className="text-sm text-muted-foreground">
              Modifiez vos filtres ou créez un nouveau projet
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}