'use client'

import { Card, CardContent, CardHeader, CardTitle } from '../../../layout'
import { Button } from '../../../primitives/button'

interface InvoiceCardProps {
  data?: unknown
  showActions?: boolean
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

export function InvoiceCard({
  data: _data,
  showActions = false,
  onEdit,
  onDelete,
  className,
}: InvoiceCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Carte facture</CardTitle>
      </CardHeader>
      <CardContent>
        {/* TODO: Add Carte facture display content */}
        <p className="text-muted-foreground">Carte facture component - Implementation needed</p>

        {showActions && (
          <div className="flex gap-2 mt-4">
            <Button onClick={onEdit} className="text-blue-600 hover:underline">
              Modifier
            </Button>
            <Button onClick={onDelete} className="text-red-600 hover:underline">
              Supprimer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
