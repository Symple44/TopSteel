// apps/web/src/components/production/planning-gantt.tsx
'use client'

import { Button, Card, CardContent, CardHeader, CardTitle } from '@erp/ui'

import { BarChart3, Calendar, ZoomIn, ZoomOut } from 'lucide-react'
import { useState } from 'react'

interface GanttTask {
  id: string
  name: string
  start: Date
  end: Date
  progress: number
  dependencies?: string[]
  assignee?: string
  type: 'ordre' | 'operation' | 'maintenance'
  status: 'planned' | 'in-progress' | 'completed' | 'delayed'
}

interface GanttHeader {
  label: string
  date: Date
  isWeekend: boolean
}

interface PlanningGanttProps {
  tasks: GanttTask[]
  currentWeek?: Date
  onTaskClick: (task: GanttTask) => void
  onTaskUpdate: (taskId: string, updates: Partial<GanttTask>) => void
}

export function PlanningGantt({ tasks, onTaskClick, onTaskUpdate }: PlanningGanttProps) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [viewMode, setViewMode] = useState<'days' | 'weeks' | 'months'>('weeks')

  const generateTimelineHeaders = (): GanttHeader[] => {
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0)

    const headers: GanttHeader[] = []
    const current = new Date(startDate)

    while (current <= endDate) {
      if (viewMode === 'days') {
        headers.push({
          label: current.getDate().toString(),
          date: new Date(current),
          isWeekend: current.getDay() === 0 || current.getDay() === 6,
        })
        current.setDate(current.getDate() + 1)
      } else if (viewMode === 'weeks') {
        headers.push({
          label: `S${Math.ceil(current.getDate() / 7)}`,
          date: new Date(current),
          isWeekend: false,
        })
        current.setDate(current.getDate() + 7)
      } else {
        headers.push({
          label: current.toLocaleDateString('fr-FR', { month: 'short' }),
          date: new Date(current),
          isWeekend: false,
        })
        current.setMonth(current.getMonth() + 1)
      }
    }

    return headers
  }

  const calculateTaskPosition = (task: GanttTask, headers: GanttHeader[]) => {
    const startDate = headers[0]?.date || new Date()
    const dayWidth = 40 * zoomLevel

    const startDiff = Math.floor(
      (task.start.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    const duration = Math.floor((task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24))

    return {
      left: Math.max(0, startDiff * dayWidth),
      width: Math.max(dayWidth, duration * dayWidth),
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'in-progress':
        return 'bg-blue-500'
      case 'delayed':
        return 'bg-red-500'
      default:
        return 'bg-gray-400'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ordre':
        return '📋'
      case 'operation':
        return '⚙️'
      case 'maintenance':
        return '🔧'
      default:
        return '📝'
    }
  }

  const headers = generateTimelineHeaders()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Diagramme de Gantt
          </CardTitle>

          <div className="flex items-center gap-2">
            {/* Mode d'affichage */}
            <div className="flex border rounded-md">
              {(['days', 'weeks', 'months'] as const).map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode(mode)}
                  className="rounded-none first:rounded-l-md last:rounded-r-md"
                >
                  {mode === 'days' ? 'Jours' : mode === 'weeks' ? 'Semaines' : 'Mois'}
                </Button>
              ))}
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                disabled={zoomLevel <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm min-w-[50px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}
                disabled={zoomLevel >= 2}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto border rounded-lg">
          {/* En-tête timeline */}
          <div className="flex border-b bg-gray-50">
            <div className="w-64 p-3 border-r font-medium">Tâches</div>
            <div className="flex">
              {headers.map((header, index) => (
                <div
                  key={header.date.toISOString()}
                  className={`p-2 text-center text-sm border-r min-w-[40px] ${
                    header.isWeekend ? 'bg-gray-100' : ''
                  }`}
                  style={{ width: `${40 * zoomLevel}px` }}
                >
                  {header.label}
                </div>
              ))}
            </div>
          </div>

          {/* Lignes des tâches */}
          <div className="space-y-1">
            {tasks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune tâche planifiée</p>
                <p className="text-sm">Les tâches apparaîtront ici une fois créées</p>
              </div>
            ) : (
              tasks.map((task) => {
                const position = calculateTaskPosition(task, headers)

                return (
                  <div key={task.id} className="flex border-b hover:bg-gray-50 transition-colors">
                    {/* Colonne nom de tâche */}
                    <div className="w-64 p-3 border-r flex items-center gap-2">
                      <span className="text-lg">{getTypeIcon(task.type)}</span>
                      <div>
                        <div className="font-medium text-sm">{task.name}</div>
                        {task.assignee && (
                          <div className="text-xs text-gray-500">{task.assignee}</div>
                        )}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div
                      className="relative flex-1 p-2"
                      style={{ minWidth: `${headers.length * 40 * zoomLevel}px` }}
                    >
                      <button
                        type="button"
                        className={`absolute top-2 bottom-2 rounded cursor-pointer transition-all hover:opacity-80 ${getStatusColor(task.status)}`}
                        style={{
                          left: `${position.left}px`,
                          width: `${position.width}px`,
                        }}
                        onClick={() => onTaskClick(task)}
                        aria-label={`Tâche: ${task.name} - ${task.progress}%`}
                        title={`${task.name} - ${task.progress}%`}
                      >
                        {/* Barre de progression */}
                        <div
                          className="h-full bg-white bg-opacity-30 rounded"
                          style={{ width: `${task.progress}%` }}
                        />

                        {/* Texte dans la barre */}
                        <div className="absolute inset-0 flex items-center px-2">
                          <span className="text-white text-xs font-medium truncate">
                            {task.progress}%
                          </span>
                        </div>
                      </button>

                      {/* Dépendances (lignes de connexion) */}
                      {task.dependencies?.map((depId) => {
                        const depTask = tasks.find((t) => t.id === depId)

                        if (!depTask) return null

                        const depPosition = calculateTaskPosition(depTask, headers)

                        return (
                          <div
                            key={depId}
                            className="absolute border-t-2 border-gray-400 border-dashed"
                            style={{
                              left: `${depPosition.left + depPosition.width}px`,
                              width: `${position.left - (depPosition.left + depPosition.width)}px`,
                              top: '50%',
                            }}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Légende */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded" />
            <span>Planifié</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span>En cours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span>Terminé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span>En retard</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
