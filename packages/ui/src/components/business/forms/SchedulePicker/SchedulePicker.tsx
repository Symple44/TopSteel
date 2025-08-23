'use client'
import { useState, useEffect, useCallback } from 'react'
import { Calendar, Clock, Repeat, AlertTriangle, AlertCircle, Plus, X } from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { Input } from '../../../primitives/input/Input'
import { Button } from '../../../primitives/button/Button'
import { Label } from '../../../forms/label/Label'
import { Badge } from '../../../data-display/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../primitives/select/select'
import { Checkbox } from '../../../primitives/checkbox/checkbox'
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom'
export type ConflictSeverity = 'low' | 'medium' | 'high'
export interface TimeSlot {
  id: string
  startTime: string
  endTime: string
  date: Date
  title?: string
  description?: string
  isRecurring?: boolean
  conflictLevel?: ConflictSeverity
}
export interface RecurrencePattern {
  type: RecurrenceType
  interval: number
  daysOfWeek?: number[]
  endDate?: Date
  maxOccurrences?: number
}
export interface ScheduleConflict {
  id: string
  timeSlot: TimeSlot
  conflictingWith: TimeSlot[]
  severity: ConflictSeverity
  canResolve: boolean
  suggestion?: string
}
interface SchedulePickerProps {
  value?: TimeSlot[]
  onChange?: (value: TimeSlot[]) => void
  onConflictCheck?: (slots: TimeSlot[]) => Promise<ScheduleConflict[]>
  existingSlots?: TimeSlot[]
  required?: boolean
  disabled?: boolean
  label?: string
  helperText?: string
  error?: string
  allowRecurrence?: boolean
  allowMultipleSlots?: boolean
  showConflictWarnings?: boolean
  minDate?: Date
  maxDate?: Date
  workingHoursOnly?: boolean
  workingHours?: { start: string; end: string }
  className?: string
}
export function SchedulePicker({
  value = [],
  onChange,
  onConflictCheck,
  existingSlots = [],
  required = false,
  disabled = false,
  label,
  helperText,
  error,
  allowRecurrence = true,
  allowMultipleSlots = true,
  showConflictWarnings = true,
  minDate,
  maxDate,
  workingHoursOnly = false,
  workingHours = { start: '08:00', end: '18:00' },
  className,
}: SchedulePickerProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(value)
  const [currentSlot, setCurrentSlot] = useState<Partial<TimeSlot>>({})
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>({ type: 'none', interval: 1 })
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([])
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false)
  const [showRecurrence, setShowRecurrence] = useState(false)
  useEffect(() => {
    setTimeSlots(value)
  }, [value])
  useEffect(() => {
    if (showConflictWarnings && onConflictCheck && timeSlots.length > 0) {
      checkConflicts()
    }
  }, [timeSlots, onConflictCheck, showConflictWarnings])
  const checkConflicts = useCallback(async () => {
    if (!onConflictCheck) return
    setIsCheckingConflicts(true)
    try {
      const conflicts = await onConflictCheck([...timeSlots, ...existingSlots])
      setConflicts(conflicts)
    } catch (error) {
      console.error('Error checking conflicts:', error)
    } finally {
      setIsCheckingConflicts(false)
    }
  }, [timeSlots, existingSlots, onConflictCheck])
  const handleAddTimeSlot = () => {
    if (!currentSlot.date || !currentSlot.startTime || !currentSlot.endTime) return
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      date: currentSlot.date,
      startTime: currentSlot.startTime,
      endTime: currentSlot.endTime,
      title: currentSlot.title,
      description: currentSlot.description,
      isRecurring: recurrencePattern.type !== 'none',
    }
    let slots = [newSlot]
    // Generate recurring slots if needed
    if (recurrencePattern.type !== 'none' && allowRecurrence) {
      slots = generateRecurringSlots(newSlot, recurrencePattern)
    }
    const updatedSlots = allowMultipleSlots ? [...timeSlots, ...slots] : slots
    setTimeSlots(updatedSlots)
    onChange?.(updatedSlots)
    // Reset current slot
    setCurrentSlot({})
    setRecurrencePattern({ type: 'none', interval: 1 })
    setShowRecurrence(false)
  }
  const generateRecurringSlots = (baseSlot: TimeSlot, pattern: RecurrencePattern): TimeSlot[] => {
    const slots: TimeSlot[] = [baseSlot]
    const startDate = new Date(baseSlot.date)
    let currentDate = new Date(startDate)
    const maxSlots = pattern.maxOccurrences || 50
    const endDate = pattern.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year default
    for (let i = 1; i < maxSlots && currentDate <= endDate; i++) {
      if (pattern.type === 'daily') {
        currentDate.setDate(currentDate.getDate() + pattern.interval)
      } else if (pattern.type === 'weekly') {
        currentDate.setDate(currentDate.getDate() + (7 * pattern.interval))
      } else if (pattern.type === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + pattern.interval)
      }
      // Check if date is in working days if required
      if (workingHoursOnly && pattern.daysOfWeek) {
        const dayOfWeek = currentDate.getDay()
        if (!pattern.daysOfWeek.includes(dayOfWeek)) continue
      }
      slots.push({
        ...baseSlot,
        id: `${baseSlot.id}_${i}`,
        date: new Date(currentDate),
      })
    }
    return slots
  }
  const handleRemoveTimeSlot = (slotId: string) => {
    const updatedSlots = timeSlots.filter(slot => slot.id !== slotId)
    setTimeSlots(updatedSlots)
    onChange?.(updatedSlots)
  }
  const formatTime = (time: string) => {
    return time.slice(0, 5) // Remove seconds if present
  }
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }
  const parseDate = (dateString: string): Date => {
    return new Date(dateString)
  }
  const isTimeInWorkingHours = (time: string): boolean => {
    if (!workingHoursOnly) return true
    return time >= workingHours.start && time <= workingHours.end
  }
  const getConflictSeverityColor = (severity: ConflictSeverity) => {
    const colors = {
      low: 'bg-yellow-100 text-yellow-800',
      medium: 'bg-orange-100 text-orange-800',
      high: 'bg-red-100 text-red-800',
    }
    return colors[severity]
  }
  const daysOfWeekOptions = [
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' },
    { value: 0, label: 'Dimanche' },
  ]
  return (
    <div className={cn('space-y-6', className)}>
      {label && (
        <Label className="text-base font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      {/* Add new time slot */}
      <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Nouveau créneau</Label>
          {allowRecurrence && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowRecurrence(!showRecurrence)}
            >
              <Repeat className="h-4 w-4" />
              Récurrence
            </Button>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-sm">Date</Label>
            <Input
              type="date"
              value={currentSlot.date ? formatDate(currentSlot.date) : ''}
              onChange={(e) => setCurrentSlot(prev => ({ ...prev, date: parseDate(e.target.value) }))}
              min={minDate ? formatDate(minDate) : undefined}
              max={maxDate ? formatDate(maxDate) : undefined}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Heure de début</Label>
            <Input
              type="time"
              value={currentSlot.startTime || ''}
              onChange={(e) => {
                const time = e.target.value
                if (isTimeInWorkingHours(time)) {
                  setCurrentSlot(prev => ({ ...prev, startTime: time }))
                }
              }}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Heure de fin</Label>
            <Input
              type="time"
              value={currentSlot.endTime || ''}
              onChange={(e) => {
                const time = e.target.value
                if (isTimeInWorkingHours(time)) {
                  setCurrentSlot(prev => ({ ...prev, endTime: time }))
                }
              }}
              disabled={disabled}
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm">Titre (optionnel)</Label>
            <Input
              value={currentSlot.title || ''}
              onChange={(e) => setCurrentSlot(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Titre du créneau..."
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Description (optionnel)</Label>
            <Input
              value={currentSlot.description || ''}
              onChange={(e) => setCurrentSlot(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description..."
              disabled={disabled}
            />
          </div>
        </div>
        {/* Recurrence settings */}
        {showRecurrence && allowRecurrence && (
          <div className="space-y-4 p-4 border rounded-lg">
            <Label className="text-sm font-medium">Paramètres de récurrence</Label>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm">Type</Label>
                <Select
                  value={recurrencePattern.type}
                  onValueChange={(value) => setRecurrencePattern(prev => ({ ...prev, type: value as RecurrenceType }))}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    <SelectItem value="daily">Quotidienne</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {recurrencePattern.type !== 'none' && (
                <div className="space-y-2">
                  <Label className="text-sm">Intervalle</Label>
                  <Input
                    type="number"
                    min="1"
                    value={recurrencePattern.interval}
                    onChange={(e) => setRecurrencePattern(prev => ({ ...prev, interval: parseInt(e.target.value) || 1 }))}
                    disabled={disabled}
                  />
                </div>
              )}
            </div>
            {recurrencePattern.type === 'weekly' && (
              <div className="space-y-2">
                <Label className="text-sm">Jours de la semaine</Label>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                  {daysOfWeekOptions.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={recurrencePattern.daysOfWeek?.includes(day.value) || false}
                        onCheckedChange={(checked) => {
                          const currentDays = recurrencePattern.daysOfWeek || []
                          const newDays = checked
                            ? [...currentDays, day.value]
                            : currentDays.filter(d => d !== day.value)
                          setRecurrencePattern(prev => ({ ...prev, daysOfWeek: newDays }))
                        }}
                        disabled={disabled}
                      />
                      <Label htmlFor={`day-${day.value}`} className="text-xs">{day.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm">Date de fin (optionnel)</Label>
                <Input
                  type="date"
                  value={recurrencePattern.endDate ? formatDate(recurrencePattern.endDate) : ''}
                  onChange={(e) => setRecurrencePattern(prev => ({ ...prev, endDate: e.target.value ? parseDate(e.target.value) : undefined }))}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Nb max d'occurrences</Label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={recurrencePattern.maxOccurrences || ''}
                  onChange={(e) => setRecurrencePattern(prev => ({ ...prev, maxOccurrences: parseInt(e.target.value) || undefined }))}
                  placeholder="Illimité"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        )}
        <Button
          type="button"
          onClick={handleAddTimeSlot}
          disabled={disabled || !currentSlot.date || !currentSlot.startTime || !currentSlot.endTime}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter le créneau
        </Button>
      </div>
      {/* Current time slots */}
      {timeSlots.length > 0 && (
        <div className="space-y-4">
          <Label className="text-sm font-medium">Créneaux programmés ({timeSlots.length})</Label>
          <div className="space-y-2 max-h-60 overflow-auto">
            {timeSlots.map((slot) => {
              const slotConflicts = conflicts.filter(c => c.timeSlot.id === slot.id)
              const hasConflicts = slotConflicts.length > 0
              return (
                <div
                  key={slot.id}
                  className={cn(
                    'flex items-center justify-between p-3 border rounded-lg',
                    hasConflicts && 'border-orange-300 bg-orange-50'
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">
                        {slot.date.toLocaleDateString('fr-FR')}
                      </span>
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </span>
                      {slot.isRecurring && (
                        <Badge variant="outline" className="text-xs">
                          <Repeat className="h-3 w-3 mr-1" />
                          Récurrent
                        </Badge>
                      )}
                    </div>
                    {slot.title && (
                      <p className="text-sm text-muted-foreground mt-1">{slot.title}</p>
                    )}
                    {hasConflicts && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3 text-orange-600" />
                        <span className="text-xs text-orange-600">
                          {slotConflicts.length} conflit(s) détecté(s)
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveTimeSlot(slot.id)}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {/* Conflict warnings */}
      {showConflictWarnings && conflicts.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            Conflits détectés ({conflicts.length})
            {isCheckingConflicts && (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
            )}
          </Label>
          <div className="space-y-2 max-h-40 overflow-auto">
            {conflicts.map((conflict) => (
              <div key={conflict.id} className="p-3 border rounded-lg bg-red-50 border-red-200">
                <div className="flex items-center gap-2">
                  <Badge className={getConflictSeverityColor(conflict.severity)}>
                    {conflict.severity === 'low' ? 'Faible' :
                     conflict.severity === 'medium' ? 'Moyen' : 'Élevé'}
                  </Badge>
                  <span className="text-sm font-medium">
                    Conflit le {conflict.timeSlot.date.toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {conflict.suggestion && (
                  <p className="text-xs text-muted-foreground mt-1">{conflict.suggestion}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
}
