// packages/ui/src/components/dashboard/activity-feed.tsx
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../base/card'
import { Badge } from '../base/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../base/avatar'
import { formatDateRelative } from '@erp/utils'
import type { User } from '@erp/types'

interface Activity {
  id: string
  type: 'projet_created' | 'ordre_started' | 'stock_alert' | 'client_added' | 'devis_sent'
  title: string
  description: string
  createdAt: Date
  user?: User
  metadata?: Record<string, any>
}

interface ActivityFeedProps {
  activities: Activity[]
  maxItems?: number
  className?: string
}

export function ActivityFeed({ activities, maxItems = 10, className }: ActivityFeedProps) {
  const getActivityIcon = (type: Activity['type']) => {
    const icons = {
      projet_created: '📋',
      ordre_started: '⚙️',
      stock_alert: '⚠️',
      client_added: '👤',
      devis_sent: '💰'
    }
    return icons[type] || '📌'
  }

  const getActivityColor = (type: Activity['type']) => {
    const colors = {
      projet_created: 'bg-blue-50 text-blue-700',
      ordre_started: 'bg-green-50 text-green-700',
      stock_alert: 'bg-red-50 text-red-700',
      client_added: 'bg-purple-50 text-purple-700',
      devis_sent: 'bg-orange-50 text-orange-700'
    }
    return colors[type] || 'bg-gray-50 text-gray-700'
  }

  const displayedActivities = activities.slice(0, maxItems)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Activité récente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayedActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                <span className="text-sm">{getActivityIcon(activity.type)}</span>
              </div>
              
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{activity.title}</p>
                <p className="text-xs text-muted-foreground">{activity.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {formatDateRelative(activity.createdAt)}
                  </span>
                  
                  {activity.user && (
                    <div className="flex items-center space-x-1">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={activity.user.avatar} />
                        <AvatarFallback className="text-xs">
                          {activity.user.nom.charAt(0)}{activity.user.prenom?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        {activity.user.prenom} {activity.user.nom}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {activities.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucune activité récente</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}