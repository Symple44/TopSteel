'use client'

import { useState } from 'react'
import { 
  Upload, 
  Download, 
  Maximize2, 
  RotateCw,
  ZoomIn,
  ZoomOut,
  Move,
  Layers,
  Box,
  Eye,
  EyeOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Projet } from '@/types'

interface Projet3DTabProps {
  projet: Projet
}

export function Projet3DTab({ projet }: Projet3DTabProps) {
  const [showGrid, setShowGrid] = useState(true)
  const [showWireframe, setShowWireframe] = useState(false)
  const [showMeasurements, setShowMeasurements] = useState(true)
  const [opacity, setOpacity] = useState([100])

  // Simulation de présence d'un modèle 3D
  const hasModel = false

  if (!hasModel) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Box className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun modèle 3D</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Importez un modèle 3D pour visualiser la structure métallique du projet
          </p>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Importer un modèle 3D
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            Formats supportés : .obj, .stl, .gltf, .glb
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Visualisation 3D</CardTitle>
              <CardDescription>
                Modèle 3D de la structure métallique
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Remplacer
              </Button>
              <Button variant="outline" size="icon">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative bg-gray-100 dark:bg-gray-900 h-[600px]">
            {/* Zone de visualisation 3D */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Box className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Zone de visualisation 3D
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Intégration Three.js à implémenter
                </p>
              </div>
            </div>

            {/* Contrôles de vue */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <Button variant="secondary" size="icon" className="bg-white/90 hover:bg-white">
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon" className="bg-white/90 hover:bg-white">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon" className="bg-white/90 hover:bg-white">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon" className="bg-white/90 hover:bg-white">
                <Move className="h-4 w-4" />
              </Button>
            </div>

            {/* Informations du modèle */}
            <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-800/90 rounded-lg p-3 text-sm">
              <div className="space-y-1">
                <div className="flex justify-between gap-8">
                  <span className="text-muted-foreground">Polygones:</span>
                  <span className="font-medium">124,567</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-muted-foreground">Dimensions:</span>
                  <span className="font-medium">12m × 8m × 4.5m</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-muted-foreground">Poids estimé:</span>
                  <span className="font-medium">2,450 kg</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Panneau de contrôle */}
      <Card>
        <CardHeader>
          <CardTitle>Options d'affichage</CardTitle>
          <CardDescription>
            Personnalisez la visualisation du modèle 3D
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Options de vue */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Affichage</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-grid" className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Afficher la grille
                  </Label>
                  <Switch
                    id="show-grid"
                    checked={showGrid}
                    onCheckedChange={setShowGrid}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-wireframe" className="flex items-center gap-2">
                    <Box className="h-4 w-4" />
                    Mode filaire
                  </Label>
                  <Switch
                    id="show-wireframe"
                    checked={showWireframe}
                    onCheckedChange={setShowWireframe}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-measurements" className="flex items-center gap-2">
                    <Move className="h-4 w-4" />
                    Afficher les mesures
                  </Label>
                  <Switch
                    id="show-measurements"
                    checked={showMeasurements}
                    onCheckedChange={setShowMeasurements}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Opacité */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Opacité</h4>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">0%</span>
                <Slider
                  value={opacity}
                  onValueChange={setOpacity}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">100%</span>
              </div>
            </div>

            <Separator />

            {/* Calques */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Calques</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Structure principale</span>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Garde-corps</span>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Escalier</span>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Fixations</span>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}