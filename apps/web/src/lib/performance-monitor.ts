/**
 * 📊 PERFORMANCE MONITOR - TopSteel ERP
 * Monitoring et mesure des performances de l'application
 * Fichier: apps/web/src/lib/performance-monitor.ts
 */

// ===== TYPES POUR ANALYTICS =====
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'set',
      target: string,
      config?: Record<string, any>
    ) => void
    dataLayer?: any[]
  }
}

// ===== INTERFACE POUR LES MÉTRIQUES =====
interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  url?: string
  userAgent?: string
}

interface PageLoadMetrics {
  domContentLoaded: number
  loadComplete: number
  firstPaint: number
  firstContentfulPaint: number
  largestContentfulPaint?: number
  cumulativeLayoutShift?: number
  firstInputDelay?: number
}

// ===== CLASSE PRINCIPALE =====
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private observers: PerformanceObserver[] = []

  private constructor() {
    this.initializeObservers()
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * Décorateur pour mesurer les performances de rendu
   */
  static measureRender(componentName: string) {
    return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
      const method = descriptor.value
      
      descriptor.value = function(...args: any[]) {
        const start = performance.now()
        const result = method.apply(this, args)
        const end = performance.now()
        const duration = end - start
        
        if (duration > 16) { // Plus de 1 frame à 60fps
          console.warn(`⚠️ ${componentName}.${propertyName} render took ${Math.round(duration)}ms`)
        }

        // Enregistrer la métrique
        PerformanceMonitor.getInstance().recordMetric('component_render', {
          component: componentName,
          method: propertyName,
          duration
        })
        
        return result
      }
    }
  }

  /**
   * Tracker le temps de chargement de page
   */
  static trackPageLoad(pageName: string): void {
    if (typeof window === 'undefined') return

    try {
      const timing = window.performance?.timing
      if (!timing) return

      const metrics: PageLoadMetrics = {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
        firstPaint: 0,
        firstContentfulPaint: 0
      }

      // Performance Paint Timing
      const paintEntries = performance.getEntriesByType('paint')
      paintEntries.forEach(entry => {
        if (entry.name === 'first-paint') {
          metrics.firstPaint = entry.startTime
        } else if (entry.name === 'first-contentful-paint') {
          metrics.firstContentfulPaint = entry.startTime
        }
      })

      // Log des performances lentes
      if (metrics.loadComplete > 3000) {
        console.warn(`🐌 Slow page load: ${pageName} took ${metrics.loadComplete}ms`)
      }

      // Envoyer aux analytics si disponible
      PerformanceMonitor.sendToAnalytics('page_load_performance', {
        page_name: pageName,
        load_time: metrics.loadComplete,
        dom_content_loaded: metrics.domContentLoaded,
        first_paint: metrics.firstPaint,
        first_contentful_paint: metrics.firstContentfulPaint
      })

      // Enregistrer dans les métriques internes
      PerformanceMonitor.getInstance().recordMetric('page_load', {
        pageName,
        ...metrics
      })

    } catch (error) {
      console.error('Error tracking page load:', error)
    }
  }

  /**
   * Tracker le Largest Contentful Paint (LCP)
   */
  static trackLCP(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    try {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        const lastEntry = entries[entries.length - 1]
        
        if (lastEntry?.startTime) {
          const lcpTime = lastEntry.startTime

          if (lcpTime > 2500) { // Seuil pour LCP lent
            console.warn(`🐌 Slow LCP: ${Math.round(lcpTime)}ms`)
          }

          // Envoyer aux analytics
          PerformanceMonitor.sendToAnalytics('web_vitals', {
            metric_name: 'LCP',
            value: Math.round(lcpTime),
            rating: lcpTime <= 2500 ? 'good' : lcpTime <= 4000 ? 'needs_improvement' : 'poor'
          })

          // Enregistrer
          PerformanceMonitor.getInstance().recordMetric('lcp', {
            value: lcpTime,
            rating: lcpTime <= 2500 ? 'good' : 'poor'
          })
        }
      })
      
      observer.observe({ type: 'largest-contentful-paint', buffered: true })
      PerformanceMonitor.getInstance().observers.push(observer)

    } catch (error) {
      console.error('Error setting up LCP observer:', error)
    }
  }

  /**
   * Tracker le First Input Delay (FID)
   */
  static trackFID(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    try {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        
        entries.forEach(entry => {
          const fid = (entry as any).processingStart - entry.startTime

          if (fid > 100) { // Seuil pour FID lent
            console.warn(`🐌 Slow FID: ${Math.round(fid)}ms`)
          }

          // Envoyer aux analytics
          PerformanceMonitor.sendToAnalytics('web_vitals', {
            metric_name: 'FID',
            value: Math.round(fid),
            rating: fid <= 100 ? 'good' : fid <= 300 ? 'needs_improvement' : 'poor'
          })

          // Enregistrer
          PerformanceMonitor.getInstance().recordMetric('fid', {
            value: fid,
            rating: fid <= 100 ? 'good' : 'poor'
          })
        })
      })
      
      observer.observe({ type: 'first-input', buffered: true })
      PerformanceMonitor.getInstance().observers.push(observer)

    } catch (error) {
      console.error('Error setting up FID observer:', error)
    }
  }

  /**
   * Tracker le Cumulative Layout Shift (CLS)
   */
  static trackCLS(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    try {
      let clsValue = 0

      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        
        entries.forEach(entry => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        })

        if (clsValue > 0.1) { // Seuil pour CLS problématique
          console.warn(`🐌 High CLS: ${clsValue.toFixed(3)}`)
        }

        // Envoyer aux analytics
        PerformanceMonitor.sendToAnalytics('web_vitals', {
          metric_name: 'CLS',
          value: parseFloat(clsValue.toFixed(3)),
          rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs_improvement' : 'poor'
        })
      })
      
      observer.observe({ type: 'layout-shift', buffered: true })
      PerformanceMonitor.getInstance().observers.push(observer)

    } catch (error) {
      console.error('Error setting up CLS observer:', error)
    }
  }

  /**
   * Envoyer des métriques aux analytics (type-safe)
   */
  private static sendToAnalytics(eventName: string, parameters: Record<string, any>): void {
    if (typeof window === 'undefined') return

    try {
      // Google Analytics 4 (gtag)
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, parameters)
      }

      // Console pour développement
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Analytics: ${eventName}`, parameters)
      }

    } catch (error) {
      console.error('Error sending analytics:', error)
    }
  }

  /**
   * Initialiser les observers de performance
   */
  private initializeObservers(): void {
    if (typeof window === 'undefined') return

    // Initialiser tous les trackers Core Web Vitals
    PerformanceMonitor.trackLCP()
    PerformanceMonitor.trackFID()
    PerformanceMonitor.trackCLS()
  }

  /**
   * Enregistrer une métrique personnalisée
   */
  recordMetric(name: string, data: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value: data.value || data.duration || 0,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
    }

    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    const metrics = this.metrics.get(name)!
    metrics.push(metric)

    // Limiter à 1000 métriques par type
    if (metrics.length > 1000) {
      metrics.shift()
    }
  }

  /**
   * Obtenir les métriques enregistrées
   */
  getMetrics(name?: string): PerformanceMetric[] | Map<string, PerformanceMetric[]> {
    if (name) {
      return this.metrics.get(name) || []
    }
    return this.metrics
  }

  /**
   * Nettoyer les métriques et observers
   */
  cleanup(): void {
    this.metrics.clear()
    this.observers.forEach(observer => {
      try {
        observer.disconnect()
      } catch (error) {
        console.error('Error disconnecting observer:', error)
      }
    })
    this.observers = []
  }

  /**
   * Obtenir un rapport de performance
   */
  getPerformanceReport(): Record<string, any> {
    const report: Record<string, any> = {}

    for (const [name, metrics] of this.metrics.entries()) {
      if (metrics.length === 0) continue

      const values = metrics.map(m => m.value).filter(v => v > 0)
      if (values.length === 0) continue

      report[name] = {
        count: values.length,
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        latest: values[values.length - 1],
        timestamp: metrics[metrics.length - 1].timestamp
      }
    }

    return report
  }
}

// ===== EXPORTATIONS =====
export default PerformanceMonitor

// Initialiser automatiquement si dans le navigateur
if (typeof window !== 'undefined') {
  // Attendre que le DOM soit prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      PerformanceMonitor.getInstance()
    })
  } else {
    PerformanceMonitor.getInstance()
  }
}