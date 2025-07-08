'use client'

import { OrdreInfoTab } from '@/components/production/ordre-info-tab'
import { OrdreMateriauxTab } from '@/components/production/ordre-materiaux-tab'
import { OrdreOperationsTab } from '@/components/production/ordre-operations-tab'
import { OrdreQualiteTab } from '@/components/production/ordre-qualite-tab'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Calendar, CheckCircle, Clock, Pause, Play, User } from 'lucide-react'
import { useEffect, useState } from 'react'

interface OrdrePageProps {
  params: Promise<{ id: string }>
}

export default function OrdrePage({ params }: OrdrePageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)

  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  if (!resolvedParams) {
    return <div>Chargement...</div>
  }

  const renderStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      planifie: 'outline',
      en_cours: 'default',
      pause: 'warning',
      termine: 'success',
    }

    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
  }

  // Création objet ordre pour les composants (simulation)
  const ordre = {
    id: resolvedParams.id,
    numero: `OF-${resolvedParams.id}`,
    statut: 'en_cours',
    priorite: 'normale',
    avancement: 65,
    description: 'Ordre de fabrication exemple',
    dateDebutPrevue: new Date('2024-01-15'),
    dateFinPrevue: new Date('2024-01-22'),
    operations: [],
    materiaux: [],
    controles: [],
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Ordre OF-{resolvedParams.id}</h1>
            <p className="text-muted-foreground">Structure métallique - Bâtiment industriel</p>
          </div>
        </div>
        {renderStatusBadge('en_cours')}
      </div>

      {/* Résumé */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Début prévu: 15/01/2024</span>
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
          <OrdreInfoTab ordre={ordre} />
        </TabsContent>

        <TabsContent value="operations">
          <OrdreOperationsTab ordre={ordre} />
        </TabsContent>

        <TabsContent value="materiaux">
          <OrdreMateriauxTab ordre={ordre} />
        </TabsContent>

        <TabsContent value="qualite">
          <OrdreQualiteTab ordre={ordre} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
