'use client'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@erp/ui'
import { AlertTriangle, Check, Clock, Download, Star, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from '@/hooks/use-toast'

interface ModuleDetailsDialogProps {
  module: {
    id: string
    moduleKey: string
    displayName: string
    description: string
    shortDescription?: string
    category: string
    version: string
    publisher: string
    pricing: {
      type: string
      amount?: number
      currency?: string
      period?: string
      description?: string
    }
    icon?: string
    downloadCount: number
    ratingAverage: number
    ratingCount: number
    isInstalled?: boolean
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MOCK_RATINGS = [
  {
    id: '1',
    rating: 5,
    comment:
      "Excellent module, nous a fait économiser beaucoup de temps sur le recrutement. L'intégration avec Indeed fonctionne parfaitement.",
    author: 'Marie D.',
    company: 'Métallerie Bordeaux',
    date: '2024-01-15',
    helpful: 12,
  },
  {
    id: '2',
    rating: 4,
    comment: 'Très bon module, quelques bugs mineurs au début mais le support est réactif.',
    author: 'Pierre M.',
    company: 'Steel Works Lyon',
    date: '2024-01-10',
    helpful: 8,
  },
  {
    id: '3',
    rating: 5,
    comment: 'Interface intuitive et gain de temps considérable. Recommandé !',
    author: 'Sophie L.',
    company: 'Fer & Acier Nice',
    date: '2024-01-05',
    helpful: 15,
  },
]

const MOCK_FEATURES = [
  'Agrégation automatique depuis HelloWork, Indeed, LinkedIn Jobs',
  'Filtrage intelligent des candidatures par critères',
  'Scoring automatique des profils candidats',
  'Notifications en temps réel des nouvelles candidatures',
  'Interface de gestion centralisée',
  'Export des données vers Excel/CSV',
  'Intégration avec le système de notifications TopSteel',
]

const MOCK_REQUIREMENTS = [
  'TopSteel ERP v2.0 ou supérieur',
  'Module Notifications activé',
  'Connexion Internet stable',
  "Droits administrateur pour l'installation",
]

export function ModuleDetailsDialog({ module, open, onOpenChange }: ModuleDetailsDialogProps) {
  const [isInstalling, setIsInstalling] = useState(false)

  const handleInstall = async () => {
    setIsInstalling(true)

    // Simulation d'installation
    setTimeout(() => {
      setIsInstalling(false)
      toast({
        title: 'Installation réussie',
        description: `Le module ${module.displayName} a été installé avec succès.`,
      })
      onOpenChange(false)
    }, 3000)
  }

  const formatPrice = (pricing: typeof module.pricing) => {
    switch (pricing.type) {
      case 'FREE':
        return 'Gratuit'
      case 'ONE_TIME':
        return `${pricing.amount}${pricing.currency} (paiement unique)`
      case 'SUBSCRIPTION': {
        const period = pricing.period === 'YEAR' ? 'an' : 'mois'
        return `${pricing.amount}${pricing.currency}/${period}`
      }
      case 'COMMISSION':
        return 'Commission sur les économies réalisées'
      case 'USAGE_BASED':
        return "Facturation basée sur l'usage"
      default:
        return 'Prix sur demande'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{module.displayName}</DialogTitle>
              <DialogDescription className="text-base mt-2">
                par {module.publisher} • Version {module.version}
              </DialogDescription>
            </div>
            {module.isInstalled && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                Installé
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{module.ratingAverage}</span>
              <span>({module.ratingCount} avis)</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              <span>{module?.downloadCount?.toLocaleString()} téléchargements</span>
            </div>
            <Badge variant="outline">{module.category}</Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Aperçu</TabsTrigger>
            <TabsTrigger value="features">Fonctionnalités</TabsTrigger>
            <TabsTrigger value="requirements">Prérequis</TabsTrigger>
            <TabsTrigger value="reviews">Avis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground leading-relaxed">{module.description}</p>
            </div>

            <Separator />

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tarification</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{formatPrice(module.pricing)}</div>
                  {module?.pricing?.description && (
                    <p className="text-sm text-muted-foreground">{module?.pricing?.description}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Version</span>
                    <span>{module.version}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Éditeur</span>
                    <span>{module.publisher}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Catégorie</span>
                    <span>{module.category}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Fonctionnalités principales</h3>
              <div className="grid gap-3">
                {MOCK_FEATURES?.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="requirements" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Prérequis système</h3>
              <div className="grid gap-3">
                {MOCK_REQUIREMENTS?.map((requirement) => (
                  <div key={requirement} className="flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{requirement}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Installation</h3>
              <p className="text-sm text-muted-foreground mb-4">
                L'installation de ce module prendra environ 5-10 minutes et nécessitera un
                redémarrage des services. Vos données existantes ne seront pas affectées.
              </p>
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <Clock className="h-4 w-4" />
                <span>Temps d'installation estimé: 5-10 minutes</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Avis clients</h3>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{module.ratingAverage}</span>
                <span className="text-muted-foreground">sur 5</span>
              </div>
            </div>

            <div className="space-y-4">
              {MOCK_RATINGS?.map((rating) => (
                <Card key={rating.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={`star-${rating.id}-${star}`}
                              className={`h-3 w-3 ${
                                star <= rating.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-medium text-sm">{rating.author}</span>
                        <span className="text-xs text-muted-foreground">• {rating.company}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(rating.date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{rating.comment}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <button
                        type="button"
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        <Users className="h-3 w-3" />
                        {rating.helpful} personnes ont trouvé cet avis utile
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-6 border-t">
          <div className="text-sm text-muted-foreground">
            En installant ce module, vous acceptez les conditions d'utilisation.
          </div>

          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>

            {module.isInstalled ? (
              <Button type="button" disabled>
                <Check className="mr-2 h-4 w-4" />
                Déjà installé
              </Button>
            ) : (
              <Button type="button" onClick={handleInstall} disabled={isInstalling}>
                {isInstalling ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Installation...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Installer
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
