'use client'

import { ProjetStatut } from '@erp/types'
import {
  AlertCircle,
  ArrowLeft,
  Box,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Euro,
  Factory,
  FileText,
  MoreVertical,
  Package,
  Paperclip,
  Send,
  Trash2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Projet3DTab } from '@/components/projets/projet-3d-tab'
import { ProjetDevisTab } from '@/components/projets/projet-devis-tab'
import { ProjetDocumentsTab } from '@/components/projets/projet-documents-tab'
import { ProjetInfoTab } from '@/components/projets/projet-info-tab'
import { ProjetProductionTab } from '@/components/projets/projet-production-tab'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useProjet } from '@/hooks/use-projets'
import { formatCurrency, formatDate, getDaysUntil } from '@/lib/utils'

// ✅ FIX: Correction des types de paramètres Next.js 13+ - params sont Promise
interface ProjetDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ProjetDetailPage({ params }: ProjetDetailPageProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('general')
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)

  // ✅ FIX: Résolution des paramètres async
  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  const { data: projet, isLoading, error } = useProjet(resolvedParams?.id || '')

  // Attendre la résolution des params
  if (!resolvedParams) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-gray-600">Chargement du projet...</p>
        </div>
      </div>
    )
  }

  if (error || !projet) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium">Projet introuvable</p>
          <p className="text-gray-600">Le projet demandé n'existe pas ou a été supprimé.</p>
          <Button onClick={() => router.push('/projets')} className="mt-4">
            Retour aux projets
          </Button>
        </div>
      </div>
    )
  }

  // ✅ FIX: Mapping COMPLET de tous les statuts ProjetStatut
  const getStatusBadge = (statut: ProjetStatut) => {
    const statusConfig: Record<
      ProjetStatut,
      {
        label: string
        variant: 'outline' | 'secondary' | 'default' | 'destructive'
        icon: React.ComponentType<{ className?: string }>
      }
    > = {
      [ProjetStatut.BROUILLON]: { label: 'Brouillon', variant: 'outline', icon: Edit },
      [ProjetStatut.DEVIS]: { label: 'Devis', variant: 'secondary', icon: FileText },
      [ProjetStatut.EN_ATTENTE]: { label: 'En attente', variant: 'secondary', icon: Clock },
      [ProjetStatut.ACCEPTE]: { label: 'Accepté', variant: 'default', icon: CheckCircle },
      [ProjetStatut.EN_COURS]: { label: 'En cours', variant: 'default', icon: Factory },
      [ProjetStatut.EN_PAUSE]: { label: 'En pause', variant: 'secondary', icon: Clock },
      [ProjetStatut.TERMINE]: { label: 'Terminé', variant: 'default', icon: CheckCircle },
      [ProjetStatut.FACTURE]: { label: 'Facturé', variant: 'default', icon: Euro },
      [ProjetStatut.ANNULE]: { label: 'Annulé', variant: 'destructive', icon: AlertCircle },
    }

    const config = statusConfig[statut]

    if (!config) {
      // Fallback pour statuts non mappés
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {statut}
        </Badge>
      )
    }

    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getProgressColor = (avancement: number) => {
    if (avancement < 30) return 'bg-red-500'
    if (avancement < 70) return 'bg-yellow-500'

    return 'bg-green-500'
  }

  // ✅ FIX: Gestion sécurisée de la propriété length sur devis
  const tabs = [
    { id: 'general', label: 'Informations générales', icon: FileText },
    {
      id: 'devis',
      label: 'Devis',
      icon: Euro,
      badge: Array.isArray(projet.devis) ? projet.devis.length : projet.devis ? 1 : 0,
    },
    { id: 'production', label: 'Production', icon: Factory },
    { id: '3d', label: 'Visualisation 3D', icon: Box },
    {
      id: 'documents',
      label: 'Documents',
      icon: Paperclip,
      badge: Array.isArray(projet.documents) ? projet.documents.length : projet.documents ? 1 : 0,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.push('/projets')}
            className="mb-4 flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux projets
          </button>

          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{projet.reference}</h1>
            {getStatusBadge(projet.statut)}
          </div>
          <p className="mt-2 text-muted-foreground">{projet.description}</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(`/projets/${projet.id}/modifier`)}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Exporter
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Send className="mr-2 h-4 w-4" />
              Envoyer par email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(projet.montantHT || 0)}</div>
            <p className="text-xs text-muted-foreground">HT</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avancement</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projet.avancement || 0}%</div>
            <Progress value={projet.avancement || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Échéance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projet.dateFin ? `${getDaysUntil(projet.dateFin)}j` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {projet.dateFin ? formatDate(projet.dateFin) : 'Non définie'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(projet.documents) ? projet.documents.length : projet.documents ? 1 : 0}
            </div>
            <p className="text-xs text-muted-foreground">Fichiers attachés</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {tab.badge}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general">
          <ProjetInfoTab projet={projet} />
        </TabsContent>

        <TabsContent value="devis">
          {/* ✅ FIX: Utiliser projet={projet} au lieu de projetId */}
          <ProjetDevisTab projet={projet} />
        </TabsContent>

        <TabsContent value="production">
          {/* ✅ FIX: Utiliser projet={projet} au lieu de projetId */}
          <ProjetProductionTab projet={projet} />
        </TabsContent>

        <TabsContent value="documents">
          <ProjetDocumentsTab projetId={projet.id} />
        </TabsContent>

        <TabsContent value="3d">
          {/* ✅ FIX: Utiliser projet={projet} au lieu de projetId */}
          <Projet3DTab projet={projet} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
