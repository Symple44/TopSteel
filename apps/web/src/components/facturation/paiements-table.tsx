'use client'

import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@erp/ui'
import { Button } from '@erp/ui'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@erp/ui'
import { Download, Edit, Eye } from 'lucide-react'

// Données mock pour encaissements
const mockEncaissements = [
  {
    id: '1',
    reference: 'ENC-001',
    factureRef: 'FAC-2024-001',
    clientNom: 'Entreprise ABC',
    montant: 18000,
    date: new Date('2024-01-20'),
    mode: 'Virement',
    statut: 'encaisse',
  },
  {
    id: '2',
    reference: 'ENC-002',
    factureRef: 'FAC-2024-003',
    clientNom: 'Société XYZ',
    montant: 7500,
    date: new Date('2024-01-22'),
    mode: 'Chèque',
    statut: 'encaisse',
  },
]

// Données mock pour décaissements
const mockDecaissements = [
  {
    id: '1',
    reference: 'DEC-001',
    factureRef: 'FOUR-2024-001',
    clientNom: 'Fournisseur Acier Plus',
    montant: -5400,
    date: new Date('2024-01-18'),
    mode: 'Virement',
    statut: 'paye',
  },
  {
    id: '2',
    reference: 'DEC-002',
    factureRef: 'FOUR-2024-002',
    clientNom: 'Transport Express',
    montant: -850,
    date: new Date('2024-01-19'),
    mode: 'Prélèvement',
    statut: 'paye',
  },
]

const getStatusBadge = (statut: string) => {
  const config = {
    encaisse: { label: 'Encaissé', variant: 'default' as const },
    paye: { label: 'Payé', variant: 'default' as const },
    en_attente: { label: 'En attente', variant: 'secondary' as const },
    rejete: { label: 'Rejeté', variant: 'destructive' as const },
  }

  const item = config[statut as keyof typeof config] || config.en_attente

  return <Badge variant={item.variant}>{item.label}</Badge>
}

interface PaiementsTableProps {
  type: 'encaissement' | 'decaissement'
  data?: Array<{
    id: string
    reference: string
    factureRef: string
    clientNom: string
    montant: number
    date: Date
    mode: string
    statut: string
  }>
}

export function PaiementsTable({ type, data }: PaiementsTableProps) {
  // Sélection des données selon le type
  const paiements = data || (type === 'encaissement' ? mockEncaissements : mockDecaissements)

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Référence</TableHead>
            <TableHead>{type === 'encaissement' ? 'Client' : 'Fournisseur'}</TableHead>
            <TableHead>Facture</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paiements.map((paiement) => (
            <TableRow key={paiement.id}>
              <TableCell className="font-medium">{paiement.reference}</TableCell>
              <TableCell>{paiement.clientNom}</TableCell>
              <TableCell>{paiement.factureRef}</TableCell>
              <TableCell className={paiement.montant >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(Math.abs(paiement.montant))}
              </TableCell>
              <TableCell>{formatDate(paiement.date)}</TableCell>
              <TableCell>{paiement.mode}</TableCell>
              <TableCell>{getStatusBadge(paiement.statut)}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-1">
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
          {paiements.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                Aucun {type} trouvé
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
