'use client'

import { Card, CardContent, CardHeader, CardTitle } from '../../primitives'

interface KpiCardProps {
  data?: unknown
  showActions?: boolean
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

export function KpiCard({ 
  data, 
  showActions = false, 
  onEdit, 
  onDelete, 
  className 
}: KpiCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Carte KPI</CardTitle>
      </CardHeader>
      <CardContent>
        {/* TODO: Add Carte KPI display content */}
        <p className="text-muted-foreground">
          Carte KPI component - Implementation needed
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
