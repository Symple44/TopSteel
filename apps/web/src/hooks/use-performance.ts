import { useCallback, useMemo, useRef } from 'react'

export function usePerformance() {
  const _startTime = useRef<number>(Date.now())
  const _metrics = useRef<Record<string, number>>({})

  const _measureTime = useCallback((label: string) => {
    const _now = Date.now()

    metrics.current[label] = now - startTime.current

    return metrics.current[label]
  }, [])

  const _getMetrics = useCallback(() => {
    return { ...metrics.current }
  }, [])

  const _resetMetrics = useCallback(() => {
    metrics.current = {}
    startTime.current = Date.now()
  }, [])

  const _averageTime = useMemo(() => {
    const _times = Object.values(metrics.current)

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

