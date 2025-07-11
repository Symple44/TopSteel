'use client'

import { Card, CardContent, CardHeader, CardTitle } from '../../../layout'

interface ClientCardProps {
  data?: unknown
  showActions?: boolean
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

export function ClientCard({
  data,
  showActions = false,
  onEdit,
  onDelete,
  className,
}: ClientCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Carte client</CardTitle>
      </CardHeader>
      <CardContent>
        {/* TODO: Add Carte client display content */}
        <p className="text-muted-foreground">Carte client component - Implementation needed</p>

        {showActions && (
          <div className="flex gap-2 mt-4">
            <button onClick={onEdit} className="text-blue-600 hover:underline">
              Modifier
            </button>
            <button onClick={onDelete} className="text-red-600 hover:underline">
              Supprimer
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
