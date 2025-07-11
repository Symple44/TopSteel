'use client'

import { Card, CardContent, CardHeader, CardTitle } from '../../../layout'

interface MaterialCardProps {
  data?: unknown
  showActions?: boolean
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

export function MaterialCard({
  data,
  showActions = false,
  onEdit,
  onDelete,
  className,
}: MaterialCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Carte matériau</CardTitle>
      </CardHeader>
      <CardContent>
        {/* TODO: Add Carte matériau display content */}
        <p className="text-muted-foreground">Carte matériau component - Implementation needed</p>

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
