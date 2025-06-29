'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Projet } from '@erp/types'
import { Box, Download, Eye, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { useState } from 'react'

interface Projet3DTabProps {
  projet: Projet
}

export function Projet3DTab({ projet }: Projet3DTabProps) {
  const [is3DLoaded, setIs3DLoaded] = useState(false)
  const [selectedView, setSelectedView] = useState('front')

  // Simulations de modèles 3D disponibles
  const modeles3D = [
    {
      id: '1',
      nom: 'Vue d\'ensemble structure',
      type: 'global',
      dateModification: new Date('2025-06-20'),
      taille: '15.2 MB',
      format: '.step'
    },
    {
      id: '2', 
      nom: 'Détails assemblage',
      type: 'detail',
      dateModification: new Date('2025-06-18'),
      taille: '8.7 MB',
      format: '.dwg'
    },
    {
      id: '3',
      nom: 'Plan d\'exécution',
      type: 'plan',
      dateModification: new Date('2025-06-15'),
      taille: '4.1 MB',
      format: '.pdf'
    }
  ]

  const vues = [
    { id: 'front', label: 'Vue de face' },
    { id: 'side', label: 'Vue de côté' },
    { id: 'top', label: 'Vue de dessus' },
    { id: 'iso', label: 'Vue isométrique' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Visualisation 3D</h2>
          <p className="text-sm text-muted-foreground">
            Modèles 3D et plans techniques du projet
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Télécharger modèles
          </Button>
          <Button size="sm">
            <Box className="h-4 w-4 mr-2" />
            Nouvelle version
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Viewer 3D */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Box className="h-5 w-5" />
                  Visualiseur 3D
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                {!is3DLoaded ? (
                  <div className="text-center">
                    <Box className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">Viewer 3D non encore implémenté</p>
                    <Button 
                      onClick={() => setIs3DLoaded(true)}
                      size="sm"
                    >
                      Simuler chargement 3D
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="bg-blue-100 border-2 border-dashed border-blue-300 rounded-lg p-8">
                      <Box className="h-12 w-12 mx-auto text-blue-600 mb-2" />
                      <p className="text-blue-800 font-medium">Modèle 3D chargé</p>
                      <p className="text-blue-600 text-sm">{projet.reference} - Structure métallique</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Contrôles de vue */}
              <div className="flex gap-2 mt-4">
                {vues.map((vue) => (
                  <Button
                    key={vue.id}
                    variant={selectedView === vue.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedView(vue.id)}
                  >
                    {vue.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des modèles */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Modèles disponibles</CardTitle>
              <CardDescription>
                Fichiers 3D et plans techniques
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {modeles3D.map((modele) => (
                  <div 
                    key={modele.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setIs3DLoaded(true)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{modele.nom}</p>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {modele.format}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{modele.taille}</span>
                      <span>{modele.dateModification.toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Informations du modèle */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Propriétés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Échelle:</span>
                  <span>1:100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Unités:</span>
                  <span>Millimètres</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Matériau:</span>
                  <span>Acier S355</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Poids total:</span>
                  <span>2.4 tonnes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dernière modif:</span>
                  <span>20/06/2025</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions d'utilisation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Navigation 3D:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Clic gauche + glisser: Rotation</li>
                <li>• Molette: Zoom avant/arrière</li>
                <li>• Clic droit + glisser: Panoramique</li>
                <li>• Double-clic: Centrer la vue</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Outils disponibles:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Mesures et cotations</li>
                <li>• Coupes et sections</li>
                <li>• Vues explosées</li>
                <li>• Export vers CAO</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}