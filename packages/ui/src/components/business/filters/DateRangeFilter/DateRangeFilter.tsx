'use client'
import { Calendar, ChevronDown, Clock, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { cn } from '../../../../lib/utils'
import { Badge } from '../../../data-display/badge'
import { Label } from '../../../forms/label/Label'
import { Button } from '../../../primitives/button/Button'
import { Input } from '../../../primitives/input/Input'
export interface DateRange {
  from?: string
  to?: string
}
export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'last_year'
  | 'this_week'
  | 'this_month'
  | 'this_quarter'
  | 'this_year'
  | 'previous_week'
  | 'previous_month'
  | 'previous_quarter'
  | 'previous_year'
  | 'custom'
interface DateRangeFilterProps {
  value?: DateRange
  onChange?: (dateRange: DateRange | null) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  showPresets?: boolean
  showTime?: boolean
  showClear?: boolean
  minDate?: string
  maxDate?: string
  className?: string
}
const datePresets: Array<{ value: DatePreset; label: string }> = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'yesterday', label: 'Hier' },
  { value: 'last_7_days', label: '7 derniers jours' },
  { value: 'last_30_days', label: '30 derniers jours' },
  { value: 'last_90_days', label: '90 derniers jours' },
  { value: 'this_week', label: 'Cette semaine' },
  { value: 'this_month', label: 'Ce mois' },
  { value: 'this_quarter', label: 'Ce trimestre' },
  { value: 'this_year', label: 'Cette année' },
  { value: 'previous_week', label: 'Semaine précédente' },
  { value: 'previous_month', label: 'Mois précédent' },
  { value: 'previous_quarter', label: 'Trimestre précédent' },
  { value: 'previous_year', label: 'Année précédente' },
  { value: 'custom', label: 'Période personnalisée' },
]
export function DateRangeFilter({
  value,
  onChange,
  label = 'Période',
  placeholder = 'Sélectionner une période...',
  disabled = false,
  showPresets = true,
  showTime = false,
  showClear = true,
  minDate,
  maxDate,
  className,
}: DateRangeFilterProps) {
  const [dateRange, setDateRange] = useState<DateRange>(value || {})
  const [selectedPreset, setSelectedPreset] = useState<DatePreset | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const formatDate = useCallback(
    (date: Date): string => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      if (showTime) {
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}`
      }
      return `${year}-${month}-${day}`
    },
    [showTime]
  )
  const getDateFromPreset = useCallback(
    (preset: DatePreset): DateRange => {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      switch (preset) {
        case 'today':
          return {
            from: formatDate(today),
            to: formatDate(today),
          }
        case 'yesterday': {
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)
          return {
            from: formatDate(yesterday),
            to: formatDate(yesterday),
          }
        }
        case 'last_7_days': {
          const last7Days = new Date(today)
          last7Days.setDate(last7Days.getDate() - 6)
          return {
            from: formatDate(last7Days),
            to: formatDate(today),
          }
        }
        case 'last_30_days': {
          const last30Days = new Date(today)
          last30Days.setDate(last30Days.getDate() - 29)
          return {
            from: formatDate(last30Days),
            to: formatDate(today),
          }
        }
        case 'last_90_days': {
          const last90Days = new Date(today)
          last90Days.setDate(last90Days.getDate() - 89)
          return {
            from: formatDate(last90Days),
            to: formatDate(today),
          }
        }
        case 'this_week': {
          const thisWeekStart = new Date(today)
          const dayOfWeek = thisWeekStart.getDay()
          const diff = thisWeekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Monday as first day
          thisWeekStart.setDate(diff)
          return {
            from: formatDate(thisWeekStart),
            to: formatDate(today),
          }
        }
        case 'this_month': {
          const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
          return {
            from: formatDate(thisMonthStart),
            to: formatDate(today),
          }
        }
        case 'this_quarter': {
          const currentQuarter = Math.floor(today.getMonth() / 3)
          const thisQuarterStart = new Date(today.getFullYear(), currentQuarter * 3, 1)
          return {
            from: formatDate(thisQuarterStart),
            to: formatDate(today),
          }
        }
        case 'this_year': {
          const thisYearStart = new Date(today.getFullYear(), 0, 1)
          return {
            from: formatDate(thisYearStart),
            to: formatDate(today),
          }
        }
        case 'previous_week': {
          const prevWeekEnd = new Date(today)
          const prevWeekDayOfWeek = prevWeekEnd.getDay()
          const prevWeekDiff =
            prevWeekEnd.getDate() - prevWeekDayOfWeek + (prevWeekDayOfWeek === 0 ? -6 : 1) - 7
          prevWeekEnd.setDate(prevWeekDiff + 6)
          const prevWeekStart = new Date(prevWeekEnd)
          prevWeekStart.setDate(prevWeekStart.getDate() - 6)
          return {
            from: formatDate(prevWeekStart),
            to: formatDate(prevWeekEnd),
          }
        }
        case 'previous_month': {
          const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
          const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
          return {
            from: formatDate(prevMonth),
            to: formatDate(prevMonthEnd),
          }
        }
        case 'previous_quarter': {
          const prevQuarter = Math.floor(today.getMonth() / 3) - 1
          const prevQuarterYear = prevQuarter < 0 ? today.getFullYear() - 1 : today.getFullYear()
          const prevQuarterMonth = prevQuarter < 0 ? 9 : prevQuarter * 3
          const prevQuarterStart = new Date(prevQuarterYear, prevQuarterMonth, 1)
          const prevQuarterEnd = new Date(prevQuarterYear, prevQuarterMonth + 3, 0)
          return {
            from: formatDate(prevQuarterStart),
            to: formatDate(prevQuarterEnd),
          }
        }
        case 'previous_year': {
          const prevYear = today.getFullYear() - 1
          const prevYearStart = new Date(prevYear, 0, 1)
          const prevYearEnd = new Date(prevYear, 11, 31)
          return {
            from: formatDate(prevYearStart),
            to: formatDate(prevYearEnd),
          }
        }
        default:
          return {}
      }
    },
    [formatDate]
  )
  const updateDateRange = useCallback(
    (newRange: DateRange) => {
      setDateRange(newRange)
      onChange?.(newRange.from || newRange.to ? newRange : null)
    },
    [onChange]
  )
  const handlePresetSelect = useCallback(
    (preset: DatePreset) => {
      setSelectedPreset(preset)
      if (preset === 'custom') {
        setIsExpanded(true)
        return
      }
      const range = getDateFromPreset(preset)
      updateDateRange(range)
      setIsExpanded(false)
    },
    [getDateFromPreset, updateDateRange]
  )
  const handleCustomDateChange = useCallback(
    (field: 'from' | 'to', value: string) => {
      const newRange = { ...dateRange, [field]: value }
      updateDateRange(newRange)
    },
    [dateRange, updateDateRange]
  )
  const clearDateRange = useCallback(() => {
    setDateRange({})
    setSelectedPreset(null)
    onChange?.(null)
    setIsExpanded(false)
  }, [onChange])
  const getDisplayText = useCallback(() => {
    if (selectedPreset && selectedPreset !== 'custom') {
      return datePresets.find((p) => p.value === selectedPreset)?.label || placeholder
    }
    if (dateRange.from || dateRange.to) {
      const fromDisplay = dateRange.from
        ? new Date(dateRange.from).toLocaleDateString('fr-FR')
        : '...'
      const toDisplay = dateRange.to ? new Date(dateRange.to).toLocaleDateString('fr-FR') : '...'
      if (dateRange.from && dateRange.to) {
        return `${fromDisplay} - ${toDisplay}`
      } else if (dateRange.from) {
        return `À partir du ${fromDisplay}`
      } else if (dateRange.to) {
        return `Jusqu'au ${toDisplay}`
      }
    }
    return placeholder
  }, [selectedPreset, dateRange, placeholder])
  const hasValue = selectedPreset || dateRange.from || dateRange.to
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {label}
        </Label>
      )}
      {/* Main Toggle Button */}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={disabled}
          className="w-full justify-between"
        >
          <span className={cn('truncate', !hasValue && 'text-muted-foreground')}>
            {getDisplayText()}
          </span>
          <div className="flex items-center gap-1">
            {hasValue && showClear && (
              <X
                className="h-4 w-4 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  clearDateRange()
                }}
              />
            )}
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')}
            />
          </div>
        </Button>
        {/* Active Filter Badge */}
        {hasValue && (
          <Badge
            variant="secondary"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            1
          </Badge>
        )}
      </div>
      {/* Expanded Controls */}
      {isExpanded && (
        <div className="border rounded-lg p-4 space-y-4 bg-background">
          {/* Quick Presets */}
          {showPresets && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Périodes prédéfinies</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {datePresets.slice(0, -1).map((preset) => (
                  <Button
                    type="button"
                    key={preset.value}
                    type="button"
                    variant={selectedPreset === preset.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePresetSelect(preset.value)}
                    disabled={disabled}
                    className="text-xs h-8"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {/* Custom Date Range */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Période personnalisée</Label>
              {showTime && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Avec horaires</span>
                </div>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs">Date de début</Label>
                <Input
                  type={showTime ? 'datetime-local' : 'date'}
                  value={dateRange.from || ''}
                  onChange={(e) => handleCustomDateChange('from', e.target.value)}
                  disabled={disabled}
                  min={minDate}
                  max={dateRange.to || maxDate}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Date de fin</Label>
                <Input
                  type={showTime ? 'datetime-local' : 'date'}
                  value={dateRange.to || ''}
                  onChange={(e) => handleCustomDateChange('to', e.target.value)}
                  disabled={disabled}
                  min={dateRange.from || minDate}
                  max={maxDate}
                />
              </div>
            </div>
          </div>
          {/* Actions */}
          <div className="flex justify-between pt-2 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearDateRange}
              disabled={disabled || !hasValue}
            >
              <X className="h-4 w-4 mr-1" />
              Effacer
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              disabled={disabled}
            >
              Fermer
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
