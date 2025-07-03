/**
 * 📊 MONITORING DE PERFORMANCE - TopSteel ERP
 */
import { useEffect, useRef, useState, useCallback } from 'react'

interface PerformanceMetric {
  component: string
  renderTime: number
  timestamp: number
  props?: string[]
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private readonly maxMetrics = 1000

  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)
    
    // Garder seulement les métriques récentes
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
    
    // Alert pour renders lents
    if (metric.renderTime > 16) { // > 1 frame à 60fps
      console.warn(`🐌 Render lent détecté: ${metric.component} (${metric.renderTime.toFixed(2)}ms)`)
    }
  }

  getMetrics(component?: string): PerformanceMetric[] {
    if (!component) return [...this.metrics]
    return this.metrics.filter(m => m.component === component)
  }

  getAverageRenderTime(component: string): number {
    const componentMetrics = this.getMetrics(component)
    if (componentMetrics.length === 0) return 0
    
    const total = componentMetrics.reduce((sum, m) => sum + m.renderTime, 0)
    return total / componentMetrics.length
  }

  getSlowRenders(threshold = 16): PerformanceMetric[] {
    return this.metrics.filter(m => m.renderTime > threshold)
  }

  generateReport(): {
    totalRenders: number
    averageRenderTime: number
    slowRenders: number
    worstPerformers: Array<{ component: string; avgTime: number }>
  } {
    const total = this.metrics.length
    const avgTime = total > 0 ? 
      this.metrics.reduce((sum, m) => sum + m.renderTime, 0) / total : 0
    
    const componentStats = new Map<string, number[]>()
    this.metrics.forEach(m => {
      if (!componentStats.has(m.component)) {
        componentStats.set(m.component, [])
      }
      componentStats.get(m.component)!.push(m.renderTime)
    })

    const worstPerformers = Array.from(componentStats.entries())
      .map(([component, times]) => ({
        component,
        avgTime: times.reduce((sum, t) => sum + t, 0) / times.length
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10)

    return {
      totalRenders: total,
      averageRenderTime: avgTime,
      slowRenders: this.getSlowRenders().length,
      worstPerformers
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()

/**
 * Hook pour mesurer les performances de rendu
 */
export function useRenderPerformance(componentName: string, trackProps = false) {
  const renderStart = useRef<number>()
  const propsRef = useRef<string[]>([])
  
  // Démarrer la mesure
  renderStart.current = performance.now()
  
  useEffect(() => {
    if (renderStart.current) {
      const renderTime = performance.now() - renderStart.current
      
      performanceMonitor.recordMetric({
        component: componentName,
        renderTime,
        timestamp: Date.now(),
        props: trackProps ? propsRef.current : undefined
      })
    }
  })

  const trackProp = useCallback((propName: string) => {
    if (trackProps) {
      propsRef.current.push(propName)
    }
  }, [trackProps])

  return { trackProp }
}

/**
 * Hook pour Web Vitals
 */
export function useWebVitals() {
  const [vitals, setVitals] = useState<Record<string, number>>({})

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS((metric) => {
          setVitals(prev => ({ ...prev, CLS: metric.value }))
          console.log('📊 CLS:', metric.value)
        })
        
        getFID((metric) => {
          setVitals(prev => ({ ...prev, FID: metric.value }))
          console.log('📊 FID:', metric.value)
        })
        
        getFCP((metric) => {
          setVitals(prev => ({ ...prev, FCP: metric.value }))
          console.log('📊 FCP:', metric.value)
        })
        
        getLCP((metric) => {
          setVitals(prev => ({ ...prev, LCP: metric.value }))
          console.log('📊 LCP:', metric.value)
        })
        
        getTTFB((metric) => {
          setVitals(prev => ({ ...prev, TTFB: metric.value }))
          console.log('📊 TTFB:', metric.value)
        })
      })
    }
  }, [])

  return vitals
}

/**
 * Hook HOC pour wrapper automatiquement les composants
 */
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component'
  
  const MonitoredComponent = (props: P) => {
    useRenderPerformance(displayName)
    return <WrappedComponent {...props} />
  }
  
  MonitoredComponent.displayName = `withPerformanceMonitoring(${displayName})`
  
  return MonitoredComponent
}
