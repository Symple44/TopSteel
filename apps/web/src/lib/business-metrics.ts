/**
 * 📈 BUSINESS METRICS SSR-SAFE - TopSteel ERP
 * Version corrigée pour éviter les erreurs SSR
 * Fichier: apps/web/src/lib/business-metrics.ts
 */

import { callClientApi } from '@/utils/backend-api'

// ===== TYPES =====
interface BusinessEvent {
  name: string
  properties: Record<string, unknown>
  timestamp: number
  userId?: string
  sessionId: string
}

interface UserContext {
  userId?: string
  role?: string
  permissions?: string[]
}

interface BusinessMetricsConfig {
  maxEvents?: number
  batchSize?: number
  batchTimeout?: number
  enableDebugLogs?: boolean
}

// ===== CLASSE PRINCIPALE SSR-SAFE =====
class BusinessMetrics {
  private events: BusinessEvent[] = []
  private sessionId = ''
  private userContext: UserContext = {}
  private readonly maxEvents: number
  private isClient = false
  private initialized = false
  private pendingEvents: BusinessEvent[] = []
  private batchTimeout: NodeJS.Timeout | null = null
  private readonly config: BusinessMetricsConfig

  constructor(config: BusinessMetricsConfig = {}) {
    this.config = {
      maxEvents: 5000,
      batchSize: 50,
      batchTimeout: 5000,
      enableDebugLogs: false,
      ...config,
    }

    this.maxEvents = this.config.maxEvents ?? 5000
    this.isClient = typeof window !== 'undefined'

    // ✅ Initialisation différée pour éviter les erreurs SSR
    if (this.isClient) {
      this.initializeClient()
    } else {
      // Générer un sessionId même côté serveur (pour les logs)
      this.sessionId = this.generateFallbackSessionId()
    }
  }

  /**
   * Initialisation côté client uniquement
   */
  private initializeClient(): void {
    if (!this.isClient || this.initialized) return

    this.sessionId = this.generateSessionId()
    this.initialized = true

    // Démarrer la session côté client
    this.track('session_started', {
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    })

    // Traiter les événements en attente
    this.processPendingEvents()

    // Configurer le batching automatique
    this.setupBatching()
  }

  /**
   * Générer un sessionId côté client
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2)

    return `${timestamp}-${random}`
  }

  /**
   * Générer un sessionId de fallback côté serveur
   */
  private generateFallbackSessionId(): string {
    return `server-${Date.now().toString(36)}`
  }

  /**
   * Traiter les événements en attente
   */
  private processPendingEvents(): void {
    if (this.pendingEvents.length > 0) {
      for (const event of this.pendingEvents) {
        this.addEvent(event)
      }
      this.pendingEvents = []
    }
  }

  /**
   * Configurer le système de batching
   */
  private setupBatching(): void {
    if (!this.isClient) return

    // Envoyer les événements par batch
    this.batchTimeout = setTimeout(() => {
      this.flushEvents()
      this.setupBatching() // Reconfigurer pour le prochain batch
    }, this.config.batchTimeout ?? 5000)
  }

  /**
   * Envoyer les événements au backend
   */
  private async flushEvents(): Promise<void> {
    if (this.events.length === 0) return

    const eventsToSend = this.events.slice(0, this.config.batchSize ?? 50)

    try {
      await this.sendToBackend(eventsToSend)

      // Retirer les événements envoyés
      this.events = this.events.slice(this.config.batchSize ?? 50)

      if (this.config.enableDebugLogs) {
        // Debug logging disabled in production
      }
    } catch (_error) {}
  }

