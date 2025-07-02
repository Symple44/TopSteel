// apps/web/src/components/facturation/paiements-table.tsx
'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'

const mockPaiements = [
  {
    id: '1',
    reference: 'PAI-001',
    factureRef: 'FAC-2024-001',
    montant: 18000,
    date: new Date('2024-01-20'),
    mode: 'Virement'
  }
]

export function PaiementsTable() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Référence</TableHead>
            <TableHead>Facture</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Mode</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockPaiements.map((paiement) => (
            <TableRow key={paiement.id}>
              <TableCell>{paiement.reference}</TableCell>
              <TableCell>{paiement.factureRef}</TableCell>
              <TableCell>{formatCurrency(paiement.montant)}</TableCell>
              <TableCell>{formatDate(paiement.date)}</TableCell>
              <TableCell>{paiement.mode}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
