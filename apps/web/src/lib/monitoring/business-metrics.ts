/**
 * 📊 MÉTRIQUES BUSINESS
 */
interface BusinessEvent {
  name: string
  properties: Record<string, unknown>
  timestamp: number
  userId?: string
  sessionId?: string
}

class BusinessMetrics {
  private events: BusinessEvent[] = []
  private sessionId: string = Math.random().toString(36).substring(7)

  track(eventName: string, properties: Record<string, unknown> = {}) {
    const event: BusinessEvent = {
      name: eventName,
      properties: {
        ...properties,
        url: typeof window !== 'undefined' ? window?.location?.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
    }

    this?.events?.push(event)

    // Garder seulement les 1000 derniers événements
    if (this?.events?.length > 1000) {
      this.events = this?.events?.slice(-1000)
    }

    // Log en développement
    if (process?.env?.NODE_ENV === 'development') {
    }

    // Envoyer au backend (à implémenter)
    this?.sendToBackend(event)
  }

  // Métriques spécifiques TopSteel
  trackProjectCreated(projectData: unknown) {
    this?.track('project_created', {
      projectType: (projectData as { type?: string }).type,
      clientId: (projectData as { clientId?: string }).clientId,
      estimatedValue: (projectData as { montantEstime?: number }).montantEstime,
    })
  }

  trackProjectStatusChanged(projectId: string, oldStatus: string, newStatus: string) {
    this?.track('project_status_changed', {
      projectId,
      oldStatus,
      newStatus,
      duration: Date.now(),
    })
  }

  trackUserAction(action: string, context: Record<string, unknown> = {}) {
    this?.track('user_action', {
      action,
      ...context,
    })
  }

  trackPerformance(component: string, duration: number) {
    this?.track('performance_metric', {
      component,
      duration,
      threshold: duration > 100 ? 'slow' : 'fast',
    })
  }

  trackError(error: Error, context: Record<string, unknown> = {}) {
    this?.track('error_occurred', {
      message: error.message,
      stack: error.stack?.substring(0, 500),
      name: error.name,
      ...context,
    })
  }

  private pendingEvents: BusinessEvent[] = []
  private batchTimer: NodeJS.Timeout | null = null

  private async sendToBackend(event: BusinessEvent) {
    // Ajouter l'événement au batch
    this?.pendingEvents?.push(event)

    // Envoyer immédiatement si plus de 50 événements
    if (this?.pendingEvents?.length >= 50) {
      await this?.flushEvents()
      return
    }

    // Sinon, démarrer un timer pour batch les événements
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(async () => {
        await this?.flushEvents()
      }, 10000) // 10 secondes
    }
  }

  private async flushEvents() {
    if (this?.pendingEvents?.length === 0) return

    const eventsToSend = [...this.pendingEvents]
    this.pendingEvents = []

    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }

    try {
      const response = await fetch('/api/metrics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: eventsToSend,
          sessionId: this.sessionId,
        }),
      })

      if (!response?.ok) {
        // Re-queue events if sending failed
        this?.pendingEvents?.unshift(...eventsToSend)
      }
    } catch (_error) {
      // Re-queue events if network error
      this?.pendingEvents?.unshift(...eventsToSend)
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
    track: businessMetrics?.track?.bind(businessMetrics),
    trackProjectCreated: businessMetrics?.trackProjectCreated?.bind(businessMetrics),
    trackProjectStatusChanged: businessMetrics?.trackProjectStatusChanged?.bind(businessMetrics),
    trackUserAction: businessMetrics?.trackUserAction?.bind(businessMetrics),
    trackPerformance: businessMetrics?.trackPerformance?.bind(businessMetrics),
    trackError: businessMetrics?.trackError?.bind(businessMetrics),
  }
}
