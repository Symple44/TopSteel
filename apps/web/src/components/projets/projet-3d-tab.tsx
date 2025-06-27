'use client'

import { useState } from 'react'
import { 
  Box,
  Eye,
  Download,
  Maximize,
  RefreshCw,
  Grid3X3,
  Layers,
  Ruler,
  Palette
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Projet } from '@/types'

interface Projet3DTabProps {
  projet: Projet
}

export function Projet3DTab({ projet }: Projet3DTabProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showGrid, setShowGrid] = useState(true)

  const handleResetView = () => {
    console.log('Reset view')
  }

  const handleFullscreen = () => {
    console.log('Fullscreen')
  }

  return (
    <div className="space-y-6">
      {/* Contrôles de la vue 3D */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Vue 3D du projet</h2>
          <p className="text-sm text-muted-foreground">
            Visualisation tridimensionnelle et outils de mesure
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowGrid(!showGrid)}>
            <Grid3X3 className="h-4 w-4 mr-2" />
            Grille
          </Button>
          <Button variant="outline" size="sm">
            <Ruler className="h-4 w-4 mr-2" />
            Mesures
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Viewer 3D principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Box className="h-5 w-5 mr-2" />
                  Vue principale
                </CardTitle>
                <div className="flex space-x-1">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleResetView}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleFullscreen}>
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative bg-gray-100 dark:bg-gray-800 aspect-video rounded-b-lg overflow-hidden">
                {/* Placeholder pour le viewer 3D */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {isLoading ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-sm text-muted-foreground">Chargement du modèle 3D...</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Box className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Viewer 3D - Modèle en cours de développement
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {projet.reference}
                      </p>
                    </div>
                  )}
                </div>

                {/* Informations overlay */}
                {!isLoading && (
                  <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded text-sm">
                    <div>Vue: Perspective</div>
                    <div>Zoom: 100%</div>
                    <div>Position: 0, 0, 0</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panneau latéral */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Couches</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Structure</span>
                <Badge variant="outline">Visible</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Bardage</span>
                <Badge variant="outline">Visible</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Fondations</span>
                <Badge variant="secondary">Masqué</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Propriétés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Dimensions:</span>
                <div>12m × 8m × 4m</div>
              </div>
              <div>
                <span className="text-muted-foreground">Surface:</span>
                <div>96 m²</div>
              </div>
              <div>
                <span className="text-muted-foreground">Volume:</span>
                <div>384 m³</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Instructions d'utilisation */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Navigation</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Clic gauche + glisser: Rotation</li>
                <li>• Molette: Zoom</li>
                <li>• Clic droit + glisser: Panoramique</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Raccourcis</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• G: Afficher/masquer grille</li>
                <li>• W: Mode wireframe</li>
                <li>• M: Afficher mesures</li>
                <li>• F: Plein écran</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Export</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• PNG: Image haute résolution</li>
                <li>• GLB: Modèle 3D</li>
                <li>• PDF: Vue avec annotations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


