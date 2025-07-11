/**
 * 📊 MÉTRIQUES BUSINESS
 */
interface BusinessEvent {
  name: string
  properties: Record<string, any>
  timestamp: number
  userId?: string
  sessionId?: string
}

class BusinessMetrics {
  private events: BusinessEvent[] = []
  private sessionId: string = Math.random().toString(36).substring(7)

  track(eventName: string, properties: Record<string, any> = {}) {
    const event: BusinessEvent = {
      name: eventName,
      properties: {
        ...properties,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    }

    this.events.push(event)

    // Garder seulement les 1000 derniers événements
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000)
    }

    // Log en développement
    if (process.env.NODE_ENV === 'development') {
    }

    // Envoyer au backend (à implémenter)
    this.sendToBackend(event)
  }

  // Métriques spécifiques TopSteel
  trackProjectCreated(projectData: unknown) {
    this.track('project_created', {
      projectType: projectData.type,
      clientId: projectData.clientId,
      estimatedValue: projectData.montantEstime,
    })
  }

  trackProjectStatusChanged(projectId: string, oldStatus: string, newStatus: string) {
    this.track('project_status_changed', {
      projectId,
      oldStatus,
      newStatus,
      duration: Date.now(),
    })
  }

  trackUserAction(action: string, context: Record<string, any> = {}) {
    this.track('user_action', {
      action,
      ...context,
    })
  }

  trackPerformance(component: string, duration: number) {
    this.track('performance_metric', {
      component,
      duration,
      threshold: duration > 100 ? 'slow' : 'fast',
    })
  }

  trackError(error: Error, context: Record<string, any> = {}) {
    this.track('error_occurred', {
      message: error.message,
      stack: error.stack?.substring(0, 500),
      name: error.name,
      ...context,
    })
  }

  private async sendToBackend(event: BusinessEvent) {
    try {
      // Batch les événements toutes les 10 secondes
      // ou quand il y en a plus de 50
      // (à implémenter selon les besoins)
    } catch (error) {
      console.warn('Erreur envoi métrique:', error)
    }
  }

  getEvents() {
    return [...this.events]
  }

  export() {
    return {
      events: this.events,
      sessionId: this.sessionId,
      exportedAt: Date.now(),
    }
  }
}

export const businessMetrics = new BusinessMetrics()

// Hook React pour faciliter l'usage
export function useBusinessMetrics() {
  return {
    track: businessMetrics.track.bind(businessMetrics),
    trackProjectCreated: businessMetrics.trackProjectCreated.bind(businessMetrics),
    trackProjectStatusChanged: businessMetrics.trackProjectStatusChanged.bind(businessMetrics),
    trackUserAction: businessMetrics.trackUserAction.bind(businessMetrics),
    trackPerformance: businessMetrics.trackPerformance.bind(businessMetrics),
    trackError: businessMetrics.trackError.bind(businessMetrics),
  }
}
