'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../data-display'
import { Button } from '../../../primitives/button'

interface InvoicesTableProps {
  data: unknown[]
  loading?: boolean
  onEdit?: (item: unknown) => void
  onDelete?: (item: unknown) => void
}

export function InvoicesTable({
  data = [],
  loading = false,
  onEdit,
  onDelete,
}: InvoicesTableProps) {
  if (loading) {
    return <div className="p-4 text-center">Chargement...</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                Aucun factures trouvé
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => (
              <TableRow key={index}>
                <TableCell>TODO: factures name</TableCell>
                <TableCell>TODO: Status</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onEdit?.(item)}
                      className="text-blue-600 hover:underline"
                    >
                      Modifier
                    </Button>
                    <Button
                      onClick={() => onDelete?.(item)}
                      className="text-red-600 hover:underline"
                    >
                      Supprimer
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
