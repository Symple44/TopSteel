;('use client')

import { PlanningCalendar } from '@/components/production/planning-calendar'
import { PlanningGantt } from '@/components/production/planning-gantt'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@erp/ui'
import { Calendar, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
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

interface PlanningEvent {
  id: string
  title: string
  start: Date
  end: Date
  type: 'ordre' | 'maintenance' | 'conge'
  color: string
  ordreId?: number
}

export default function PlanningPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [view, setView] = useState<'gantt' | 'calendar'>('gantt')

  const mockTasks: GanttTask[] = [
    {
      id: '1',
      name: 'Portail résidentiel - Découpe',
      start: new Date(2025, 0, 15),
      end: new Date(2025, 0, 17),
      progress: 75,
      assignee: 'Jean Dupont',
      type: 'operation',
      status: 'in-progress',
    },
  ]

  const mockEvents: PlanningEvent[] = [
    {
      id: '1',
      title: 'Portail résidentiel',
      start: new Date(2025, 0, 15),
      end: new Date(2025, 0, 17),
      type: 'ordre',
      color: '#3b82f6',
      ordreId: 1,
    },
  ]

  const handleTaskClick = (task: GanttTask) => {}

  const handleTaskUpdate = (taskId: string, updates: Partial<GanttTask>) => {}

  const handleEventClick = (event: PlanningEvent) => {}

  const handleDateClick = (date: Date) => {}

  const handleCreateEvent = () => {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Planning Production</h1>
          <p className="text-muted-foreground">
            Visualisation et gestion du planning de fabrication
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtrer
          </Button>
          <Button variant="outline" size="sm">
            Aujourd'hui
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Semaine du {currentWeek.toLocaleDateString()}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentWeek(new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000))
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentWeek(new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000))
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={view} onValueChange={(v: string) => setView(v as 'gantt' | 'calendar')}>
            <TabsList>
              <TabsTrigger value="gantt">Vue Gantt</TabsTrigger>
              <TabsTrigger value="calendar">Vue Calendrier</TabsTrigger>
            </TabsList>

            <TabsContent value="gantt" className="mt-6">
              <PlanningGantt
                tasks={mockTasks}
                onTaskClick={handleTaskClick}
                onTaskUpdate={handleTaskUpdate}
              />
            </TabsContent>

            <TabsContent value="calendar" className="mt-6">
              <PlanningCalendar
                events={mockEvents}
                onEventClick={handleEventClick}
                onDateClick={handleDateClick}
                onCreateEvent={handleCreateEvent}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
