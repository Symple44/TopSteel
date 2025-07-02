'use client'

import { OrdreInfoTab } from '@/components/production/ordre-info-tab'
import { OrdreMateriauxTab } from '@/components/production/ordre-materiaux-tab'
import { OrdreOperationsTab } from '@/components/production/ordre-operations-tab'
import { OrdreQualiteTab } from '@/components/production/ordre-qualite-tab'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, CheckCircle, Edit, Pause } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface OrdreDetailPageProps {
  params: Promise<{ id: string }>
}

export default function OrdreDetailPage({ params }: OrdreDetailPageProps) {
  const router = useRouter()
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  const [ordre, setOrdre] = useState(null) // À remplacer par useOrdre(id)

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  if (!resolvedParams) return <div>Chargement...</div>

  const getStatusBadge = (status: string) => {
    const variants = {
      'planifie': 'secondary',
      'en_cours': 'default',
      'pause': 'destructive',
      'termine': 'success'
    }
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">OF-2024-0001</h1>
            <p className="text-muted-foreground">
              Portail résidentiel - Projet P-123
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {getStatusBadge('en_cours')}
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>
      </div>

      {/* Status et actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Avancement:</span>
                <Progress value={65} className="w-32" />
                <span className="text-sm text-muted-foreground">65%</span>
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>Début: 15/01/2024</span>
                <span>Fin prévue: 22/01/2024</span>
                <span>Technicien: Jean Dupont</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
              <Button size="sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Terminer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onglets */}
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="operations">Opérations</TabsTrigger>
          <TabsTrigger value="materiaux">Matériaux</TabsTrigger>
          <TabsTrigger value="qualite">Qualité</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <OrdreInfoTab ordreId={resolvedParams.id} />
        </TabsContent>

        <TabsContent value="operations">
          <OrdreOperationsTab ordreId={resolvedParams.id} />
        </TabsContent>

        <TabsContent value="materiaux">
          <OrdreMateriauxTab ordreId={resolvedParams.id} />
        </TabsContent>

        <TabsContent value="qualite">
          <OrdreQualiteTab ordreId={resolvedParams.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}