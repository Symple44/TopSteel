'use client'

import { Card, CardContent, CardHeader, CardTitle } from '../../../layout'

interface SalesStatsCardProps {
  data?: unknown
  showActions?: boolean
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

export function SalesStatsCard({ 
  data, 
  showActions = false, 
  onEdit, 
  onDelete, 
  className 
}: SalesStatsCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Statistiques ventes</CardTitle>
      </CardHeader>
      <CardContent>
        {/* TODO: Add Statistiques ventes display content */}
        <p className="text-muted-foreground">
          Statistiques ventes component - Implementation needed
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
