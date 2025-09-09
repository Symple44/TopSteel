'use client'
import { AlertCircle, AlertTriangle, Bell, Calendar, Clock, Zap } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Label } from '../../../forms/label/Label'
import { Button } from '../../../primitives/button/Button'
import { Input } from '../../../primitives/input/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../primitives/select/select'
export type UrgencyLevel = 'low' | 'normal' | 'high' | 'critical'
export type ReminderType = 'none' | 'email' | 'notification' | 'both'
export interface DeadlineValue {
  date: Date
  time?: string
  urgency: UrgencyLevel
  reminder?: {
    type: ReminderType
    advance: number // minutes before deadline
    message?: string
  }
  description?: string
}
interface DeadlinePickerProps {
  value?: Partial<DeadlineValue>
  onChange?: (value: Partial<DeadlineValue>) => void
  onReminderTest?: (reminder: DeadlineValue['reminder']) => Promise<boolean>
  required?: boolean
  disabled?: boolean
  label?: string
  helperText?: string
  error?: string
  showUrgency?: boolean
  showReminder?: boolean
  showTimeSelector?: boolean
  minDate?: Date
  maxDate?: Date
  workingDaysOnly?: boolean
  defaultUrgency?: UrgencyLevel
  className?: string
}
export function DeadlinePicker({
  value = {},
  onChange,
  onReminderTest,
  required = false,
  disabled = false,
  label,
  helperText,
  error,
  showUrgency = true,
  showReminder = true,
  showTimeSelector = true,
  minDate,
  maxDate,
  workingDaysOnly = false,
  defaultUrgency = 'normal',
  className,
}: DeadlinePickerProps) {
  const [deadline, setDeadline] = useState<Partial<DeadlineValue>>(
    value.urgency ? value : { ...value, urgency: defaultUrgency }
  )
  const [isTestingReminder, setIsTestingReminder] = useState(false)
  useEffect(() => {
    setDeadline(value.urgency ? value : { ...value, urgency: defaultUrgency })
  }, [value, defaultUrgency])
  const handleDeadlineChange = (field: keyof DeadlineValue, newValue: any) => {
    const updatedDeadline = {
      ...deadline,
      [field]: newValue,
    }
    setDeadline(updatedDeadline)
    onChange?.(updatedDeadline)
  }
  const handleReminderChange = (
    field: keyof NonNullable<DeadlineValue['reminder']>,
    newValue: any
  ) => {
    const currentReminder = deadline.reminder || {
      type: 'none' as ReminderType,
      advance: 0,
      message: '',
    }
    const updatedReminder = {
      ...currentReminder,
      [field]: newValue,
    }
    const updatedDeadline: Partial<DeadlineValue> = {
      ...deadline,
      reminder: updatedReminder,
    }
    setDeadline(updatedDeadline)
    onChange?.(updatedDeadline)
  }
  const handleTestReminder = useCallback(async () => {
    if (!onReminderTest || !deadline.reminder) return
    setIsTestingReminder(true)
    try {
      await onReminderTest(deadline.reminder)
    } catch (_error) {
    } finally {
      setIsTestingReminder(false)
    }
  }, [onReminderTest, deadline.reminder])
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }
  const parseDate = (dateString: string): Date => {
    return new Date(dateString)
  }
  const getDaysUntilDeadline = (): number | null => {
    if (!deadline.date) return null
    const now = new Date()
    const deadlineDate = new Date(deadline.date)
    const diffTime = deadlineDate.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
  const getUrgencyColor = (urgency: UrgencyLevel) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      normal: 'bg-gray-100 text-gray-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    }
    return colors[urgency]
  }
  const getUrgencyIcon = (urgency: UrgencyLevel) => {
    const icons = {
      low: Clock,
      normal: Calendar,
      high: AlertTriangle,
      critical: Zap,
    }
    return icons[urgency]
  }
  const isDateValid = (date: Date): boolean => {
    if (minDate && date < minDate) return false
    if (maxDate && date > maxDate) return false
    if (workingDaysOnly) {
      const dayOfWeek = date.getDay()
      return dayOfWeek !== 0 && dayOfWeek !== 6 // Not Sunday (0) or Saturday (6)
    }
    return true
  }
  const daysUntil = getDaysUntilDeadline()
  const UrgencyIcon = deadline.urgency ? getUrgencyIcon(deadline.urgency) : Calendar
  return (
    <div className={cn('space-y-4', className)}>
      {label && (
        <Label className="text-base font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Date picker */}
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date d'échéance
          </Label>
          <Input
            type="date"
            value={deadline.date ? formatDate(deadline.date) : ''}
            onChange={(e) => {
              const newDate = parseDate(e.target.value)
              if (isDateValid(newDate)) {
                handleDeadlineChange('date', newDate)
              }
            }}
            min={minDate ? formatDate(minDate) : undefined}
            max={maxDate ? formatDate(maxDate) : undefined}
            disabled={disabled}
            className={cn(error && 'border-red-500')}
          />
          {daysUntil !== null && (
            <p
              className={cn(
                'text-xs',
                daysUntil < 0
                  ? 'text-red-600'
                  : daysUntil <= 3
                    ? 'text-orange-600'
                    : 'text-muted-foreground'
              )}
            >
              {daysUntil < 0
                ? `En retard de ${Math.abs(daysUntil)} jour(s)`
                : daysUntil === 0
                  ? "Aujourd'hui"
                  : daysUntil === 1
                    ? 'Demain'
                    : `Dans ${daysUntil} jour(s)`}
            </p>
          )}
        </div>
        {/* Time picker */}
        {showTimeSelector && (
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Heure (optionnel)
            </Label>
            <Input
              type="time"
              value={deadline.time || ''}
              onChange={(e) => handleDeadlineChange('time', e.target.value)}
              disabled={disabled}
            />
          </div>
        )}
      </div>
      {/* Urgency level */}
      {showUrgency && (
        <div className="space-y-2">
          <Label className="text-sm flex items-center gap-2">
            <UrgencyIcon className="h-4 w-4" />
            Niveau d'urgence
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(['low', 'normal', 'high', 'critical'] as UrgencyLevel[]).map((level) => {
              const LevelIcon = getUrgencyIcon(level)
              const isSelected = deadline.urgency === level
              return (
                <Button
                  type="button"
                  key={level}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDeadlineChange('urgency', level)}
                  disabled={disabled}
                  className={cn('justify-start gap-2', isSelected && getUrgencyColor(level))}
                >
                  <LevelIcon className="h-4 w-4" />
                  {level === 'low'
                    ? 'Faible'
                    : level === 'normal'
                      ? 'Normal'
                      : level === 'high'
                        ? 'Élevé'
                        : 'Critique'}
                </Button>
              )
            })}
          </div>
        </div>
      )}
      {/* Reminder settings */}
      {showReminder && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Rappel
            </Label>
            {deadline.reminder && onReminderTest && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestReminder}
                disabled={disabled || isTestingReminder}
              >
                {isTestingReminder ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                Test
              </Button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm">Type de rappel</Label>
              <Select
                value={deadline.reminder?.type || 'none'}
                onValueChange={(value) => handleReminderChange('type', value as ReminderType)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                  <SelectItem value="both">Email + Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {deadline.reminder?.type !== 'none' && deadline.reminder?.type && (
              <div className="space-y-2">
                <Label className="text-sm">Avance (minutes)</Label>
                <Select
                  value={deadline.reminder?.advance?.toString() || '60'}
                  onValueChange={(value) => handleReminderChange('advance', parseInt(value, 10))}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner l'avance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 heure</SelectItem>
                    <SelectItem value="120">2 heures</SelectItem>
                    <SelectItem value="240">4 heures</SelectItem>
                    <SelectItem value="480">8 heures</SelectItem>
                    <SelectItem value="1440">1 jour</SelectItem>
                    <SelectItem value="2880">2 jours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {deadline.reminder?.type !== 'none' && deadline.reminder?.type && (
            <div className="space-y-2">
              <Label className="text-sm">Message du rappel (optionnel)</Label>
              <Input
                value={deadline.reminder?.message || ''}
                onChange={(e) => handleReminderChange('message', e.target.value)}
                placeholder="Message personnalisé..."
                disabled={disabled}
              />
            </div>
          )}
        </div>
      )}
      {/* Description */}
      <div className="space-y-2">
        <Label className="text-sm">Description (optionnel)</Label>
        <Input
          value={deadline.description || ''}
          onChange={(e) => handleDeadlineChange('description', e.target.value)}
          placeholder="Description de l'échéance..."
          disabled={disabled}
        />
      </div>
      {/* Summary */}
      {deadline.date && (
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <UrgencyIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Résumé de l'échéance</span>
            <Badge className={getUrgencyColor(deadline.urgency!)}>
              {deadline.urgency === 'low'
                ? 'Faible'
                : deadline.urgency === 'normal'
                  ? 'Normal'
                  : deadline.urgency === 'high'
                    ? 'Élevé'
                    : 'Critique'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {deadline.date.toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            {deadline.time && ` à ${deadline.time}`}
            {deadline.reminder?.type !== 'none' &&
              deadline.reminder?.type &&
              ` • Rappel ${deadline.reminder.type} ${deadline.reminder.advance} min avant`}
          </p>
        </div>
      )}
      {helperText && !error && <p className="text-sm text-muted-foreground">{helperText}</p>}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
}
