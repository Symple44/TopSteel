/**
 * 📈 MÉTRIQUES BUSINESS - TopSteel ERP
 */
interface BusinessEvent {
  name: string
  properties: Record<string, any>
  timestamp: number
  userId?: string
  sessionId: string
}

interface UserContext {
  userId?: string
  role?: string
  permissions?: string[]
}

class BusinessMetrics {
  private events: BusinessEvent[] = []
  private readonly sessionId: string
  private userContext: UserContext = {}
  private readonly maxEvents = 5000

  constructor() {
    this.sessionId = this.generateSessionId()
    this.initializeSession()
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private initializeSession() {
    this.track('session_started', {
      userAgent: navigator?.userAgent || 'unknown',
      timestamp: Date.now(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
  }

  setUserContext(context: UserContext) {
    this.userContext = { ...context }
    this.track('user_context_updated', context)
  }

  track(eventName: string, properties: Record<string, any> = {}) {
    const event: BusinessEvent = {
      name: eventName,
      properties: {
        ...properties,
        url: window?.location?.href || '',
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      userId: this.userContext.userId,
      sessionId: this.sessionId
    }
    
    this.events.push(event)
    
    // Limiter le nombre d'événements en mémoire
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }
    
    // Log en développement
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Métrique Business:', event)
    }
    
    // Envoyer au backend (si configuré)
    this.sendToBackend(event)
  }

  // === MÉTRIQUES SPÉCIFIQUES TOPSTEEL ===

  // Projets
  trackProjectCreated(projectData: {
    type?: string
    clientId?: string
    estimatedValue?: number
    complexity?: 'simple' | 'medium' | 'complex'
  }) {
    this.track('project_created', {
      projectType: projectData.type,
      clientId: projectData.clientId,
      estimatedValue: projectData.estimatedValue,
      complexity: projectData.complexity
    })
  }

  trackProjectStatusChanged(projectId: string, oldStatus: string, newStatus: string) {
    this.track('project_status_changed', {
      projectId,
      oldStatus,
      newStatus,
      transitionType: this.getTransitionType(oldStatus, newStatus)
    })
  }

  trackProjectViewed(projectId: string, viewDuration?: number) {
    this.track('project_viewed', {
      projectId,
      viewDuration
    })
  }

  // Production
  trackProductionStarted(orderId: string, projectId: string) {
    this.track('production_started', {
      orderId,
      projectId
    })
  }

  trackProductionCompleted(orderId: string, duration: number, quality?: string) {
    this.track('production_completed', {
      orderId,
      duration,
      quality
    })
  }

  // Interface utilisateur
  trackUserAction(action: string, context: Record<string, any> = {}) {
    this.track('user_action', {
      action,
      page: window?.location?.pathname || '',
      ...context
    })
  }

  trackFormSubmission(formName: string, success: boolean, errors?: string[]) {
    this.track('form_submission', {
      formName,
      success,
      errorCount: errors?.length || 0,
      errors: errors?.slice(0, 5) // Limiter les erreurs logguées
    })
  }

  trackSearchPerformed(query: string, resultCount: number, filters?: Record<string, any>) {
    this.track('search_performed', {
      query: query.substring(0, 100), // Limiter la taille
      resultCount,
      filters
    })
  }

  // Performance
  trackPerformanceMetric(metric: string, value: number, context?: Record<string, any>) {
    this.track('performance_metric', {
      metric,
      value,
      unit: 'ms',
      ...context
    })
  }

  // Erreurs
  trackError(error: Error, context: Record<string, any> = {}) {
    this.track('error_occurred', {
      message: error.message,
      stack: error.stack?.substring(0, 1000), // Limiter la stack trace
      name: error.name,
      page: window?.location?.pathname || '',
      ...context
    })
  }

  // === MÉTHODES UTILITAIRES ===

  private getTransitionType(oldStatus: string, newStatus: string): string {
    const progressOrder = ['BROUILLON', 'DEVIS', 'ACCEPTE', 'EN_COURS', 'TERMINE', 'FACTURE']
    const oldIndex = progressOrder.indexOf(oldStatus)
    const newIndex = progressOrder.indexOf(newStatus)
    
    if (oldIndex < newIndex) return 'progress'
    if (oldIndex > newIndex) return 'regression'
    return 'lateral'
  }

  private async sendToBackend(event: BusinessEvent) {
    try {
      // TODO: Implémenter l'envoi vers votre API de métriques
      // fetch('/api/metrics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // })
    } catch (error) {
      console.warn('Erreur envoi métrique:', error)
    }
  }

  // === MÉTHODES D'EXPORT ===

  getEvents(filters?: {
    eventName?: string
    since?: number
    limit?: number
  }): BusinessEvent[] {
    let filteredEvents = [...this.events]
    
    if (filters?.eventName) {
      filteredEvents = filteredEvents.filter(e => e.name === filters.eventName)
    }
    
    if (filters?.since) {
      filteredEvents = filteredEvents.filter(e => e.timestamp >= filters.since!)
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
  } {
    const eventCounts = new Map<string, number>()
    this.events.forEach(event => {
      eventCounts.set(event.name, (eventCounts.get(event.name) || 0) + 1)
    })

    const topEvents = Array.from(eventCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const sessionStart = this.events.find(e => e.name === 'session_started')?.timestamp || Date.now()
    const sessionDuration = Date.now() - sessionStart

    return {
      sessionId: this.sessionId,
      eventCount: this.events.length,
      uniqueEvents: Array.from(eventCounts.keys()),
      topEvents,
      sessionDuration
    }
  }

  exportData(): string {
    return JSON.stringify({
      events: this.events,
      userContext: this.userContext,
      sessionId: this.sessionId,
      exportedAt: Date.now()
    }, null, 2)
  }
}

// Instance globale
export const businessMetrics = new BusinessMetrics()

// Hook React pour faciliter l'usage
export function useBusinessMetrics() {
  return {
    track: businessMetrics.track.bind(businessMetrics),
    setUserContext: businessMetrics.setUserContext.bind(businessMetrics),
    
    // Métriques spécifiques
    trackProjectCreated: businessMetrics.trackProjectCreated.bind(businessMetrics),
    trackProjectStatusChanged: businessMetrics.trackProjectStatusChanged.bind(businessMetrics),
    trackProjectViewed: businessMetrics.trackProjectViewed.bind(businessMetrics),
    trackProductionStarted: businessMetrics.trackProductionStarted.bind(businessMetrics),
    trackProductionCompleted: businessMetrics.trackProductionCompleted.bind(businessMetrics),
    trackUserAction: businessMetrics.trackUserAction.bind(businessMetrics),
    trackFormSubmission: businessMetrics.trackFormSubmission.bind(businessMetrics),
    trackSearchPerformed: businessMetrics.trackSearchPerformed.bind(businessMetrics),
    trackPerformanceMetric: businessMetrics.trackPerformanceMetric.bind(businessMetrics),
    trackError: businessMetrics.trackError.bind(businessMetrics),
    
    // Utilitaires
    getEvents: businessMetrics.getEvents.bind(businessMetrics),
    generateReport: businessMetrics.generateReport.bind(businessMetrics),
    exportData: businessMetrics.exportData.bind(businessMetrics)
  }
}

export default businessMetrics
