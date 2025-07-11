/**
 * 📊 MONITORING INITIALIZER - TopSteel ERP
 * Initialise le monitoring uniquement côté client
 * Fichier: apps/web/src/components/monitoring-initializer.tsx
 */

'use client'

import PerformanceMonitor from '@/lib/performance-monitor'
import { useEffect } from 'react'

interface MonitoringInitializerProps {
  enableAnalytics?: boolean
  enablePerformanceTracking?: boolean
  enableErrorTracking?: boolean
}

export function MonitoringInitializer({
  enableAnalytics = true,
  enablePerformanceTracking = true,
  enableErrorTracking = true,
}: MonitoringInitializerProps) {
  useEffect(() => {
    // Initialiser le monitoring côté client uniquement
    if (typeof window !== 'undefined') {
      try {
        if (enablePerformanceTracking) {
          PerformanceMonitor.initializeClient()
        }

        if (enableErrorTracking) {
          // Tracking global des erreurs
          window.addEventListener('error', (event) => {
            console.error('Global error:', event.error)
            PerformanceMonitor.getInstance().recordMetric('global_error', {
              message: event.error?.message || 'Unknown error',
              filename: event.filename,
              lineno: event.lineno,
              colno: event.colno,
            })
          })

          window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason)
            PerformanceMonitor.getInstance().recordMetric('unhandled_rejection', {
              reason: event.reason?.toString() || 'Unknown reason',
            })
          })
        }

        if (enableAnalytics) {
        }
      } catch (error) {
        console.error('Failed to initialize monitoring:', error)
      }
    }
  }, [enableAnalytics, enablePerformanceTracking, enableErrorTracking])

  // Ce composant ne rend rien
  return null
}

export default MonitoringInitializer
