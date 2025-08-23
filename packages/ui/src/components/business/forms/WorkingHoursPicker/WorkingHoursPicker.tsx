'use client'
import { useState, useEffect } from 'react'
import { Clock, Sun, Sunset, Moon, AlertCircle, RotateCcw } from 'lucide-react'
import { cn } from '../../../../lib/utils'
import { Input } from '../../../primitives/input/Input'
import { Button } from '../../../primitives/button/Button'
import { Label } from '../../../forms/label/Label'
import { Badge } from '../../../data-display/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../primitives/select/select'
import { Checkbox } from '../../../primitives/checkbox/checkbox'
export type ShiftType = 'morning' | 'afternoon' | 'night' | 'custom'
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
export interface WorkingHours {
  startTime: string
  endTime: string
  breakStart?: string
  breakEnd?: string
  isActive: boolean
}
export interface WeeklyWorkingHours {
  [key: string]: WorkingHours // monday, tuesday, etc.
}
export interface WorkingHoursValue {
  weeklyHours: WeeklyWorkingHours
  totalHoursPerWeek: number
  shiftType: ShiftType
  allowOvertime: boolean
  overtimeRate?: number
}
interface WorkingHoursPickerProps {
  value?: Partial<WorkingHoursValue>
  onChange?: (value: Partial<WorkingHoursValue>) => void
  required?: boolean
  disabled?: boolean
  label?: string
  helperText?: string
  error?: string
  showBreaks?: boolean
  showOvertime?: boolean
  showTotalHours?: boolean
  allowCustomSchedule?: boolean
  minHoursPerDay?: number
  maxHoursPerDay?: number
  className?: string
}
const defaultWorkingHours: WorkingHours = {
  startTime: '08:00',
  endTime: '17:00',
  breakStart: '12:00',
  breakEnd: '13:00',
  isActive: true,
}
const shiftPresets = {
  morning: {
    startTime: '06:00',
    endTime: '14:00',
    breakStart: '10:00',
    breakEnd: '10:15',
  },
  afternoon: {
    startTime: '14:00',
    endTime: '22:00',
    breakStart: '18:00',
    breakEnd: '18:15',
  },
  night: {
    startTime: '22:00',
    endTime: '06:00',
    breakStart: '02:00',
    breakEnd: '02:15',
  },
}
const daysOfWeek: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
]
export function WorkingHoursPicker({
  value = {},
  onChange,
  required = false,
  disabled = false,
  label,
  helperText,
  error,
  showBreaks = true,
  showOvertime = false,
  showTotalHours = true,
  allowCustomSchedule = true,
  minHoursPerDay = 1,
  maxHoursPerDay = 12,
  className,
}: WorkingHoursPickerProps) {
  const [workingHours, setWorkingHours] = useState<Partial<WorkingHoursValue>>(
    value.weeklyHours ? value : {
      weeklyHours: daysOfWeek.reduce((acc, day) => {
        acc[day.key] = { ...defaultWorkingHours }
        return acc
      }, {} as WeeklyWorkingHours),
      shiftType: 'custom',
      allowOvertime: false,
      totalHoursPerWeek: 0,
      ...value,
    }
  )
  useEffect(() => {
    setWorkingHours(value.weeklyHours ? value : {
      weeklyHours: daysOfWeek.reduce((acc, day) => {
        acc[day.key] = { ...defaultWorkingHours }
        return acc
      }, {} as WeeklyWorkingHours),
      shiftType: 'custom',
      allowOvertime: false,
      totalHoursPerWeek: 0,
      ...value,
    })
  }, [value])
  useEffect(() => {
    calculateTotalHours()
  }, [workingHours.weeklyHours])
  const calculateTotalHours = () => {
    if (!workingHours.weeklyHours) return
    let total = 0
    Object.values(workingHours.weeklyHours).forEach((hours) => {
      if (hours.isActive) {
        const start = parseTime(hours.startTime)
        const end = parseTime(hours.endTime)
        let duration = end - start
        // Handle overnight shifts
        if (duration < 0) {
          duration += 24 * 60 // Add 24 hours in minutes
        }
        // Subtract break time
        if (showBreaks && hours.breakStart && hours.breakEnd) {
          const breakStart = parseTime(hours.breakStart)
          const breakEnd = parseTime(hours.breakEnd)
          let breakDuration = breakEnd - breakStart
          if (breakDuration < 0) {
            breakDuration += 24 * 60
          }
          duration -= breakDuration
        }
        total += duration / 60 // Convert to hours
      }
    })
    const updatedWorkingHours = {
      ...workingHours,
      totalHoursPerWeek: Math.max(0, total),
    }
    setWorkingHours(updatedWorkingHours)
    onChange?.(updatedWorkingHours)
  }
  const parseTime = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + (minutes || 0)
  }
  const handleShiftChange = (shiftType: ShiftType) => {
    if (shiftType === 'custom' || !workingHours.weeklyHours) {
      const updatedWorkingHours = { ...workingHours, shiftType }
      setWorkingHours(updatedWorkingHours)
      onChange?.(updatedWorkingHours)
      return
    }
    const preset = shiftPresets[shiftType]
    const updatedWeeklyHours = { ...workingHours.weeklyHours }
    daysOfWeek.forEach(day => {
      if (day.key !== 'saturday' && day.key !== 'sunday') {
        updatedWeeklyHours[day.key] = {
          ...updatedWeeklyHours[day.key],
          ...preset,
        }
      }
    })
    const updatedWorkingHours = {
      ...workingHours,
      shiftType,
      weeklyHours: updatedWeeklyHours,
    }
    setWorkingHours(updatedWorkingHours)
    onChange?.(updatedWorkingHours)
  }
  const handleDayHoursChange = (day: DayOfWeek, field: keyof WorkingHours, value: any) => {
    if (!workingHours.weeklyHours) return
    const updatedWeeklyHours = {
      ...workingHours.weeklyHours,
      [day]: {
        ...workingHours.weeklyHours[day],
        [field]: value,
      },
    }
    const updatedWorkingHours = {
      ...workingHours,
      weeklyHours: updatedWeeklyHours,
      shiftType: 'custom' as ShiftType, // Switch to custom when manually editing
    }
    setWorkingHours(updatedWorkingHours)
  }
  const handleCopyToAllDays = (sourceDay: DayOfWeek) => {
    if (!workingHours.weeklyHours) return
    const sourceHours = workingHours.weeklyHours[sourceDay]
    const updatedWeeklyHours = { ...workingHours.weeklyHours }
    daysOfWeek.forEach(day => {
      updatedWeeklyHours[day.key] = { ...sourceHours }
    })
    const updatedWorkingHours = {
      ...workingHours,
      weeklyHours: updatedWeeklyHours,
      shiftType: 'custom' as ShiftType,
    }
    setWorkingHours(updatedWorkingHours)
    onChange?.(updatedWorkingHours)
  }
  const resetToDefaults = () => {
    const defaultWeeklyHours = daysOfWeek.reduce((acc, day) => {
      acc[day.key] = { ...defaultWorkingHours }
      return acc
    }, {} as WeeklyWorkingHours)
    const resetWorkingHours = {
      weeklyHours: defaultWeeklyHours,
      shiftType: 'custom' as ShiftType,
      allowOvertime: false,
      totalHoursPerWeek: 0,
    }
    setWorkingHours(resetWorkingHours)
    onChange?.(resetWorkingHours)
  }
  const getShiftIcon = (shiftType: ShiftType) => {
    switch (shiftType) {
      case 'morning': return Sun
      case 'afternoon': return Sunset
      case 'night': return Moon
      default: return Clock
    }
  }
  const isValidTimeRange = (start: string, end: string): boolean => {
    const startMinutes = parseTime(start)
    const endMinutes = parseTime(end)
    const duration = endMinutes > startMinutes ? endMinutes - startMinutes : (24 * 60) - startMinutes + endMinutes
    const hours = duration / 60
    return hours >= minHoursPerDay && hours <= maxHoursPerDay
  }
  return (
    <div className={cn('space-y-6', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetToDefaults}
            disabled={disabled}
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </Button>
        </div>
      )}
      {/* Shift type selector */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Type d'équipe</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(['morning', 'afternoon', 'night', 'custom'] as ShiftType[]).map((shift) => {
            const ShiftIcon = getShiftIcon(shift)
            const isSelected = workingHours.shiftType === shift
            return (
              <Button
                key={shift}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleShiftChange(shift)}
                disabled={disabled}
                className="justify-start gap-2"
              >
                <ShiftIcon className="h-4 w-4" />
                {shift === 'morning' ? 'Matin' :
                 shift === 'afternoon' ? 'Après-midi' :
                 shift === 'night' ? 'Nuit' : 'Personnalisé'}
              </Button>
            )
          })}
        </div>
      </div>
      {/* Weekly schedule */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Planning hebdomadaire</Label>
        <div className="space-y-3">
          {daysOfWeek.map((day) => {
            const dayHours = workingHours.weeklyHours?.[day.key] || defaultWorkingHours
            const isValid = isValidTimeRange(dayHours.startTime, dayHours.endTime)
            return (
              <div key={day.key} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={dayHours.isActive}
                      onCheckedChange={(checked) => 
                        handleDayHoursChange(day.key, 'isActive', checked === true)
                      }
                      disabled={disabled}
                    />
                    <Label className="font-medium">{day.label}</Label>
                  </div>
                  {allowCustomSchedule && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToAllDays(day.key)}
                      disabled={disabled || !dayHours.isActive}
                      title="Copier sur tous les jours"
                    >
                      Copier
                    </Button>
                  )}
                </div>
                {dayHours.isActive && (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Début</Label>
                      <Input
                        type="time"
                        value={dayHours.startTime}
                        onChange={(e) => handleDayHoursChange(day.key, 'startTime', e.target.value)}
                        disabled={disabled}
                        className={cn(!isValid && 'border-red-500')}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Fin</Label>
                      <Input
                        type="time"
                        value={dayHours.endTime}
                        onChange={(e) => handleDayHoursChange(day.key, 'endTime', e.target.value)}
                        disabled={disabled}
                        className={cn(!isValid && 'border-red-500')}
                      />
                    </div>
                    {showBreaks && (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs">Pause début</Label>
                          <Input
                            type="time"
                            value={dayHours.breakStart || ''}
                            onChange={(e) => handleDayHoursChange(day.key, 'breakStart', e.target.value)}
                            disabled={disabled}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Pause fin</Label>
                          <Input
                            type="time"
                            value={dayHours.breakEnd || ''}
                            onChange={(e) => handleDayHoursChange(day.key, 'breakEnd', e.target.value)}
                            disabled={disabled}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
                {!isValid && dayHours.isActive && (
                  <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Durée invalide (min: {minHoursPerDay}h, max: {maxHoursPerDay}h)
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
      {/* Overtime settings */}
      {showOvertime && (
        <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={workingHours.allowOvertime}
              onCheckedChange={(checked) => {
                const updatedWorkingHours = { ...workingHours, allowOvertime: checked === true }
                setWorkingHours(updatedWorkingHours)
                onChange?.(updatedWorkingHours)
              }}
              disabled={disabled}
            />
            <Label>Autoriser les heures supplémentaires</Label>
          </div>
          {workingHours.allowOvertime && (
            <div className="space-y-2">
              <Label className="text-sm">Taux majoration (%)</Label>
              <Input
                type="number"
                min="0"
                max="200"
                step="5"
                value={workingHours.overtimeRate || 25}
                onChange={(e) => {
                  const updatedWorkingHours = { ...workingHours, overtimeRate: parseInt(e.target.value) || 25 }
                  setWorkingHours(updatedWorkingHours)
                  onChange?.(updatedWorkingHours)
                }}
                disabled={disabled}
                className="w-32"
              />
            </div>
          )}
        </div>
      )}
      {/* Total hours summary */}
      {showTotalHours && (
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Résumé hebdomadaire</span>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <div>
              <span className="text-xs text-muted-foreground">Total heures/semaine:</span>
              <div className="font-mono font-medium">
                {workingHours.totalHoursPerWeek?.toFixed(1) || '0.0'}h
              </div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Jours actifs:</span>
              <div className="font-mono font-medium">
                {workingHours.weeklyHours ? 
                  Object.values(workingHours.weeklyHours).filter(h => h.isActive).length : 0
                }/7
              </div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Équipe:</span>
              <Badge variant="outline" className="text-xs ml-1">
                {workingHours.shiftType === 'morning' ? 'Matin' :
                 workingHours.shiftType === 'afternoon' ? 'Après-midi' :
                 workingHours.shiftType === 'night' ? 'Nuit' : 'Personnalisé'}
              </Badge>
            </div>
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
