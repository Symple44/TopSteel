import { useCallback, useMemo, useRef } from 'react'

export function usePerformance() {
  const startTime = useRef<number>(Date.now())
  const metrics = useRef<Record<string, number>>({})

  const measureTime = useCallback((label: string) => {
    const now = Date.now()
    metrics.current[label] = now - startTime.current
    return metrics.current[label]
  }, [])

  const getMetrics = useCallback(() => {
    return { ...metrics.current }
  }, [])

  const resetMetrics = useCallback(() => {
    metrics.current = {}
    startTime.current = Date.now()
  }, [])

  const averageTime = useMemo(() => {
    const times = Object.values(metrics.current)
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
  }, [])

  return {
    measureTime,
    getMetrics,
    resetMetrics,
    averageTime,
    metrics: metrics.current
  }
}
