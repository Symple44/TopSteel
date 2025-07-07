'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Projet } from '@erp/types'
import {
  Calculator,
  CheckCircle,
  Download,
  Edit,
  Euro,
  Eye,
  FileText,
  Plus,
  Send,
  X
} from 'lucide-react'
import { useState } from 'react'

interface ProjetDevisTabProps {
  projet: Projet
}

export function ProjetDevisTab({ projet }: ProjetDevisTabProps) {
  const [selectedDevis, setSelectedDevis] = useState<string | null>(null)

  // Données mockées pour les devis
  const devis = [
    {
      id: '1',
      numero: 'DEV-2025-001',
      version: '1.0',
      dateCreation: new Date('2025-01-15'),
      dateValidite: new Date('2025-02-15'),
      statut: 'ENVOYE',
      montantHT: projet.montantHT || 0,
      montantTTC: projet.montantTTC || 0,
      accepte: false
    },
    {
      id: '2', 
      numero: 'DEV-2025-001',
      version: '1.1',
      dateCreation: new Date('2025-01-20'),
      dateValidite: new Date('2025-02-20'),
      statut: 'ACCEPTE',
      montantHT: (projet.montantHT || 0) * 1.1,
      montantTTC: (projet.montantTTC || 0) * 1.1,
      accepte: true
    }
  ]

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'BROUILLON':
        return <Badge variant="secondary">Brouillon</Badge>
      case 'ENVOYE':
        return <Badge variant="outline">Envoyé</Badge>
      case 'ACCEPTE':
        return <Badge variant="default" className="bg-green-500">Accepté</Badge>
      case 'REFUSE':
        return <Badge variant="destructive">Refusé</Badge>
      case 'EXPIRE':
        return <Badge variant="secondary">Expiré</Badge>
      default:
        return <Badge variant="outline">{statut}</Badge>
    }
  }

  const devisAccepte = devis.find(d => d.accepte)
  const dernierDevis = devis[devis.length - 1]

  return (
    <div className="space-y-6">
      {/* Résumé des devis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Devis total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devis.length}</div>
            <p className="text-xs text-muted-foreground">
              Version actuelle: {dernierDevis?.version}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Montant validé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {devisAccepte ? formatCurrency(devisAccepte.montantHT) : '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              {devisAccepte ? 'HT accepté' : 'Aucun devis accepté'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Statut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {dernierDevis ? getStatutBadge(dernierDevis.statut) : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dernierDevis ? formatDate(dernierDevis.dateCreation) : 'Aucun devis'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Actions</CardTitle>
              <CardDescription>
                Gestion des devis pour ce projet
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau devis
              </Button>
              <Button variant="outline" size="sm">
                <Calculator className="h-4 w-4 mr-2" />
                Calculer
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Liste des devis */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des devis</CardTitle>
          <CardDescription>
            Toutes les versions de devis pour ce projet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Date création</TableHead>
                <TableHead>Validité</TableHead>
                <TableHead>Montant HT</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devis.map((devisItem) => (
                <TableRow key={devisItem.id}>
                  <TableCell className="font-medium">{devisItem.numero}</TableCell>
                  <TableCell>{devisItem.version}</TableCell>
                  <TableCell>{formatDate(devisItem.dateCreation)}</TableCell>
                  <TableCell>{formatDate(devisItem.dateValidite)}</TableCell>
                  <TableCell>{formatCurrency(devisItem.montantHT)}</TableCell>
                  <TableCell>{getStatutBadge(devisItem.statut)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedDevis(devisItem.id)}
                        title="Voir les détails"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        title="Télécharger PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        title="Envoyer par email"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Détails du devis sélectionné */}
      {selectedDevis && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Détails du devis</CardTitle>
                <CardDescription>
                  Devis {selectedDevis} - Version actuelle
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedDevis(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Informations générales</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Numéro:</span>
                    <span>{devis.find(d => d.id === selectedDevis)?.numero}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Version:</span>
                    <span>{devis.find(d => d.id === selectedDevis)?.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date création:</span>
                    <span>{devis.find(d => d.id === selectedDevis)?.dateCreation ? formatDate(devis.find(d => d.id === selectedDevis)!.dateCreation) : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Validité:</span>
                    <span>{devis.find(d => d.id === selectedDevis)?.dateValidite ? formatDate(devis.find(d => d.id === selectedDevis)!.dateValidite) : '—'}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Montants</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant HT:</span>
                    <span className="font-medium">{devis.find(d => d.id === selectedDevis)?.montantHT ? formatCurrency(devis.find(d => d.id === selectedDevis)!.montantHT) : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant TTC:</span>
                    <span className="font-medium">{devis.find(d => d.id === selectedDevis)?.montantTTC ? formatCurrency(devis.find(d => d.id === selectedDevis)!.montantTTC) : '—'}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Statut:</span>
                    <span>{devis.find(d => d.id === selectedDevis)?.statut ? getStatutBadge(devis.find(d => d.id === selectedDevis)!.statut) : '—'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex gap-2">
              <Button size="sm">
                <Download className="h-4 w-4 mr-2" />
                Télécharger PDF
              </Button>
              <Button variant="outline" size="sm">
                <Send className="h-4 w-4 mr-2" />
                Envoyer par email
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}