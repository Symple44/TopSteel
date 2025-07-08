'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { DateRange } from 'react-day-picker'

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Sélectionner une période',
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const formatRange = (range: DateRange | undefined) => {
    if (!range?.from) return placeholder

    if (!range.to) {
      return range.from.toLocaleDateString('fr-FR')
    }

    return `${range.from.toLocaleDateString('fr-FR')} - ${range.to.toLocaleDateString('fr-FR')}`
  }

  // Gérer les clics extérieurs pour fermer le popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleButtonClick = () => {
    setIsOpen(!isOpen)
  }

  const handleDateSelect = (range: DateRange | undefined) => {
    onChange?.(range)
    if (range?.from && range?.to) {
      setIsOpen(false)
    }
  }

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.(undefined)
  }

  // Assurer des valeurs safe pour exactOptionalPropertyTypes
  const safeDefaultMonth = value?.from || new Date()
  const safeSelected = value || undefined

  return (
    <div ref={containerRef} className={cn('relative grid gap-2', className)}>
      <Button
        id="date"
        variant="outline"
        className={cn('justify-start text-left font-normal', !value && 'text-muted-foreground')}
        onClick={handleButtonClick}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {formatRange(value)}
        {value && <X className="ml-auto h-4 w-4 hover:text-destructive" onClick={clearSelection} />}
      </Button>

      {isOpen && (
        <div
          ref={popoverRef}
          className={cn(
            'absolute top-full left-0 z-50 mt-2 w-auto rounded-md border bg-popover p-0 text-popover-foreground shadow-md',
            'animate-in fade-in-0 zoom-in-95'
          )}
        >
          <Calendar
            mode="range"
            defaultMonth={safeDefaultMonth}
            selected={safeSelected}
            onSelect={handleDateSelect}
            className="p-3"
          />
        </div>
      )}
    </div>
  )
}
