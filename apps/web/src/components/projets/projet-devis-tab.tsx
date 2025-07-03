'use client'

import { useState } from 'react'
import { useBusinessMetrics } from '@/lib/monitoring/business-metrics'
  FileText, 
  Download, 
  Send, 
  Eye,
  Plus,
  Edit,
  Trash2,
  Calculator,
  Euro,
  Calendar,
  CheckCircle,
  Clock,
  X
import {
  FileText,
  Download,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Projet } from '@/types'

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
      montantHT: projet.montantHT,
      montantTTC: projet.montantTTC,
      accepte: false
    },
    {
      id: '2', 
      numero: 'DEV-2025-001',
      version: '1.1',
      dateCreation: new Date('2025-01-20'),
      dateValidite: new Date('2025-02-20'),
      statut: 'ACCEPTE',
      montantHT: projet.montantHT * 1.1,
      montantTTC: projet.montantTTC * 1.1,
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
        return <Badge variant="default">Accepté</Badge>
      case 'REFUSE':
        return <Badge variant="destructive">Refusé</Badge>
      default:
        return <Badge variant="secondary">{statut}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Devis et chiffrages</h2>
          <p className="text-sm text-muted-foreground">
            Gestion des devis pour ce projet
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Calculator className="h-4 w-4 mr-2" />
            Nouveau chiffrage
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau devis
          </Button>
        </div>
      </div>

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
                <TableHead>Date</TableHead>
                <TableHead>Validité</TableHead>
                <TableHead>Montant HT</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devis.map((devis) => (
                <TableRow key={devis.id}>
                  <TableCell className="font-medium">{devis.numero}</TableCell>
                  <TableCell>{devis.version}</TableCell>
                  <TableCell>{formatDate(devis.dateCreation)}</TableCell>
                  <TableCell>{formatDate(devis.dateValidite)}</TableCell>
                  <TableCell>{formatCurrency(devis.montantHT)}</TableCell>
                  <TableCell>{getStatutBadge(devis.statut)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Send className="h-4 w-4" />
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
            <CardTitle>Détails du devis</CardTitle>
            <CardDescription>
              Devis {selectedDevis} - Version actuelle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Détails du devis sélectionné...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
