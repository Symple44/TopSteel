// apps/web/src/components/production/planning-calendar.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";

interface PlanningEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'ordre' | 'maintenance' | 'conge';
  color: string;
  ordreId?: number;
}

interface PlanningCalendarProps {
  events: PlanningEvent[];
  onEventClick: (event: PlanningEvent) => void;
  onDateClick: (date: Date) => void;
  onCreateEvent: () => void;
}

export function PlanningCalendar({ events, onEventClick, onDateClick, onCreateEvent }: PlanningCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const _navigateMonth = (direction: 'prev' | 'next') => {
    const _newDate = new Date(currentDate);

    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const _getDaysInMonth = (date: Date) => {
    const _year = date.getFullYear();
    const _month = date.getMonth();
    const _firstDay = new Date(year, month, 1);
    const _lastDay = new Date(year, month + 1, 0);
    const _daysInMonth = lastDay.getDate();
    const _startDay = firstDay.getDay();

    const _days = [];
    
    // Jours du mois précédent
    for (let _i = startDay - 1; i >= 0; i--) {
      const _prevDate = new Date(year, month, -i);

      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Jours du mois actuel
    for (let _day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }

    // Jours du mois suivant pour compléter la grille
    const _remainingDays = 42 - days.length;

    for (let _day = 1; day <= remainingDays; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false });
    }

    return days;
  };

  const _getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const _eventDate = new Date(event.start);

      return eventDate.toDateString() === date.toDateString();
    });
  };

  const _days = getDaysInMonth(currentDate);
  const _monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Planning Production
          </CardTitle>
          <Button onClick={onCreateEvent} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nouveau
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>
          <h3 className="text-lg font-semibold capitalize">{monthName}</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="flex items-center gap-2"
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendrier */}
        <div className="grid grid-cols-7 gap-1">
          {/* En-têtes des jours */}
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}

          {/* Jours du mois */}
          {days.map((day, index) => {
            const _dayEvents = getEventsForDate(day.date);
            const _isToday = day.date.toDateString() === new Date().toDateString();

            return (
              <div
                key={\item-\\}
                className={`
                  min-h-[100px] p-1 border border-gray-200 cursor-pointer hover:bg-gray-50
                  ${!day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
                  ${isToday ? 'bg-blue-50 border-blue-200' : ''}
                `}
                onClick={() => onDateClick(day.date)}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                  {day.date.getDate()}
                </div>
                
                {/* Événements */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={`
                        text-xs p-1 rounded cursor-pointer truncate
                        ${event.type === 'ordre' ? 'bg-blue-100 text-blue-800' : 
                          event.type === 'maintenance' ? 'bg-orange-100 text-orange-800' : 
                          'bg-green-100 text-green-800'}
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayEvents.length - 3} autres
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Légende */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-100 rounded"></div>
            <span>Ordres de fabrication</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-100 rounded"></div>
            <span>Maintenance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 rounded"></div>
            <span>Congés</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
