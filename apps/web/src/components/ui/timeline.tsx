'use client'

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface TimelineItem {
  id: string
  title: string
  description?: string
  date: Date
  status?: 'completed' | 'current' | 'upcoming'
  icon?: ReactNode
  content?: ReactNode
}

interface TimelineProps {
  items: TimelineItem[]
  className?: string
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Ligne verticale */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

      <div className="space-y-6">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const statusStyles = {
            completed: 'bg-green-500 border-green-500',
            current: 'bg-blue-500 border-blue-500',
            upcoming: 'bg-gray-300 border-gray-300',
          }

          return (
            <div key={item.id} className="relative flex items-start">
              {/* Point de la timeline */}
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-4 bg-white relative z-10',
                  statusStyles[item.status || 'upcoming']
                )}
              >
                {item.icon || <div className="h-2 w-2 rounded-full bg-white" />}
              </div>

              {/* Contenu */}
              <div className="ml-4 flex-1 pb-6">
                <div className="flex items-center justify-between">
                  <h3
                    className={cn(
                      'text-sm font-medium',
                      item.status === 'completed' && 'text-green-700',
                      item.status === 'current' && 'text-blue-700',
                      item.status === 'upcoming' && 'text-gray-500'
                    )}
                  >
                    {item.title}
                  </h3>
                  <time className="text-xs text-gray-500">
                    {item.date.toLocaleDateString('fr-FR')}
                  </time>
                </div>

                {item.description && (
                  <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                )}

                {item.content && <div className="mt-2">{item.content}</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
