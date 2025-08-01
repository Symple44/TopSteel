'use client'

export const dynamic = 'force-dynamic'

import {
  Calculator,
  Database,
  Download,
  Lock,
  Play,
  Search,
  Settings,
  Table,
  Users,
  Zap,
} from 'lucide-react'
import { Badge } from '@erp/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@erp/ui'

export default function QueryBuilderDocsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Guide d'utilisation Query Builder</h1>
          <p className="text-lg text-muted-foreground">
            Créez des requêtes complexes de manière visuelle et interactive
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Vue d'ensemble
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Le Query Builder permet de créer des requêtes SQL complexes sans écrire de code. Il
                offre une interface intuitive pour sélectionner des tables, configurer des
                jointures, ajouter des champs calculés et exécuter les requêtes.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Interface visuelle</Badge>
                <Badge variant="secondary">Drag & Drop</Badge>
                <Badge variant="secondary">SQL automatique</Badge>
                <Badge variant="secondary">Export multi-format</Badge>
                <Badge variant="secondary">Permissions granulaires</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Démarrage rapide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold">Créer un nouveau Query Builder</h4>
                    <p className="text-sm text-muted-foreground">
                      Cliquez sur "Nouveau Query Builder" dans la sidebar ou visitez{' '}
                      <code>/query-builder/test</code> pour un exemple.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold">Sélectionner les tables</h4>
                    <p className="text-sm text-muted-foreground">
                      Choisissez votre table principale et configurez les jointures avec d'autres
                      tables.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold">Configurer les colonnes</h4>
                    <p className="text-sm text-muted-foreground">
                      Glissez-déposez les colonnes, configurez leur visibilité et leurs propriétés.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold">Exécuter et tester</h4>
                    <p className="text-sm text-muted-foreground">
                      Prévisualisez le SQL généré et exécutez la requête pour voir les résultats.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table className="h-5 w-5" />
                  Fonctionnalités principales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Search className="h-4 w-4" />
                  <span>Sélecteur de tables interactif</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Settings className="h-4 w-4" />
                  <span>Configuration des jointures</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calculator className="h-4 w-4" />
                  <span>Champs calculés personnalisés</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Play className="h-4 w-4" />
                  <span>Exécution temps réel</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Download className="h-4 w-4" />
                  <span>Export CSV, Excel, JSON, PDF</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Sécurité et permissions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  <span>Contrôle d'accès par utilisateur</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Lock className="h-4 w-4" />
                  <span>Permissions par rôle</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Database className="h-4 w-4" />
                  <span>Limite du nombre de lignes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Settings className="h-4 w-4" />
                  <span>Query Builders publics/privés</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Configuration des jointures</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Le Query Builder supporte différents types de jointures :
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Badge>INNER JOIN</Badge>
                  <p className="text-sm">
                    Retourne uniquement les lignes qui ont des correspondances dans les deux tables.
                  </p>
                </div>
                <div className="space-y-2">
                  <Badge>LEFT JOIN</Badge>
                  <p className="text-sm">
                    Retourne toutes les lignes de la table de gauche, même sans correspondance.
                  </p>
                </div>
                <div className="space-y-2">
                  <Badge>RIGHT JOIN</Badge>
                  <p className="text-sm">
                    Retourne toutes les lignes de la table de droite, même sans correspondance.
                  </p>
                </div>
                <div className="space-y-2">
                  <Badge>FULL JOIN</Badge>
                  <p className="text-sm">
                    Retourne toutes les lignes des deux tables, avec ou sans correspondance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Champs calculés
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Créez des champs personnalisés en utilisant des expressions et des formules :
              </p>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div>
                  <strong>Calcul de marge :</strong>
                  <code className="ml-2 bg-background px-2 py-1 rounded">[price] - [cost]</code>
                </div>
                <div>
                  <strong>Pourcentage de marge :</strong>
                  <code className="ml-2 bg-background px-2 py-1 rounded">
                    (([price] - [cost]) / [price]) * 100
                  </code>
                </div>
                <div>
                  <strong>Total avec remise :</strong>
                  <code className="ml-2 bg-background px-2 py-1 rounded">
                    [quantity] * [unit_price] * (1 - [discount] / 100)
                  </code>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Utilisez les noms des colonnes entre crochets <code>[nom_colonne]</code> pour
                référencer les valeurs.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Intégration dans l'ERP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Une fois créé et testé, votre Query Builder peut être intégré directement dans :
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>Fenêtres de l'ERP comme composant DataTable</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>Écrans principaux de menus pour la consultation</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>Rapports et dashboards personnalisés</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>APIs REST pour d'autres applications</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
