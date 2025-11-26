'use client'

import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import * as React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '../../../lib/utils'

export interface DateRange {
  start: Date | null
  end: Date | null
}

export interface DateRangePickerProps {
  /** Current date range */
  value?: DateRange
  /** Callback when range changes */
  onChange: (range: DateRange) => void
  /** Minimum selectable date */
  minDate?: Date
  /** Maximum selectable date */
  maxDate?: Date
  /** Disabled state */
  disabled?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Custom class name */
  className?: string
  /** Date format function */
  formatDate?: (date: Date) => string
  /** Preset ranges */
  presets?: Array<{
    label: string
    range: DateRange
  }>
  /** Labels */
  labels?: {
    start?: string
    end?: string
    clear?: string
    apply?: string
    today?: string
    yesterday?: string
    last7Days?: string
    last30Days?: string
    thisMonth?: string
    lastMonth?: string
  }
}

const defaultLabels = {
  start: 'Date début',
  end: 'Date fin',
  clear: 'Effacer',
  apply: 'Appliquer',
  today: "Aujourd'hui",
  yesterday: 'Hier',
  last7Days: '7 derniers jours',
  last30Days: '30 derniers jours',
  thisMonth: 'Ce mois',
  lastMonth: 'Mois dernier',
}

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

function defaultFormatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isInRange(date: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false
  return date >= start && date <= end
}

function getDefaultPresets(labels: typeof defaultLabels): Array<{ label: string; range: DateRange }> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const last7 = new Date(today)
  last7.setDate(last7.getDate() - 6)

  const last30 = new Date(today)
  last30.setDate(last30.getDate() - 29)

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

  return [
    { label: labels.today, range: { start: today, end: today } },
    { label: labels.yesterday, range: { start: yesterday, end: yesterday } },
    { label: labels.last7Days, range: { start: last7, end: today } },
    { label: labels.last30Days, range: { start: last30, end: today } },
    { label: labels.thisMonth, range: { start: thisMonthStart, end: today } },
    { label: labels.lastMonth, range: { start: lastMonthStart, end: lastMonthEnd } },
  ]
}

/**
 * DateRangePicker component with calendar popup
 * Supports presets, keyboard navigation, and accessibility
 */
export function DateRangePicker({
  value,
  onChange,
  minDate,
  maxDate,
  disabled = false,
  placeholder = 'Sélectionner une période',
  className,
  formatDate = defaultFormatDate,
  presets: customPresets,
  labels: customLabels,
}: DateRangePickerProps) {
  const labels = { ...defaultLabels, ...customLabels }
  const presets = customPresets ?? getDefaultPresets(labels)

  const [isOpen, setIsOpen] = useState(false)
  const [viewDate, setViewDate] = useState(new Date())
  const [selecting, setSelecting] = useState<'start' | 'end'>('start')
  const [tempRange, setTempRange] = useState<DateRange>({ start: null, end: null })

  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Sync temp range with value
  useEffect(() => {
    if (value) {
      setTempRange(value)
    }
  }, [value])

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const handleDateClick = useCallback((date: Date) => {
    if (selecting === 'start') {
      setTempRange({ start: date, end: null })
      setSelecting('end')
    } else {
      if (tempRange.start && date < tempRange.start) {
        setTempRange({ start: date, end: tempRange.start })
      } else {
        setTempRange((prev) => ({ ...prev, end: date }))
      }
      setSelecting('start')
    }
  }, [selecting, tempRange.start])

  const handleApply = useCallback(() => {
    if (tempRange.start && tempRange.end) {
      onChange(tempRange)
      setIsOpen(false)
    }
  }, [onChange, tempRange])

  const handleClear = useCallback(() => {
    setTempRange({ start: null, end: null })
    onChange({ start: null, end: null })
    setSelecting('start')
  }, [onChange])

  const handlePresetClick = useCallback((range: DateRange) => {
    setTempRange(range)
    onChange(range)
    setIsOpen(false)
  }, [onChange])

  const navigateMonth = useCallback((direction: number) => {
    setViewDate((prev) => {
      const next = new Date(prev)
      next.setMonth(next.getMonth() + direction)
      return next
    })
  }, [])

  // Generate calendar days
  const generateCalendarDays = useCallback(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    let startOffset = firstDay.getDay() - 1
    if (startOffset < 0) startOffset = 6

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = []

    // Previous month days
    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      days.push({ date, isCurrentMonth: false })
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i)
      days.push({ date, isCurrentMonth: true })
    }

    // Next month days to fill grid
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i)
      days.push({ date, isCurrentMonth: false })
    }

    return days
  }, [viewDate])

  const calendarDays = generateCalendarDays()

  const displayValue = value?.start && value?.end
    ? `${formatDate(value.start)} - ${formatDate(value.end)}`
    : placeholder

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={cn(
          'flex items-center justify-between w-full px-3 py-2 rounded-md border',
          'min-h-[44px] text-sm text-left',
          'bg-background hover:bg-accent',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !value?.start && 'text-muted-foreground'
        )}
      >
        <span className="truncate">{displayValue}</span>
        <Calendar className="h-4 w-4 ml-2 flex-shrink-0" aria-hidden="true" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Sélecteur de période"
          className={cn(
            'absolute z-50 mt-2 p-4 rounded-lg border bg-popover shadow-lg',
            'min-w-[320px] sm:min-w-[600px]'
          )}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Presets */}
            <div className="sm:w-40 space-y-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">Périodes</p>
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePresetClick(preset.range)}
                  className={cn(
                    'w-full px-3 py-2 text-sm text-left rounded-md',
                    'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    'min-h-[44px]'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Calendar */}
            <div className="flex-1">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => navigateMonth(-1)}
                  className="p-2 rounded-md hover:bg-accent min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Mois précédent"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="font-medium">
                  {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                </span>
                <button
                  type="button"
                  onClick={() => navigateMonth(1)}
                  className="p-2 rounded-md hover:bg-accent min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Mois suivant"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map(({ date, isCurrentMonth }, index) => {
                  const isStart = tempRange.start && isSameDay(date, tempRange.start)
                  const isEnd = tempRange.end && isSameDay(date, tempRange.end)
                  const inRange = isInRange(date, tempRange.start, tempRange.end)
                  const isDisabled =
                    (minDate && date < minDate) ||
                    (maxDate && date > maxDate)
                  const isToday = isSameDay(date, new Date())

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => !isDisabled && handleDateClick(date)}
                      disabled={isDisabled}
                      className={cn(
                        'p-2 text-sm rounded-md min-h-[40px]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        !isCurrentMonth && 'text-muted-foreground/50',
                        isCurrentMonth && 'hover:bg-accent',
                        isToday && 'font-bold',
                        (isStart || isEnd) && 'bg-primary text-primary-foreground hover:bg-primary/90',
                        inRange && !isStart && !isEnd && 'bg-primary/20',
                        isDisabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {date.getDate()}
                    </button>
                  )
                })}
              </div>

              {/* Selection info */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {tempRange.start && (
                    <span>
                      {formatDate(tempRange.start)}
                      {tempRange.end && ` - ${formatDate(tempRange.end)}`}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleClear}
                    className={cn(
                      'px-3 py-2 text-sm rounded-md border',
                      'hover:bg-accent min-h-[44px]'
                    )}
                  >
                    {labels.clear}
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={!tempRange.start || !tempRange.end}
                    className={cn(
                      'px-3 py-2 text-sm rounded-md',
                      'bg-primary text-primary-foreground hover:bg-primary/90',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'min-h-[44px]'
                    )}
                  >
                    {labels.apply}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DateRangePicker
