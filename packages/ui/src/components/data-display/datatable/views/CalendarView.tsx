'use client'

import { Calendar, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../../../primitives/button'
import { DropdownItem, DropdownPortal } from '../../../primitives/dropdown-portal'
import { Badge } from '../../badge'
import type { CalendarEvent } from '../use-data-views'

interface CalendarViewProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onEventEdit?: (event: CalendarEvent) => void
  onEventDelete?: (event: CalendarEvent) => void
}

export function CalendarView({
  events,
  onEventClick,
  onEventEdit,
  onEventDelete,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Obtenir le premier et dernier jour du mois
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const firstDayOfWeek = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1

  // Générer les jours du calendrier
  const calendarDays = useMemo(() => {
    const days = []

    // Jours du mois précédent
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(firstDayOfMonth)
      date.setDate(date.getDate() - i - 1)
      days.push({
        date,
        isCurrentMonth: false,
        events: [],
      })
    }

    // Jours du mois actuel
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(currentYear, currentMonth, day)
      const dayEvents = events.filter((event) => {
        const eventStart = new Date(event.start)
        return eventStart.toDateString() === date.toDateString()
      })

      days.push({
        date,
        isCurrentMonth: true,
        events: dayEvents,
      })
    }

    // Jours du mois suivant pour compléter la grille
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth + 1, day)
      days.push({
        date,
        isCurrentMonth: false,
        events: [],
      })
    }

    return days
  }, [currentMonth, currentYear, events, firstDayOfMonth, lastDayOfMonth, firstDayOfWeek])

  const monthNames = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ]

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  const previousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <div className="text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-1">Aucun événement dans le calendrier</p>
          <p className="text-sm">Ajustez vos filtres ou ajoutez des données</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête du calendrier */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {monthNames[currentMonth]} {currentYear}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Aujourd'hui
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grille du calendrier */}
      <div className="border border-border rounded-lg overflow-hidden">
        {/* En-têtes des jours */}
        <div className="grid grid-cols-7 bg-muted/30">
          {dayNames.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-medium text-muted-foreground border-r border-border last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Jours du calendrier */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => (
            <div
              key={`calendar-day-${day.date.getTime()}-${index}`}
              className={`min-h-[100px] p-2 border-r border-b border-border last:border-r-0 ${
                day.isCurrentMonth
                  ? 'bg-background hover:bg-muted/20'
                  : 'bg-muted/10 text-muted-foreground'
              } ${
                day.date.toDateString() === new Date().toDateString()
                  ? 'bg-blue-50 border-blue-200'
                  : ''
              }`}
            >
              {/* Numéro du jour */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-sm font-medium ${
                    day.date.toDateString() === new Date().toDateString()
                      ? 'text-blue-600'
                      : day.isCurrentMonth
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                  }`}
                >
                  {day.date.getDate()}
                </span>
                {day.events.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{day.events.length - 3}
                  </Badge>
                )}
              </div>

              {/* Événements */}
              <div className="space-y-1">
                {day.events.slice(0, 3).map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    className="group relative bg-background border border-border rounded px-2 py-1 cursor-pointer hover:shadow-sm transition-shadow w-full text-left"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick?.(event)
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: event.color || '#6b7280' }}
                      />
                      <span className="text-xs font-medium truncate flex-1">{event.title}</span>

                      <DropdownPortal
                        align="end"
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 h-auto w-auto p-0.5"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation()
                            }}
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        }
                      >
                        {onEventEdit && (
                          <DropdownItem onClick={() => onEventEdit(event)}>Modifier</DropdownItem>
                        )}
                        {onEventDelete && (
                          <DropdownItem
                            onClick={() => onEventDelete(event)}
                            className="text-red-600"
                          >
                            Supprimer
                          </DropdownItem>
                        )}
                      </DropdownPortal>
                    </div>

                    {event.category && (
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        {event.category}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Légende des événements */}
      {events.length > 0 && (
        <div className="bg-muted/20 rounded-lg p-4">
          <h3 className="text-sm font-medium mb-2">
            Événements ce mois-ci (
            {
              events.filter((e) => {
                const eventDate = new Date(e.start)
                return (
                  eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
                )
              }).length
            }
            )
          </h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(events.map((e) => e.category).filter(Boolean))).map((category) => {
              const categoryEvents = events.filter((e) => e.category === category)
              const color = categoryEvents[0]?.color || '#6b7280'
              return (
                <Badge
                  key={category}
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: color,
                    color: color,
                    backgroundColor: `${color}10`,
                  }}
                >
                  {category} ({categoryEvents.length})
                </Badge>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarView
