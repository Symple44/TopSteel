// apps/web/src/components/facturation/devis-table.tsx
'use client'

import { Badge } from "@erp/ui"
import { Button } from "@erp/ui"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@erp/ui"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@erp/ui"
import { formatCurrency, formatDate } from '@/lib/utils'
import { Download, Edit, Eye, MoreHorizontal } from 'lucide-react'

// Données mock pour la démo
const mockDevis = [
  {
    id: '1',
    reference: 'DEV-2024-001',
    clientNom: 'Entreprise ABC',
    montantHT: 15000,
    montantTTC: 18000,
    statut: 'accepte',
    dateCreation: new Date('2024-01-15'),
    dateValidite: new Date('2024-02-15'),
  },
  {
    id: '2',
    reference: 'DEV-2024-002',
    clientNom: 'Société XYZ',
    montantHT: 8500,
    montantTTC: 10200,
    statut: 'envoye',
    dateCreation: new Date('2024-01-20'),
    dateValidite: new Date('2024-02-20'),
  },
  {
    id: '3',
    reference: 'DEV-2024-003',
    clientNom: 'SARL Dupont',
    montantHT: 25000,
    montantTTC: 30000,
    statut: 'brouillon',
    dateCreation: new Date('2024-01-25'),
    dateValidite: new Date('2024-02-25'),
  },
]

const getStatusBadge = (statut: string) => {
  const statusConfig = {
    brouillon: { label: 'Brouillon', variant: 'outline' as const },
    envoye: { label: 'Envoyé', variant: 'secondary' as const },
    accepte: { label: 'Accepté', variant: 'default' as const },
    refuse: { label: 'Refusé', variant: 'destructive' as const },
  }

  const config = statusConfig[statut as keyof typeof statusConfig] || statusConfig.brouillon

  return <Badge variant={config.variant}>{config.label}</Badge>
}

interface DevisTableProps {
  data?: typeof mockDevis
}

export function DevisTable({ data = mockDevis }: DevisTableProps) {
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
            <TableHead>Validité</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((devis) => (
            <TableRow key={devis.id}>
              <TableCell className="font-medium">{devis.reference}</TableCell>
              <TableCell>{devis.clientNom}</TableCell>
              <TableCell>{formatCurrency(devis.montantHT)}</TableCell>
              <TableCell>{formatCurrency(devis.montantTTC)}</TableCell>
              <TableCell>{getStatusBadge(devis.statut)}</TableCell>
              <TableCell>{formatDate(devis.dateCreation)}</TableCell>
              <TableCell>{formatDate(devis.dateValidite)}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem>Dupliquer</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Supprimer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}




