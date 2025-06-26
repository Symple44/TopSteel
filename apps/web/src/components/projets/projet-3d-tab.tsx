'use client'

import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Slider, Switch } from '@erp/ui'
import {
  Download,
  Eye,
  Grid3X3,
  Maximize,
  RefreshCw,
  RotateCw,
  Settings,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export default function Projet3DTab() {
  const [showGrid, setShowGrid] = useState(true)
  const [showWireframe, setShowWireframe] = useState(false)
  const [showMeasurements, setShowMeasurements] = useState(true)
  const [opacity, setOpacity] = useState(85)
  const [isLoading, setIsLoading] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Simulation du chargement du modèle 3D
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const handleResetView = () => {
    console.log('Reset camera view')
  }

  const handleExport = () => {
    console.log('Export 3D model')
  }

  const handleFullscreen = () => {
    console.log('Toggle fullscreen')
  }

  const controls = [
    { icon: RotateCw, label: 'Rotation libre', action: () => console.log('Rotate') },
    { icon: ZoomIn, label: 'Zoom avant', action: () => console.log('Zoom in') },
    { icon: ZoomOut, label: 'Zoom arrière', action: () => console.log('Zoom out') },
    { icon: RefreshCw, label: 'Reset vue', action: handleResetView },
    { icon: Maximize, label: 'Plein écran', action: handleFullscreen },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Visualisation 3D</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Contrôles */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contrôles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {controls.map((control, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={control.action}
                >
                  <control.icon className="h-4 w-4 mr-2" />
                  {control.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Affichage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="grid-toggle" className="text-sm font-medium">
                  Grille
                </label>
                <Switch
                  id="grid-toggle"
                  checked={showGrid}
                  onCheckedChange={setShowGrid}
                />
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="wireframe-toggle" className="text-sm font-medium">
                  Wireframe
                </label>
                <Switch
                  id="wireframe-toggle"
                  checked={showWireframe}
                  onCheckedChange={setShowWireframe}
                />
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="measurements-toggle" className="text-sm font-medium">
                  Mesures
                </label>
                <Switch
                  id="measurements-toggle"
                  checked={showMeasurements}
                  onCheckedChange={setShowMeasurements}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Opacité: {opacity}%
                </label>
                <Slider
                  value={[opacity]}
                  onValueChange={(values) => setOpacity(values[0])}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Vertices:</span>
                <Badge variant="outline">12,453</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Faces:</span>
                <Badge variant="outline">8,742</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Matériaux:</span>
                <Badge variant="outline">3</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Taille:</span>
                <Badge variant="outline">15.2 MB</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visualiseur 3D */}
        <div className="lg:col-span-3">
          <Card className="h-[600px]">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Modèle 3D - Structure Métallique</CardTitle>
                <div className="flex gap-2">
                  {showGrid && <Badge variant="outline">Grille</Badge>}
                  {showWireframe && <Badge variant="outline">Wireframe</Badge>}
                  {showMeasurements && <Badge variant="outline">Mesures</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-full">
              <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Chargement du modèle 3D...</p>
                    </div>
                  </div>
                ) : (
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                  >
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-white">
                        <Grid3X3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Visualiseur 3D</p>
                        <p className="text-sm opacity-75">
                          Le modèle 3D sera affiché ici une fois Three.js intégré
                        </p>
                      </div>
                    </div>
                  </canvas>
                )}

                {/* Overlay avec informations */}
                {!isLoading && (
                  <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded text-sm">
                    <div>Vue: Perspective</div>
                    <div>Zoom: 100%</div>
                    <div>Position: 0, 0, 0</div>
                  </div>
                )}

                {/* Mini contrôles overlay */}
                {!isLoading && (
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => console.log('Zoom fit')}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="secondary" onClick={handleResetView}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="secondary" onClick={handleFullscreen}>
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Légende et instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Navigation</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Clic gauche + glisser: Rotation</li>
                <li>• Molette: Zoom</li>
                <li>• Clic droit + glisser: Panoramique</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Raccourcis</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• G: Afficher/masquer grille</li>
                <li>• W: Mode wireframe</li>
                <li>• M: Afficher mesures</li>
                <li>• F: Plein écran</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Export</h4>
              <ul className="space-y-1 text-gray-600">
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