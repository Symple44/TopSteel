/**
 * 🔍 HOOKS DE MONITORING PERFORMANCE
 */
import { useEffect, useRef, useState } from 'react'

export interface PerformanceMetrics {
  componentName: string
  renderTime: number
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  
  recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric)
    
    // Garder seulement les 100 dernières métriques
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }
    
    // Log si performance dégradée
    if (metric.renderTime > 16) { // > 1 frame
      console.warn(`🐌 Render lent: ${metric.componentName} (${metric.renderTime.toFixed(2)}ms)`)
    }
  }
  
  getMetrics() {
    return [...this.metrics]
  }
  
  getAverageRenderTime(componentName: string) {
    const componentMetrics = this.metrics.filter(m => m.componentName === componentName)
    if (componentMetrics.length === 0) return 0
    
    const total = componentMetrics.reduce((sum, m) => sum + m.renderTime, 0)
    return total / componentMetrics.length
  }
}

export const performanceMonitor = new PerformanceMonitor()

/**
 * Hook pour mesurer les performances de rendu
 */
export function useRenderPerformance(componentName: string) {
  const renderStart = useRef<number>()
  
  useEffect(() => {
    renderStart.current = performance.now()
  })
  
  useEffect(() => {
    if (renderStart.current) {
      const renderTime = performance.now() - renderStart.current
      
      performanceMonitor.recordMetric({
        componentName,
        renderTime,
        timestamp: Date.now()
      })
    }
  })
}

/**
 * Hook pour monitoring Web Vitals
 */
export function useWebVitalsMonitoring() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(console.log)
        getFID(console.log)
        getFCP(console.log)
        getLCP(console.log)
        getTTFB(console.log)
      })
    }
  }, [])
}

/**
 * Hook pour debounce optimisé
 */
export function useOptimizedDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay])
  
  return debouncedValue
}
