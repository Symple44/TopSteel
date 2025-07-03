'use client'

import { useEffect, useRef, useCallback } from 'react'

/**
 * ✅ PERFORMANCE MONITOR ENTERPRISE
 * 
 * Fonctionnalités:
 * - Monitoring temps réel des performances
 * - Détection des goulots d'étranglement
 * - Métriques Core Web Vitals
 * - Alerts automatiques
 * - Optimisations suggérées
 * - Analytics et reporting
 */

interface PerformanceMetrics {
  renderTime: number
  componentName: string
  timestamp: number
  props?: Record<string, any>
  reRenderCount: number
}

interface WebVitalsMetrics {
  lcp?: number  // Largest Contentful Paint
  fid?: number  // First Input Delay
  cls?: number  // Cumulative Layout Shift
  fcp?: number  // First Contentful Paint
  ttfb?: number // Time to First Byte
}

class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = []
  private static webVitals: WebVitalsMetrics = {}
  private static observers: Map<string, PerformanceObserver> = new Map()

  /**
   * Decorator pour mesurer les performances des composants
   */
  static measureComponent(componentName: string) {
    return function<T extends React.ComponentType<any>>(Component: T): T {
      const MeasuredComponent = React.forwardRef<any, React.ComponentProps<T>>((props, ref) => {
        const renderCountRef = useRef(0)
        const lastRenderTime = useRef(0)

        useEffect(() => {
          renderCountRef.current++
          const renderTime = performance.now() - lastRenderTime.current
          
          if (renderCountRef.current > 1) { // Skip first render
            PerformanceMonitor.recordMetric({
              renderTime,
              componentName,
              timestamp: Date.now(),
              props: process.env.NODE_ENV === 'development' ? props : undefined,
              reRenderCount: renderCountRef.current
            })

            // Alert si rendering lent
            if (renderTime > 16) { // > 1 frame (60fps)
              console.warn(`🐌 Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`)
            }
          }

          lastRenderTime.current = performance.now()
        })

        return React.createElement(Component, { ...props, ref })
      })

      MeasuredComponent.displayName = `Measured(${Component.displayName || Component.name})`
      return MeasuredComponent as T
    }
  }

  /**
   * Hook pour mesurer des opérations spécifiques
   */
  static useMeasure(operationName: string) {
    return useCallback((operation: () => void | Promise<void>) => {
      return async () => {
        const start = performance.now()
        
        try {
          await operation()
        } finally {
          const duration = performance.now() - start
          
          PerformanceMonitor.recordMetric({
            renderTime: duration,
            componentName: operationName,
            timestamp: Date.now(),
            reRenderCount: 1
          })

          if (duration > 100) { // Operations > 100ms
            console.warn(`🐌 Slow operation: ${operationName} took ${duration.toFixed(2)}ms`)
          }
        }
      }
    }, [operationName])
  }

  /**
   * Enregistrer une métrique
   */
  private static recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric)
    
    // Garder seulement les 1000 dernières métriques
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // Envoyer vers analytics si configuré
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('performance_metric', {
        component: metric.componentName,
        renderTime: Math.round(metric.renderTime),
        reRenderCount: metric.reRenderCount,
        timestamp: metric.timestamp
      })
    }
  }

  /**
   * Initialiser le monitoring Web Vitals
   */
  static initWebVitals() {
    if (typeof window === 'undefined') return

    // Observer LCP (Largest Contentful Paint)
    this.observePerformance('largest-contentful-paint', (entries) => {
      const lcp = entries[entries.length - 1]
      this.webVitals.lcp = lcp.startTime
      this.reportWebVital('LCP', lcp.startTime)
    })

    // Observer FID (First Input Delay)
    this.observePerformance('first-input', (entries) => {
      const fid = entries[0]
      this.webVitals.fid = fid.processingStart - fid.startTime
      this.reportWebVital('FID', this.webVitals.fid)
    })

    // Observer CLS (Cumulative Layout Shift)
    this.observePerformance('layout-shift', (entries) => {
      const cls = entries.reduce((sum, entry) => {
        if (!entry.hadRecentInput) {
          return sum + entry.value
        }
        return sum
      }, 0)
      this.webVitals.cls = cls
      this.reportWebVital('CLS', cls)
    })

    // Navigation Timing
    this.observePerformance('navigation', (entries) => {
      const nav = entries[0] as PerformanceNavigationTiming
      this.webVitals.ttfb = nav.responseStart - nav.requestStart
      this.webVitals.fcp = nav.loadEventEnd - nav.fetchStart
    })
  }

  private static observePerformance(type: string, callback: (entries: PerformanceEntry[]) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries())
      })
      
      observer.observe({ type, buffered: true })
      this.observers.set(type, observer)
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error)
    }
  }

  private static reportWebVital(name: string, value: number) {
    console.info(`📊 ${name}: ${value.toFixed(2)}ms`)

    // Seuils de performance
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 600, poor: 1500 }
    }

    const threshold = thresholds[name as keyof typeof thresholds]
    if (threshold) {
      let rating = 'good'
      if (value > threshold.poor) rating = 'poor'
      else if (value > threshold.good) rating = 'needs-improvement'

      // Envoyer vers analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'web_vitals', {
          metric_name: name,
          metric_value: Math.round(value),
          metric_rating: rating
        })
      }
    }
  }

  /**
   * Obtenir le rapport de performance
   */
  static getPerformanceReport() {
    const now = Date.now()
    const recent = this.metrics.filter(m => now - m.timestamp < 60000) // Last minute

    const report = {
      totalMetrics: this.metrics.length,
      recentMetrics: recent.length,
      averageRenderTime: recent.reduce((sum, m) => sum + m.renderTime, 0) / recent.length || 0,
      slowComponents: recent
        .filter(m => m.renderTime > 16)
        .sort((a, b) => b.renderTime - a.renderTime)
        .slice(0, 10),
      webVitals: this.webVitals,
      memoryUsage: (performance as any).memory ? {
        used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)
      } : null
    }

    return report
  }

  /**
   * Cleanup observers
   */
  static cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
  }
}

// ✅ HOOK POUR PERFORMANCE MONITORING
export function usePerformanceMonitoring(enabled = process.env.NODE_ENV === 'development') {
  useEffect(() => {
    if (!enabled) return

    PerformanceMonitor.initWebVitals()

    // Nettoyage
    return () => {
      PerformanceMonitor.cleanup()
    }
  }, [enabled])

  const measureOperation = PerformanceMonitor.useMeasure

  const getReport = useCallback(() => {
    return PerformanceMonitor.getPerformanceReport()
  }, [])

  return {
    measureOperation,
    getReport,
    measureComponent: PerformanceMonitor.measureComponent
  }
}

export { PerformanceMonitor }

// ✅ COMPOSANTS LAZY LOADING OPTIMISÉ
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = React.lazy(importFn)
  
  return React.forwardRef<React.ElementRef<T>, React.ComponentProps<T>>((props, ref) => (
    <React.Suspense fallback={fallback || <div>Chargement...</div>}>
      <LazyComponent {...props} ref={ref} />
    </React.Suspense>
  ))
}

// ✅ VIRTUAL SCROLLING OPTIMISÉ
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan = 5
) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length - 1
  )

  const paddingTop = visibleStart * itemHeight
  const paddingBottom = (items.length - visibleEnd - 1) * itemHeight
  const visibleItems = items.slice(
    Math.max(0, visibleStart - overscan),
    Math.min(items.length, visibleEnd + 1 + overscan)
  )

  return {
    visibleItems,
    paddingTop,
    paddingBottom,
    setScrollTop
  }
}
