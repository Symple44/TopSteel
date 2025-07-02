'use client'

import { PlanningCalendar } from '@/components/production/planning-calendar'
import { PlanningGantt } from '@/components/production/planning-gantt'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { useState } from 'react'

export default function PlanningPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [view, setView] = useState<'gantt' | 'calendar'>('gantt')

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Navigation semaine */}
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
                onClick={() => setCurrentWeek(new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentWeek(new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList>
              <TabsTrigger value="gantt">Vue Gantt</TabsTrigger>
              <TabsTrigger value="calendar">Vue Calendrier</TabsTrigger>
            </TabsList>
            
            <TabsContent value="gantt" className="mt-6">
              <PlanningGantt currentWeek={currentWeek} />
            </TabsContent>
            
            <TabsContent value="calendar" className="mt-6">
              <PlanningCalendar currentWeek={currentWeek} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}