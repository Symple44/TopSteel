'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { translator } from './translator'
import type { Language, I18nContext } from './types'

// Create React Context
const I18nContext = createContext<I18nContext | null>(null)

// Provider Component
interface I18nProviderProps {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(translator.getLanguageInfo())
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const unsubscribe = translator.subscribe(() => {
      setCurrentLanguage(translator.getLanguageInfo())
    })

    return unsubscribe
  }, [])

  const setLanguage = async (langCode: string) => {
    setIsLoading(true)
    try {
      translator.setLanguage(langCode)
    } finally {
      setIsLoading(false)
    }
  }

  const t = (key: string, params?: Record<string, string | number>): string => {
    return translator.t(key, params)
  }

  const contextValue: I18nContext = {
    currentLanguage,
    setLanguage,
    t,
    isLoading,
  }

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  )
}

// Main hook for translations
export function useTranslation(namespace?: string) {
  const context = useContext(I18nContext)
  
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider')
  }

  const { currentLanguage, setLanguage, isLoading } = context

  // Create a scoped translation function for the namespace
  const t = (key: string, params?: Record<string, string | number>): string => {
    const fullKey = namespace ? `${namespace}.${key}` : key
    return translator.t(fullKey, params)
  }

  // Pluralization helper
  const plural = (key: string, count: number, params?: Record<string, string | number>): string => {
    const fullKey = namespace ? `${namespace}.${key}` : key
    return translator.plural(fullKey, count, params)
  }

  return {
    t,
    plural,
    currentLanguage,
    changeLanguage: setLanguage,
    setLanguage,
    supportedLanguages: translator.getSupportedLanguages(),
    isLoading,
  }
}

// Hook for language switching
export function useLanguage() {
  const context = useContext(I18nContext)
  
  if (!context) {
    throw new Error('useLanguage must be used within an I18nProvider')
  }

  return {
    current: context.currentLanguage,
    supported: translator.getSupportedLanguages(),
    change: context.setLanguage,
    isLoading: context.isLoading,
  }
}

// Hook for formatting utilities
export function useFormatting() {
  const { currentLanguage } = useTranslation()

  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
    return translator.formatDate(date, options)
  }

  const formatNumber = (number: number, options?: Intl.NumberFormatOptions): string => {
    return translator.formatNumber(number, options)
  }

  const formatCurrency = (amount: number, currency = 'EUR'): string => {
    return translator.formatCurrency(amount, currency)
  }

  const formatPercentage = (value: number, decimals = 1): string => {
    return translator.formatNumber(value, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${translator.formatNumber(size, { 
      maximumFractionDigits: unitIndex === 0 ? 0 : 1 
    })} ${units[unitIndex]}`
  }

  const formatRelativeTime = (date: Date): string => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return translator.t('common.justNow') || 'Just now'
    if (diffInSeconds < 3600) return translator.t('common.minutesAgo', { count: Math.floor(diffInSeconds / 60) }) || `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return translator.t('common.hoursAgo', { count: Math.floor(diffInSeconds / 3600) }) || `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return translator.t('common.daysAgo', { count: Math.floor(diffInSeconds / 86400) }) || `${Math.floor(diffInSeconds / 86400)} days ago`
    
    return formatDate(date, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return {
    formatDate,
    formatNumber,
    formatCurrency,
    formatPercentage,
    formatFileSize,
    formatRelativeTime,
    locale: currentLanguage.code,
  }
}

// Hook for RTL support
export function useDirection() {
  const { currentLanguage } = useTranslation()
  
  return {
    direction: currentLanguage.direction,
    isRTL: currentLanguage.direction === 'rtl',
    isLTR: currentLanguage.direction === 'ltr',
  }
}