  /**
   * Ajouter un événement (interne)
   */
  private addEvent(event: BusinessEvent): void {
    this.events.push(event)

    // Limiter le nombre d'événements en mémoire
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }
  }

  /**
   * Méthode principale de tracking - SSR-Safe
   */
  track(eventName: string, properties: Record<string, unknown> = {}): void {
    const event: BusinessEvent = {
      name: eventName,
      properties: {
        ...properties,
        url: this.isClient ? window.location.href : '',
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      userId: this.userContext.userId,
      sessionId: this.sessionId,
    }

    if (this.initialized) {
      this.addEvent(event)
    } else if (this.isClient) {
      // Stocker en attente jusqu'à l'initialisation
      this.pendingEvents.push(event)
    } else {
      // Côté serveur : log uniquement en dev
      if (process.env.NODE_ENV === 'development') {
        // Server-side logging disabled in production
      }
    }

    // Log immédiat en développement
    if (this.config.enableDebugLogs && process.env.NODE_ENV === 'development') {
      // Debug logging disabled in production
    }
  }

  /**
   * Définir le contexte utilisateur
   */
  setUserContext(context: UserContext): void {
    this.userContext = { ...context }
    this.track('user_context_updated', context as Record<string, unknown>)
  }

  // ===== MÉTRIQUES SPÉCIFIQUES TOPSTEEL =====

  trackProjectCreated(projectData: {
    type?: string
    clientId?: string
    estimatedValue?: number
    complexity?: 'simple' | 'medium' | 'complex'
  }): void {
    this.track('project_created', {
      projectType: projectData.type,
      clientId: projectData.clientId,
      estimatedValue: projectData.estimatedValue,
      complexity: projectData.complexity,
    })
  }

  trackProjectStatusChanged(projectId: string, oldStatus: string, newStatus: string): void {
    this.track('project_status_changed', {
      projectId,
      oldStatus,
      newStatus,
      transitionType: this.getTransitionType(oldStatus, newStatus),
    })
  }

  trackProjectViewed(projectId: string, viewDuration?: number): void {
    this.track('project_viewed', {
      projectId,
      viewDuration,
    })
  }

  trackProductionStarted(orderId: string, projectId: string): void {
    this.track('production_started', {
      orderId,
      projectId,
    })
  }

  trackProductionCompleted(orderId: string, duration: number, quality?: string): void {
    this.track('production_completed', {
      orderId,
      duration,
      quality,
    })
  }

  trackUserAction(action: string, context: Record<string, unknown> = {}): void {
    this.track('user_action', {
      action,
      page: this.isClient ? window.location.pathname : '',
      ...context,
    })
  }

  trackFormSubmission(formName: string, success: boolean, errors?: string[]): void {
    this.track('form_submission', {
      formName,
      success,
      errorCount: errors?.length || 0,
      errors: errors?.slice(0, 5),
    })
  }

  trackSearchPerformed(
    query: string,
    resultCount: number,
    filters?: Record<string, unknown>
  ): void {
    this.track('search_performed', {
      query: query.substring(0, 100),
      resultCount,
      filters,
    })
  }

  trackPerformanceMetric(metric: string, value: number, context?: Record<string, unknown>): void {
    this.track('performance_metric', {
      metric,
      value,
      unit: 'ms',
      ...context,
    })
  }

  trackError(error: Error, context: Record<string, unknown> = {}): void {
    this.track('error_occurred', {
      message: error.message,
      stack: error.stack?.substring(0, 1000),
      name: error.name,
      page: this.isClient ? window.location.pathname : '',
      ...context,
    })
  }

  // ===== MÉTHODES UTILITAIRES =====

  private getTransitionType(oldStatus: string, newStatus: string): string {
    const progressOrder = ['BROUILLON', 'DEVIS', 'ACCEPTE', 'EN_COURS', 'TERMINE', 'FACTURE']
    const oldIndex = progressOrder.indexOf(oldStatus)
    const newIndex = progressOrder.indexOf(newStatus)

    if (oldIndex < newIndex) return 'progress'
    if (oldIndex > newIndex) return 'regression'

    return 'lateral'
  }

  private async sendToBackend(events: BusinessEvent[]): Promise<void> {
    if (!this.isClient) return
    const response = await callClientApi('metrics', {
      method: 'POST',
      body: JSON.stringify({ events }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  }

  // ===== MÉTHODES D'EXPORT ET DEBUG =====

  getEvents(filters?: { eventName?: string; since?: number; limit?: number }): BusinessEvent[] {
    let filteredEvents = [...this.events]

    if (filters?.eventName) {
      filteredEvents = filteredEvents.filter((e) => e.name === filters.eventName)
    }

    if (filters?.since) {
      filteredEvents = filteredEvents.filter((e) => e.timestamp >= (filters.since ?? 0))
    }

    if (filters?.limit) {
      filteredEvents = filteredEvents.slice(-filters.limit)
    }

    return filteredEvents
  }

  generateReport(): {
    sessionId: string
    eventCount: number
    uniqueEvents: string[]
    topEvents: Array<{ name: string; count: number }>
    sessionDuration: number
    isClient: boolean
    initialized: boolean
  } {
    const eventCounts = new Map<string, number>()

    for (const event of this.events) {
      eventCounts.set(event.name, (eventCounts.get(event.name) || 0) + 1)
    }

    const topEvents = Array.from(eventCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const sessionStart =
      this.events.find((e) => e.name === 'session_started')?.timestamp || Date.now()
    const sessionDuration = Date.now() - sessionStart

    return {
      sessionId: this.sessionId,
      eventCount: this.events.length,
      uniqueEvents: Array.from(eventCounts.keys()),
      topEvents,
      sessionDuration,
      isClient: this.isClient,
      initialized: this.initialized,
    }
  }

  exportData(): string {
    return JSON.stringify(
      {
        events: this.events,
        userContext: this.userContext,
        sessionId: this.sessionId,
        isClient: this.isClient,
        initialized: this.initialized,
        exportedAt: Date.now(),
      },
      null,
      2
    )
  }

  /**
   * Nettoyage des ressources
   */
  cleanup(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }

    // Envoyer les derniers événements
    if (this.events.length > 0) {
      // biome-ignore lint/suspicious/noConsole: Legitimate warning for failed event flush
      this.flushEvents().catch(console.warn)
    }
  }
}

// ===== INSTANCE LAZY ET HOOK REACT =====

let businessMetricsInstance: BusinessMetrics | null = null

/**
 * Obtenir l'instance (lazy loading)
 */
function getBusinessMetrics(): BusinessMetrics {
  if (!businessMetricsInstance) {
    businessMetricsInstance = new BusinessMetrics({
      enableDebugLogs: process.env.NODE_ENV === 'development',
    })
  }

  return businessMetricsInstance
}

/**
 * Hook React pour utiliser les métriques business
 */
export function useBusinessMetrics() {
  const metrics = getBusinessMetrics()

  return {
    track: metrics.track.bind(metrics),
    setUserContext: metrics.setUserContext.bind(metrics),

    // Métriques spécifiques
    trackProjectCreated: metrics.trackProjectCreated.bind(metrics),
    trackProjectStatusChanged: metrics.trackProjectStatusChanged.bind(metrics),
    trackProjectViewed: metrics.trackProjectViewed.bind(metrics),
    trackProductionStarted: metrics.trackProductionStarted.bind(metrics),
    trackProductionCompleted: metrics.trackProductionCompleted.bind(metrics),
    trackUserAction: metrics.trackUserAction.bind(metrics),
    trackFormSubmission: metrics.trackFormSubmission.bind(metrics),
    trackSearchPerformed: metrics.trackSearchPerformed.bind(metrics),
    trackPerformanceMetric: metrics.trackPerformanceMetric.bind(metrics),
    trackError: metrics.trackError.bind(metrics),

    // Utilitaires
    getEvents: metrics.getEvents.bind(metrics),
    generateReport: metrics.generateReport.bind(metrics),
    exportData: metrics.exportData.bind(metrics),
    cleanup: metrics.cleanup.bind(metrics),
  }
}

// ===== EXPORTS =====
export { BusinessMetrics, getBusinessMetrics }
export default getBusinessMetrics
