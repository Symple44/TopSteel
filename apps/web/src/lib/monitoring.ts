/**
 * ✅ MONITORING SYSTEM ENTERPRISE
 * 
 * Fonctionnalités:
 * - Monitoring temps réel des performances
 * - Tracking des erreurs avec contexte
 * - Métriques business et techniques
 * - Alerts automatiques
 * - Dashboard de monitoring
 * - Intégration services externes
 */

interface MonitoringEvent {
  id: string
  type: 'performance' | 'error' | 'user_action' | 'business' | 'security'
  name: string
  data: Record<string, any>
  timestamp: number
  sessionId: string
  userId?: string
  url: string
  userAgent: string
}

interface Alert {
  id: string
  level: 'info' | 'warning' | 'error' | 'critical'
  message: string
  data: any
  timestamp: number
  resolved: boolean
}

interface PerformanceMetrics {
  pageLoadTime: number
  renderTime: number
  apiCalls: number
  errorRate: number
  memoryUsage: number
  networkSpeed: string
}

interface BusinessMetrics {
  userActions: number
  conversions: number
  featureUsage: Record<string, number>
  errorsByModule: Record<string, number>
}

class MonitoringSystem {
  private events: MonitoringEvent[] = []
  private alerts: Alert[] = []
  private sessionId: string
  private userId?: string
  private metricsBuffer: MonitoringEvent[] = []
  private flushInterval: number = 30000 // 30 secondes
  private maxEvents: number = 1000

  constructor() {
    this.sessionId = this.generateSessionId()
    this.initializePerformanceMonitoring()
    this.initializeErrorTracking()
    this.startMetricsFlush()
  }

  /**
   * Initialiser le monitoring des performances
   */
  private initializePerformanceMonitoring(): void {
    if (typeof window === 'undefined') return

    // ✅ CORE WEB VITALS
    this.observeWebVitals()
    
    // ✅ NAVIGATION TIMING
    window.addEventListener('load', () => {
      setTimeout(() => this.captureNavigationMetrics(), 0)
    })

    // ✅ RESOURCE TIMING
    this.observeResourceTiming()

    // ✅ MEMORY MONITORING
    if ('memory' in performance) {
      setInterval(() => this.captureMemoryMetrics(), 60000)
    }

    // ✅ NETWORK MONITORING
    this.observeNetworkStatus()
  }

  /**
   * Observer Web Vitals
   */
  private observeWebVitals(): void {
    const vitalsObserver = (name: string, entries: PerformanceEntry[]) => {
      entries.forEach(entry => {
        this.track('performance', `web_vital_${name.toLowerCase()}`, {
          value: entry.startTime || (entry as any).value,
          rating: this.getVitalRating(name, entry.startTime || (entry as any).value)
        })
      })
    }

    // LCP (Largest Contentful Paint)
    this.observePerformance('largest-contentful-paint', entries => 
      vitalsObserver('LCP', entries))

    // FID (First Input Delay)
    this.observePerformance('first-input', entries => 
      vitalsObserver('FID', entries))

    // CLS (Cumulative Layout Shift)
    this.observePerformance('layout-shift', entries => {
      const cls = entries.reduce((sum, entry) => {
        if (!(entry as any).hadRecentInput) {
          return sum + (entry as any).value
        }
        return sum
      }, 0)
      
      if (cls > 0) {
        this.track('performance', 'web_vital_cls', {
          value: cls,
          rating: this.getVitalRating('CLS', cls)
        })
      }
    })
  }

  /**
   * Capturer les métriques de navigation
   */
  private captureNavigationMetrics(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    if (navigation) {
      this.track('performance', 'page_load', {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        connection: navigation.connectEnd - navigation.connectStart,
        request: navigation.responseStart - navigation.requestStart,
        response: navigation.responseEnd - navigation.responseStart,
        domProcessing: navigation.domComplete - navigation.domLoading,
        totalTime: navigation.loadEventEnd - navigation.fetchStart,
        transferSize: navigation.transferSize,
        encodedBodySize: navigation.encodedBodySize
      })

      // ✅ ALERTES AUTOMATIQUES
      const totalTime = navigation.loadEventEnd - navigation.fetchStart
      if (totalTime > 5000) {
        this.createAlert('warning', 'Page load time > 5s', { totalTime })
      }
    }
  }

