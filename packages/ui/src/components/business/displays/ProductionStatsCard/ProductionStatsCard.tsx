'use client'

import { Card, CardContent, CardHeader, CardTitle } from '../../primitives'

interface ProductionStatsCardProps {
  data?: unknown
  showActions?: boolean
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

export function ProductionStatsCard({ 
  data, 
  showActions = false, 
  onEdit, 
  onDelete, 
  className 
}: ProductionStatsCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Statistiques production</CardTitle>
      </CardHeader>
      <CardContent>
        {/* TODO: Add Statistiques production display content */}
        <p className="text-muted-foreground">
          Statistiques production component - Implementation needed
        </p>
        
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
