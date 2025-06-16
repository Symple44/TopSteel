import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, format: 'short' | 'long' | 'time' = 'short'): string {
  const d = new Date(date)
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('fr-FR')
    case 'long':
      return d.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    case 'time':
      return d.toLocaleString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    default:
      return d.toLocaleDateString('fr-FR')
  }
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatNumber(num: number, decimals: number = 0): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

export function formatPercent(value: number, decimals: number = 0): string {
  return `${formatNumber(value, decimals)}%`
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export function truncate(str: string, length: number = 50): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function parseQueryString(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString)
  const result: Record<string, string> = {}
  
  params.forEach((value, key) => {
    result[key] = value
  })
  
  return result
}

export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, String(value))
    }
  })
  
  return searchParams.toString()
}

export function downloadFile(data: Blob, filename: string): void {
  const url = window.URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/
  return phoneRegex.test(phone)
}

export function calculateTTC(montantHT: number, tauxTVA: number = 20): number {
  return montantHT * (1 + tauxTVA / 100)
}

export function calculateHT(montantTTC: number, tauxTVA: number = 20): number {
  return montantTTC / (1 + tauxTVA / 100)
}

export function calculateTVA(montantHT: number, tauxTVA: number = 20): number {
  return montantHT * (tauxTVA / 100)
}

export function getDaysUntil(date: Date | string): number {
  const targetDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  targetDate.setHours(0, 0, 0, 0)
  
  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    'BROUILLON': 'gray',
    'DEVIS': 'yellow',
    'EN_COURS': 'blue',
    'TERMINE': 'green',
    'ANNULE': 'red',
    'ACCEPTE': 'green',
    'REFUSE': 'red',
    'EXPIRE': 'gray',
  }
  
  return statusColors[status] || 'gray'
}