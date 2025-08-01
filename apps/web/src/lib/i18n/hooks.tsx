'use client'

import React, { type ReactNode } from 'react'
import { translator } from './translator'
import type { I18nContext } from './types'

// Create React Context with fallback
const I18nReactContext = React.createContext<I18nContext | null>(null)

// Provider Component
interface I18nProviderProps {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0)

  React.useEffect(() => {
    // S'abonner aux changements du translator
    const unsubscribe = translator.subscribe(() => {
      // Forcer un re-render quand le translator change (langue ou overrides)
      forceUpdate()
    })

    return unsubscribe
  }, [])

  const contextValue: I18nContext = {
    currentLanguage: translator.getLanguageInfo(),
    setLanguage: async (langCode: string) => {
      translator.setLanguage(langCode)
    },
    t: (key: string, params?: Record<string, string | number>): string => {
      return translator.t(key, params)
    },
    isLoading: false,
  }

  return <I18nReactContext.Provider value={contextValue}>{children}</I18nReactContext.Provider>
}

// Main hook for translations
export function useTranslation(namespace?: string) {
  const context = React.useContext(I18nReactContext)

  if (!context) {
    const t = (key: string, params?: Record<string, string | number>): string => {
      const fullKey = namespace ? `${namespace}.${key}` : key
      return translator.t(fullKey, params)
    }

    return {
      t,
      plural: (key: string, count: number, params?: Record<string, string | number>): string => {
        const fullKey = namespace ? `${namespace}.${key}` : key
        return translator.plural(fullKey, count, params)
      },
      currentLanguage: translator.getLanguageInfo(),
      changeLanguage: (langCode: string) => translator.setLanguage(langCode),
      setLanguage: (langCode: string) => translator.setLanguage(langCode),
      supportedLanguages: translator.getSupportedLanguages(),
      isLoading: false,
    }
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
  const context = React.useContext(I18nReactContext)

  if (!context) {
    return {
      current: translator.getLanguageInfo(),
      supported: translator.getSupportedLanguages(),
      change: (langCode: string) => translator.setLanguage(langCode),
      isLoading: false,
    }
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
      maximumFractionDigits: unitIndex === 0 ? 0 : 1,
    })} ${units[unitIndex]}`
  }

  const formatRelativeTime = (date: Date): string => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return translator.t('common.justNow') || 'Just now'
    if (diffInSeconds < 3600)
      return (
        translator.t('common.minutesAgo', { count: Math.floor(diffInSeconds / 60) }) ||
        `${Math.floor(diffInSeconds / 60)} minutes ago`
      )
    if (diffInSeconds < 86400)
      return (
        translator.t('common.hoursAgo', { count: Math.floor(diffInSeconds / 3600) }) ||
        `${Math.floor(diffInSeconds / 3600)} hours ago`
      )
    if (diffInSeconds < 604800)
      return (
        translator.t('common.daysAgo', { count: Math.floor(diffInSeconds / 86400) }) ||
        `${Math.floor(diffInSeconds / 86400)} days ago`
      )

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
