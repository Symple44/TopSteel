/**
 * 📊 PERFORMANCE MONITOR SSR-SAFE - TopSteel ERP
 * Monitoring et mesure des performances de l'application
 * Version corrigée pour éviter les erreurs SSR
 * Fichier: apps/web/src/lib/performance-monitor.ts
 */

// ===== TYPES POUR ANALYTICS =====
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'set',
      target: string,
      config?: Record<string, unknown>
    ) => void
    dataLayer?: unknown[]
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

// ===== CLASSE PRINCIPALE SSR-SAFE =====
export class PerformanceMonitor {
  private static instance: PerformanceMonitor | null = null
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private observers: PerformanceObserver[] = []
  private isClient: boolean

  private constructor() {
    this.isClient = typeof window !== 'undefined'
    if (this.isClient) {
      this.initializeObservers()
    }
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }

    return PerformanceMonitor.instance
  }

  /**
   * Vérification SSR-safe avant toute opération
   */
  private ensureClient(): boolean {
    if (!this.isClient) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('PerformanceMonitor: Attempted to use browser API on server')
      }

      return false
    }

    return true
  }

  /**
   * Décorateur pour mesurer les performances de rendu
   */
  static measureRender(componentName: string) {
    return (target: unknown, propertyName: string, descriptor: PropertyDescriptor) => {
      const method = descriptor.value

      descriptor.value = function (...args: unknown[]) {
        if (typeof window === 'undefined') {
          return method.apply(this, args)
        }

        const start = performance.now()
        const result = method.apply(this, args)
        const end = performance.now()
        const duration = end - start

        if (duration > 16) {
          // Plus de 1 frame à 60fps
          console.warn(`⚠️ ${componentName}.${propertyName} render took ${Math.round(duration)}ms`)
        }

        // Enregistrer la métrique
        PerformanceMonitor.getInstance().recordMetric('component_render', {
          component: componentName,
          method: propertyName,
          duration,
        })

        return result
      }
    }
  }

  /**
   * Tracker le temps de chargement de page - SSR-Safe
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
        firstContentfulPaint: 0,
      }

      // Performance Paint Timing
      const paintEntries = performance.getEntriesByType('paint')

      for (const entry of paintEntries) {
        if (entry.name === 'first-paint') {
          metrics.firstPaint = entry.startTime
        } else if (entry.name === 'first-contentful-paint') {
          metrics.firstContentfulPaint = entry.startTime
        }
      }

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
        first_contentful_paint: metrics.firstContentfulPaint,
      })

      // Enregistrer dans les métriques internes
      PerformanceMonitor.getInstance().recordMetric('page_load', {
        pageName,
        ...metrics,
      })
    } catch (error) {
      console.error('Error tracking page load:', error)
    }
  }

  /**
   * Tracker le Largest Contentful Paint (LCP) - SSR-Safe
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

          if (lcpTime > 2500) {
            // Seuil pour LCP lent
            console.warn(`🐌 Slow LCP: ${Math.round(lcpTime)}ms`)
          }

          // Envoyer aux analytics
          PerformanceMonitor.sendToAnalytics('web_vitals', {
            metric_name: 'LCP',
            value: Math.round(lcpTime),
            rating: lcpTime <= 2500 ? 'good' : lcpTime <= 4000 ? 'needs_improvement' : 'poor',
          })

          // Enregistrer
          PerformanceMonitor.getInstance().recordMetric('lcp', {
            value: lcpTime,
            rating: lcpTime <= 2500 ? 'good' : 'poor',
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
   * Tracker le First Input Delay (FID) - SSR-Safe
   */
  static trackFID(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    try {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()

        for (const entry of entries) {
          const fid = (entry as PerformanceEventTiming & { processingStart?: number }).processingStart ?? entry.startTime - entry.startTime

          if (fid > 100) {
            // Seuil pour FID lent
            console.warn(`🐌 Slow FID: ${Math.round(fid)}ms`)
          }

          // Envoyer aux analytics
          PerformanceMonitor.sendToAnalytics('web_vitals', {
            metric_name: 'FID',
            value: Math.round(fid),
            rating: fid <= 100 ? 'good' : fid <= 300 ? 'needs_improvement' : 'poor',
          })

          // Enregistrer
          PerformanceMonitor.getInstance().recordMetric('fid', {
            value: fid,
            rating: fid <= 100 ? 'good' : 'poor',
          })
        }
      })

      observer.observe({ type: 'first-input', buffered: true })
      PerformanceMonitor.getInstance().observers.push(observer)
    } catch (error) {
      console.error('Error setting up FID observer:', error)
    }
  }

  /**
   * Tracker le Cumulative Layout Shift (CLS) - SSR-Safe
   */
  static trackCLS(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return
    }

    try {
      let clsValue = 0

      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()

        for (const entry of entries) {
          if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
            clsValue += (entry as PerformanceEntry & { value?: number }).value ?? 0
          }
        }

        if (clsValue > 0.1) {
          // Seuil pour CLS problématique
          console.warn(`🐌 High CLS: ${clsValue.toFixed(3)}`)
        }

        // Envoyer aux analytics
        PerformanceMonitor.sendToAnalytics('web_vitals', {
          metric_name: 'CLS',
          value: Number.parseFloat(clsValue.toFixed(3)),
          rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs_improvement' : 'poor',
        })
      })

      observer.observe({ type: 'layout-shift', buffered: true })
      PerformanceMonitor.getInstance().observers.push(observer)
    } catch (error) {
      console.error('Error setting up CLS observer:', error)
    }
  }

  /**
   * Envoyer des métriques aux analytics (type-safe) - SSR-Safe
   */
  private static sendToAnalytics(eventName: string, parameters: Record<string, unknown>): void {
    if (typeof window === 'undefined') return

    try {
      // Google Analytics 4 (gtag)
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, parameters)
      }

      // Console pour développement
      if (process.env.NODE_ENV === 'development') {
      }
    } catch (error) {
      console.error('Error sending analytics:', error)
    }
  }

  /**
   * Initialiser les observers de performance - SSR-Safe
   */
  private initializeObservers(): void {
    if (!this.ensureClient()) return

    // Attendre que le DOM soit prêt
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupObservers()
      })
    } else {
      this.setupObservers()
    }
  }

  /**
   * Configurer les observers (appelé uniquement côté client)
   */
  private setupObservers(): void {
    // Initialiser tous les trackers Core Web Vitals
    PerformanceMonitor.trackLCP()
    PerformanceMonitor.trackFID()
    PerformanceMonitor.trackCLS()
  }

  /**
   * Enregistrer une métrique personnalisée - SSR-Safe
   */
  recordMetric(name: string, data: Record<string, unknown>): void {
    const metric: PerformanceMetric = {
      name,
      value: data.value || data.duration || 0,
      timestamp: Date.now(),
      url: this.isClient ? window.location.href : undefined,
      userAgent: this.isClient ? window.navigator.userAgent : undefined,
    }

    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    const metrics = this.metrics.get(name)
    if (!metrics) {
      console.warn(`Metrics array for ${name} not found`)
      return
    }

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
   * Nettoyer les métriques et observers - SSR-Safe
   */
  cleanup(): void {
    this.metrics.clear()

    if (this.isClient) {
      for (const observer of this.observers) {
        try {
          observer.disconnect()
        } catch (error) {
          console.error('Error disconnecting observer:', error)
        }
      }
    }

    this.observers = []
  }

  /**
   * Obtenir un rapport de performance
   */
  getPerformanceReport(): Record<string, unknown> {
    const report: Record<string, unknown> = {}

    for (const [name, metrics] of this.metrics.entries()) {
      if (metrics.length === 0) continue

      const values = metrics.map((m) => m.value).filter((v) => v > 0)

      if (values.length === 0) continue

      report[name] = {
        count: values.length,
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        latest: values[values.length - 1],
        timestamp: metrics[metrics.length - 1].timestamp,
      }
    }

    return report
  }

  /**
   * Initialisation côté client uniquement
   */
  static initializeClient(): void {
    if (typeof window !== 'undefined') {
      PerformanceMonitor.getInstance()
    }
  }
}

// ===== HOOK POUR UTILISATION DANS REACT =====
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance()

  return {
    recordMetric: monitor.recordMetric.bind(monitor),
    getMetrics: monitor.getMetrics.bind(monitor),
    getReport: monitor.getPerformanceReport.bind(monitor),
    cleanup: monitor.cleanup.bind(monitor),
  }
}

// ===== EXPORTATIONS =====
export default PerformanceMonitor

// ✅ SUPPRESSION DE L'INITIALISATION AUTOMATIQUE
// L'initialisation doit être faite manuellement côté client pour éviter les erreurs SSR
