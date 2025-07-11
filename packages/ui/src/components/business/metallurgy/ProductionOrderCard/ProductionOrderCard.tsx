'use client'

import { Card, CardContent, CardHeader, CardTitle } from '../../../layout'
import { Button } from '../../../primitives/button'

interface ProductionOrderCardProps {
  data?: unknown
  showActions?: boolean
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

export function ProductionOrderCard({
  data,
  showActions = false,
  onEdit,
  onDelete,
  className,
}: ProductionOrderCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Ordre production</CardTitle>
      </CardHeader>
      <CardContent>
        {/* TODO: Add Ordre production display content */}
        <p className="text-muted-foreground">Ordre production component - Implementation needed</p>

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
