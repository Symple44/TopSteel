// apps/web/src/components/providers/monitoring-provider.tsx
'use client'

import { useWebVitals } from '@/hooks/use-web-vitals'
import { useBusinessMetrics } from '@/lib/business-metrics'
import { useEffect } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

interface MonitoringProviderProps {
  children: React.ReactNode
}

// Type pour le retour de useMonitoring
interface MonitoringHook {
  trackClick: (element: string, context?: Record<string, any>) => void
  trackPageView: (page: string, context?: Record<string, any>) => void
  trackFormSubmit: (form: string, success: boolean, errors?: string[]) => void
  trackSearch: (query: string, results: number, filters?: Record<string, any>) => void
  track: (eventName: string, properties?: Record<string, any>) => void
  setUserContext: (context: any) => void
  trackProjectCreated: (projectData: any) => void
  trackProjectStatusChanged: (projectId: string, oldStatus: string, newStatus: string) => void
  trackProjectViewed: (projectId: string, viewDuration?: number) => void
  trackProductionStarted: (orderId: string, projectId: string) => void
  trackProductionCompleted: (orderId: string, duration: number, quality?: string) => void
  trackUserAction: (action: string, context?: Record<string, any>) => void
  trackFormSubmission: (formName: string, success: boolean, errors?: string[]) => void
  trackSearchPerformed: (query: string, resultCount: number, filters?: Record<string, any>) => void
  trackPerformanceMetric: (metric: string, value: number, context?: Record<string, any>) => void
  trackError: (error: Error, context?: Record<string, any>) => void
  getEvents: (filters?: any) => any[]
  generateReport: () => any
  exportData: () => string
}

function ErrorFallback({ error, resetErrorBoundary }: { 
  error: Error
  resetErrorBoundary: () => void 
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Oops! Une erreur s'est produite
        </h2>
        <p className="text-gray-600 mb-6">
          Une erreur inattendue s'est produite dans l'application. 
          Nos équipes ont été notifiées.
        </p>
        <details className="text-left bg-gray-100 p-4 rounded mb-6 text-sm">
          <summary className="cursor-pointer font-medium">Détails techniques</summary>
          <pre className="mt-2 text-red-600 overflow-auto">
            {error.message}
          </pre>
        </details>
        <div className="space-x-4">
          <button
            onClick={resetErrorBoundary}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Recharger la page
          </button>
        </div>
      </div>
    </div>
  )
}

function MonitoringCore({ children }: { children: React.ReactNode }) {
  const metrics = useBusinessMetrics()
  const webVitals = useWebVitals()

  useEffect(() => {
    // Initialiser le monitoring au chargement
    metrics.track('app_loaded', {
      userAgent: navigator.userAgent,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      timestamp: Date.now()
    })

    // Tracker les erreurs JavaScript globales
    const handleError = (event: ErrorEvent) => {
      metrics.trackError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        source: 'global_error_handler'
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      metrics.trackError(new Error('Unhandled Promise Rejection'), {
        reason: event.reason?.toString() || 'Unknown',
        source: 'unhandled_promise_rejection'
      })
    }

    // Tracker les changements de visibilité (utilisateur quitte/revient)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        metrics.track('page_hidden')
      } else {
        metrics.track('page_visible')
      }
    }

    // Tracker les changements de focus
    const handleFocus = () => metrics.track('window_focus')
    const handleBlur = () => metrics.track('window_blur')

    // Event listeners
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    // Performance monitoring pour les Core Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        // Observer pour les métriques de performance
        const perfObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'largest-contentful-paint') {
              metrics.trackPerformanceMetric('LCP', entry.startTime)
            } else if (entry.entryType === 'first-input') {
              metrics.trackPerformanceMetric('FID', (entry as any).processingStart - entry.startTime)
            }
          })
        })
        
        perfObserver.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] })
      } catch (e) {
        console.warn('Performance Observer not supported:', e)
      }
    }

    // Cleanup function
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [metrics])

  // Monitoring des Web Vitals si disponibles
  useEffect(() => {
    if (webVitals) {
      Object.entries(webVitals).forEach(([metric, value]) => {
        if (typeof value === 'number') {
          metrics.trackPerformanceMetric(metric, value)
        }
        
        // Alertes pour les métriques dégradées
        const thresholds: Record<string, number> = {
          LCP: 2500, // 2.5s
          FID: 100,  // 100ms
          CLS: 0.1   // 0.1
        }
        
        if (thresholds[metric] && value > thresholds[metric]) {
          metrics.trackPerformanceMetric(`${metric}_slow`, value, {
            threshold: thresholds[metric],
            severity: 'warning'
          })
        }
      })
    }
  }, [webVitals, metrics])

  return <>{children}</>
}

export function MonitoringProvider({ children }: MonitoringProviderProps) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('React Error Boundary:', error, errorInfo)
        
        // Envoyer l'erreur au service de monitoring
        if (typeof window !== 'undefined') {
          try {
            const metrics = (window as any).__businessMetrics

            if (metrics) {
              metrics.trackError(error, {
                componentStack: errorInfo.componentStack,
                source: 'error_boundary'
              })
            }
          } catch (e) {
            console.warn('Could not track error:', e)
          }
        }
      }}
      onReset={() => {
        // Actions à effectuer lors du reset
        console.log('Error boundary reset')
      }}
    >
      <MonitoringCore>
        {children}
      </MonitoringCore>
    </ErrorBoundary>
  )
}

// Hook pour accéder au monitoring dans les composants
export function useMonitoring(): MonitoringHook {
  const metrics = useBusinessMetrics()
  
  return {
    // Méthodes rapides pour les cas d'usage courants
    trackClick: (element: string, context?: Record<string, any>) => {
      metrics.trackUserAction('click', { element, ...context })
    },
    
    trackPageView: (page: string, context?: Record<string, any>) => {
      metrics.track('page_view', { page, ...context })
    },
    
    trackFormSubmit: (form: string, success: boolean, errors?: string[]) => {
      metrics.trackFormSubmission(form, success, errors)
    },
    
    trackSearch: (query: string, results: number, filters?: Record<string, any>) => {
      metrics.trackSearchPerformed(query, results, filters)
    },
    
    // Accès direct aux métriques
    ...metrics
  }
}