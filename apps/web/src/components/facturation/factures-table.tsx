// apps/web/src/components/facturation/factures-table.tsx
'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Download, Edit, Eye } from 'lucide-react'

// Données mock
const mockFactures = [
  {
    id: '1',
    reference: 'FAC-2024-001',
    clientNom: 'Entreprise ABC',
    montantHT: 15000,
    montantTTC: 18000,
    statut: 'payee',
    dateCreation: new Date('2024-01-15'),
    dateEcheance: new Date('2024-02-15'),
  },
  {
    id: '2',
    reference: 'FAC-2024-002',
    clientNom: 'Société XYZ',
    montantHT: 8500,
    montantTTC: 10200,
    statut: 'envoye',
    dateCreation: new Date('2024-01-20'),
    dateEcheance: new Date('2024-02-20'),
  },
]

const getStatusBadge = (statut: string) => {
  const config = {
    brouillon: { label: 'Brouillon', variant: 'outline' as const },
    envoye: { label: 'Envoyée', variant: 'secondary' as const },
    payee: { label: 'Payée', variant: 'default' as const },
    en_retard: { label: 'En retard', variant: 'destructive' as const },
  }

  const item = config[statut as keyof typeof config] || config.brouillon

  return <Badge variant={item.variant}>{item.label}</Badge>
}

interface FacturesTableProps {
  data?: typeof mockFactures
}

export function FacturesTable({ data = mockFactures }: FacturesTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Référence</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Montant HT</TableHead>
            <TableHead>Montant TTC</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date création</TableHead>
            <TableHead>Échéance</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((facture) => (
            <TableRow key={facture.id}>
              <TableCell className="font-medium">{facture.reference}</TableCell>
              <TableCell>{facture.clientNom}</TableCell>
              <TableCell>{formatCurrency(facture.montantHT)}</TableCell>
              <TableCell>{formatCurrency(facture.montantTTC)}</TableCell>
              <TableCell>{getStatusBadge(facture.statut)}</TableCell>
              <TableCell>{formatDate(facture.dateCreation)}</TableCell>
              <TableCell>{formatDate(facture.dateEcheance)}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
