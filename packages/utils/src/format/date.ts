// packages/utils/src/format/date.ts
import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

export function formatDate(
  date: Date | string, 
  formatStr: string = 'dd/MM/yyyy'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  
  if (!isValid(dateObj)) {
    return 'Date invalide'
  }
  
  return format(dateObj, formatStr, { locale: fr })
}

export function formatDateTime(date: Date | string): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm')
}

export function formatDateRelative(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  
  if (!isValid(dateObj)) {
    return 'Date invalide'
  }
  
  return formatDistanceToNow(dateObj, { 
    addSuffix: true, 
    locale: fr 
  })
}

export function formatDateRange(
  startDate: Date | string, 
  endDate: Date | string
): string {
  const start = formatDate(startDate)
  const end = formatDate(endDate)
  return `${start} - ${end}`
}

export function isDateInRange(
  date: Date, 
  startDate: Date, 
  endDate: Date
): boolean {
  return date >= startDate && date <= endDate
}