/**
 * 📊 MONITORING INITIALIZER - TopSteel ERP
 * Initialise le monitoring uniquement côté client
 * Fichier: apps/web/src/components/monitoring-initializer.tsx
 */

'use client'

import { useEffect } from 'react'
import PerformanceMonitor from '@/lib/performance-monitor'

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
            PerformanceMonitor.getInstance().recordMetric('global_error', {
              message: event.error?.message || 'Unknown error',
              filename: event.filename,
              lineno: event.lineno,
              colno: event.colno,
            })
          })

          window.addEventListener('unhandledrejection', (event) => {
            PerformanceMonitor.getInstance().recordMetric('unhandled_rejection', {
              reason: event.reason?.toString() || 'Unknown reason',
            })
          })
        }

        if (enableAnalytics) {
        }
      } catch (_error) {}
    }
  }, [enableAnalytics, enablePerformanceTracking, enableErrorTracking])

  // Ce composant ne rend rien
  return null
}

export default MonitoringInitializer
