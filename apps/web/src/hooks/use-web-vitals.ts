// apps/web/src/hooks/use-web-vitals.ts
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

// Types mis à jour pour web-vitals v5.x
interface WebVitalsMetrics {
  CLS?: number
  INP?: number // Remplace FID (dépréciée)
  FCP?: number
  LCP?: number
  TTFB?: number
  // Métriques étendues pour surveillance avancée
  loadTime?: number
  renderTime?: number
  interactionDelay?: number
}

interface MetricOptions {
  enableConsoleLog?: boolean
  enableAnalytics?: boolean
  sampleRate?: number
  reportAllChanges?: boolean
}

export function useWebVitals(options: MetricOptions = {}): WebVitalsMetrics {
  const {
    enableConsoleLog = process.env.NODE_ENV === 'development',
    enableAnalytics = process.env.NODE_ENV === 'production',
    sampleRate = 1.0,
    reportAllChanges = false,
  } = options

  const [vitals, setVitals] = useState<WebVitalsMetrics>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Analytics helper avec debouncing
  const sendToAnalytics = useCallback(
    (metric: unknown) => {
      if (!enableAnalytics || Math.random() > sampleRate) return

      try {
        // Use sendBeacon for reliable delivery
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/analytics/vitals', JSON.stringify(metric))
        } else {
          fetch('/api/analytics/vitals', {
            method: 'POST',
            body: JSON.stringify(metric),
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
          }).catch((err) => console.warn('Analytics failed:', err))
        }
      } catch (err) {
        console.warn('Analytics error:', err)
      }
    },
    [enableAnalytics, sampleRate]
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    let mounted = true
    const startTime = performance.now()

    async function initWebVitals() {
      try {
        // Import dynamique avec fallback gracieux
        const webVitals = await import('web-vitals')

        if (!mounted) return

        // API v5.x avec nouvelles fonctions onXXX
        const { onCLS, onINP, onFCP, onLCP, onTTFB } = webVitals

        // CLS - Cumulative Layout Shift
        onCLS(
          (metric) => {
            if (!mounted) return
            setVitals((prev) => ({ ...prev, CLS: metric.value }))
            if (enableConsoleLog) sendToAnalytics({ ...metric, timestamp: Date.now() })
          },
          { reportAllChanges }
        )

        // INP - Interaction to Next Paint (remplace FID)
        onINP(
          (metric) => {
            if (!mounted) return
            setVitals((prev) => ({ ...prev, INP: metric.value }))
            if (enableConsoleLog) sendToAnalytics({ ...metric, timestamp: Date.now() })
          },
          { reportAllChanges }
        )

        // FCP - First Contentful Paint
        onFCP((metric) => {
          if (!mounted) return
          setVitals((prev) => ({ ...prev, FCP: metric.value }))
          if (enableConsoleLog) sendToAnalytics({ ...metric, timestamp: Date.now() })
        })

        // LCP - Largest Contentful Paint
        onLCP(
          (metric) => {
            if (!mounted) return
            setVitals((prev) => ({ ...prev, LCP: metric.value }))
            if (enableConsoleLog) sendToAnalytics({ ...metric, timestamp: Date.now() })
          },
          { reportAllChanges }
        )

        // TTFB - Time to First Byte
        onTTFB((metric) => {
          if (!mounted) return
          setVitals((prev) => ({ ...prev, TTFB: metric.value }))
          if (enableConsoleLog) sendToAnalytics({ ...metric, timestamp: Date.now() })
        })

        // Métriques personnalisées TopSteel
        const loadTime = performance.now() - startTime

        setVitals((prev) => ({
          ...prev,
          loadTime,
          renderTime: performance.now() - performance.timeOrigin,
        }))

        setIsLoading(false)
        if (enableConsoleLog) {
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'

        setError(`Failed to load web-vitals: ${errorMsg}`)
        setIsLoading(false)

        if (enableConsoleLog) {
          console.warn('❌ Web Vitals loading failed:', err)
          console.info('💡 Fallback: Using basic performance metrics')
        }

        // Fallback avec Performance API native
        if (performance?.timing) {
          const navigation = performance.timing

          setVitals({
            loadTime: navigation.loadEventEnd - navigation.navigationStart,
            renderTime: navigation.domContentLoadedEventEnd - navigation.navigationStart,
            TTFB: navigation.responseStart - navigation.navigationStart,
          })
        }
      }
    }

    initWebVitals()

    return () => {
      mounted = false
    }
  }, [enableConsoleLog, enableAnalytics, sampleRate, reportAllChanges, sendToAnalytics])

  return {
    ...vitals,
    // Méta-informations pour debugging
    ...(enableConsoleLog && {
      _meta: {
        isLoading,
        error,
        lastUpdated: new Date().toISOString(),
      },
    }),
  }
}

// Hook spécialisé pour les métriques business TopSteel
export function useTopSteelMetrics() {
  const vitals = useWebVitals({
    enableAnalytics: true,
    sampleRate: 0.1, // 10% sampling pour production
    reportAllChanges: true,
  })

  // Analyse de performance spécifique métallurgie
  const performanceGrade = useMemo(() => {
    if (!vitals.LCP || !vitals.CLS || !vitals.INP) return null

    let score = 100

    // Seuils optimisés pour applications industrielles
    if (vitals.LCP > 4000)
      score -= 30 // LCP > 4s
    else if (vitals.LCP > 2500) score -= 15 // LCP > 2.5s

    if (vitals.CLS > 0.25)
      score -= 25 // CLS > 0.25
    else if (vitals.CLS > 0.1) score -= 10 // CLS > 0.1

    if (vitals.INP > 500)
      score -= 20 // INP > 500ms
    else if (vitals.INP > 200) score -= 10 // INP > 200ms

    if (score >= 90) return 'EXCELLENT'
    if (score >= 75) return 'BON'
    if (score >= 50) return 'MOYEN'

    return 'CRITIQUE'
  }, [vitals.LCP, vitals.CLS, vitals.INP])

  return {
    ...vitals,
    performanceGrade,
    isHealthy: performanceGrade === 'EXCELLENT' || performanceGrade === 'BON',
  }
}

export default useWebVitals