  /**
   * Observer les ressources
   */
  private observeResourceTiming(): void {
    setInterval(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      const slowResources = resources.filter(r => r.duration > 1000)
      
      if (slowResources.length > 0) {
        this.track('performance', 'slow_resources', {
          count: slowResources.length,
          resources: slowResources.map(r => ({
            name: r.name,
            duration: r.duration,
            size: r.transferSize
          }))
        })
      }
    }, 30000)
  }

  /**
   * Monitoring mémoire
   */
  private captureMemoryMetrics(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      
      this.track('performance', 'memory_usage', {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
        usage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
      })

      // ✅ ALERTE MÉMOIRE
      const usage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      if (usage > 85) {
        this.createAlert('warning', 'High memory usage', { usage })
      }
    }
  }

  /**
   * Monitoring réseau
   */
  private observeNetworkStatus(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      
      this.track('performance', 'network_info', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      })

      connection.addEventListener('change', () => {
        this.track('performance', 'network_change', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink
        })
      })
    }
  }

  /**
   * Initialiser le tracking d'erreurs
   */
  private initializeErrorTracking(): void {
    if (typeof window === 'undefined') return

    // ✅ ERREURS JAVASCRIPT
    window.addEventListener('error', (event) => {
      this.trackError('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      })
    })

    // ✅ PROMESSES REJETÉES
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError('unhandled_promise_rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      })
    })

    // ✅ ERREURS RÉSEAU
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const startTime = performance.now()
      
      try {
        const response = await originalFetch(...args)
        
        // Tracker les erreurs HTTP
        if (!response.ok) {
          this.trackError('api_error', {
            url: args[0],
            status: response.status,
            statusText: response.statusText,
            duration: performance.now() - startTime
          })
        }
        
        return response
      } catch (error) {
        this.trackError('network_error', {
          url: args[0],
          message: error instanceof Error ? error.message : 'Unknown error',
          duration: performance.now() - startTime
        })
        throw error
      }
    }
  }

  /**
   * Tracker un événement
   */
  track(type: MonitoringEvent['type'], name: string, data: Record<string, any> = {}): void {
    const event: MonitoringEvent = {
      id: this.generateEventId(),
      type,
      name,
      data,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
    }

    this.events.push(event)
    this.metricsBuffer.push(event)

    // ✅ LIMITER LE NOMBRE D'ÉVÉNEMENTS EN MÉMOIRE
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // ✅ LOGGING DÉVELOPPEMENT
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 [${type}] ${name}:`, data)
    }

    // ✅ ENVOYER VERS SERVICES EXTERNES
    this.sendToExternalServices(event)
  }

  /**
   * Tracker une erreur
   */
  trackError(name: string, error: any): void {
    this.track('error', name, error)
    
    // ✅ CRÉER UNE ALERTE AUTOMATIQUE
    this.createAlert('error', `Error: ${name}`, error)
  }

  /**
   * Tracker une action utilisateur
   */
  trackUserAction(action: string, data: Record<string, any> = {}): void {
    this.track('user_action', action, data)
  }

  /**
   * Tracker des métriques business
   */
  trackBusiness(metric: string, value: number, data: Record<string, any> = {}): void {
    this.track('business', metric, { value, ...data })
  }

  /**
   * Créer une alerte
   */
  private createAlert(level: Alert['level'], message: string, data: any): void {
    const alert: Alert = {
      id: this.generateAlertId(),
      level,
      message,
      data,
      timestamp: Date.now(),
      resolved: false
    }

    this.alerts.push(alert)

    // ✅ NOTIFICATION CONSOLE
    const logLevel = level === 'critical' || level === 'error' ? 'error' : 
                    level === 'warning' ? 'warn' : 'info'
    console[logLevel](`🚨 [${level.toUpperCase()}] ${message}`, data)

    // ✅ ENVOYER VERS SERVICES D'ALERTE
    this.sendAlert(alert)
  }

  /**
   * Envoyer vers services externes
   */
  private sendToExternalServices(event: MonitoringEvent): void {
    // ✅ GOOGLE ANALYTICS
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.name, {
        event_category: event.type,
        event_label: event.sessionId,
        custom_parameter_1: JSON.stringify(event.data)
      })
    }

    // ✅ SENTRY
    if (typeof window !== 'undefined' && (window as any).Sentry && event.type === 'error') {
      (window as any).Sentry.captureMessage(event.name, {
        level: 'error',
        extra: event.data
      })
    }

    // ✅ VOTRE SERVICE DE MONITORING
    // Vous pouvez ajouter ici d'autres services comme DataDog, LogRocket, etc.
  }

  /**
   * Envoyer une alerte
   */
  private sendAlert(alert: Alert): void {
    // En production, envoyer vers votre service d'alertes
    // Slack, Teams, email, etc.
    
    if (process.env.NODE_ENV === 'development') {
      console.warn('🚨 ALERT:', alert)
    }
  }

  /**
   * Flush des métriques vers le serveur
   */
  private startMetricsFlush(): void {
    setInterval(() => {
      if (this.metricsBuffer.length > 0) {
        this.flushMetrics()
      }
    }, this.flushInterval)
  }

  /**
   * Envoyer les métriques au serveur
   */
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return

    const metricsToSend = [...this.metricsBuffer]
    this.metricsBuffer = []

    try {
      // Envoyer vers votre API de metrics
      await fetch('/api/monitoring/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: metricsToSend })
      })
    } catch (error) {
      console.warn('Failed to flush metrics:', error)
      // Remettre dans le buffer en cas d'échec
      this.metricsBuffer.unshift(...metricsToSend)
    }
  }

  /**
   * Obtenir le rapport de monitoring
   */
  getReport(): {
    performance: PerformanceMetrics
    business: BusinessMetrics
    alerts: Alert[]
    sessionId: string
  } {
    const performanceEvents = this.events.filter(e => e.type === 'performance')
    const businessEvents = this.events.filter(e => e.type === 'business')
    const errorEvents = this.events.filter(e => e.type === 'error')

    return {
      performance: {
        pageLoadTime: this.getAverageMetric(performanceEvents, 'page_load', 'totalTime'),
        renderTime: this.getAverageMetric(performanceEvents, 'component_render', 'duration'),
        apiCalls: performanceEvents.filter(e => e.name.includes('api')).length,
        errorRate: (errorEvents.length / this.events.length) * 100,
        memoryUsage: this.getLastMetric(performanceEvents, 'memory_usage', 'used') || 0,
        networkSpeed: this.getLastMetric(performanceEvents, 'network_info', 'effectiveType') || 'unknown'
      },
      business: {
        userActions: businessEvents.filter(e => e.name.includes('action')).length,
        conversions: businessEvents.filter(e => e.name.includes('conversion')).length,
        featureUsage: this.aggregateFeatureUsage(businessEvents),
        errorsByModule: this.aggregateErrorsByModule(errorEvents)
      },
      alerts: this.alerts.filter(a => !a.resolved),
      sessionId: this.sessionId
    }
  }

  /**
   * Utilitaires privés
   */
  private observePerformance(type: string, callback: (entries: PerformanceEntry[]) => void): void {
    try {
      const observer = new PerformanceObserver(list => callback(list.getEntries()))
      observer.observe({ type, buffered: true })
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error)
    }
  }

  private getVitalRating(name: string, value: number): string {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 }
    }

    const threshold = thresholds[name as keyof typeof thresholds]
    if (!threshold) return 'unknown'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  private getAverageMetric(events: MonitoringEvent[], name: string, field: string): number {
    const filteredEvents = events.filter(e => e.name === name && e.data[field])
    if (filteredEvents.length === 0) return 0
    
    const sum = filteredEvents.reduce((acc, e) => acc + e.data[field], 0)
    return Math.round(sum / filteredEvents.length)
  }

  private getLastMetric(events: MonitoringEvent[], name: string, field: string): any {
    const filtered = events.filter(e => e.name === name && e.data[field])
    return filtered.length > 0 ? filtered[filtered.length - 1].data[field] : null
  }

  private aggregateFeatureUsage(events: MonitoringEvent[]): Record<string, number> {
    const usage: Record<string, number> = {}
    events.forEach(event => {
      const feature = event.data.feature || event.name
      usage[feature] = (usage[feature] || 0) + 1
    })
    return usage
  }

  private aggregateErrorsByModule(events: MonitoringEvent[]): Record<string, number> {
    const errors: Record<string, number> = {}
    events.forEach(event => {
      const module = event.data.module || 'unknown'
      errors[module] = (errors[module] || 0) + 1
    })
    return errors
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// ✅ INSTANCE GLOBALE
export const monitoring = new MonitoringSystem()

// ✅ HOOK REACT POUR MONITORING
export function useMonitoring() {
  return {
    track: monitoring.track.bind(monitoring),
    trackError: monitoring.trackError.bind(monitoring),
    trackUserAction: monitoring.trackUserAction.bind(monitoring),
    trackBusiness: monitoring.trackBusiness.bind(monitoring),
    getReport: monitoring.getReport.bind(monitoring)
  }
}

// ✅ HOC POUR TRACKING AUTOMATIQUE
export function withMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return React.forwardRef<any, P>((props, ref) => {
    React.useEffect(() => {
      monitoring.trackUserAction('component_mount', { component: componentName })
      
      return () => {
        monitoring.trackUserAction('component_unmount', { component: componentName })
      }
    }, [])

    return <Component {...props} ref={ref} />
  })
}
