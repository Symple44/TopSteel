/**
 * ⚡ TESTS DE PERFORMANCE
 */
import { performanceMonitor, useRenderPerformance } from '@/hooks/performance/use-performance'
import { renderHook } from '@testing-library/react'

describe('Performance Monitoring', () => {
  beforeEach(() => {
    // Reset metrics
    performanceMonitor['metrics'] = []
  })

  it('should record render metrics', () => {
    const { rerender } = renderHook(() => useRenderPerformance('TestComponent'))
    
    // Simuler un re-render
    rerender()
    
    const metrics = performanceMonitor.getMetrics()
    expect(metrics.length).toBeGreaterThan(0)
    expect(metrics[0].componentName).toBe('TestComponent')
  })

  it('should calculate average render time', () => {
    // Ajouter des métriques de test
    performanceMonitor.recordMetric({
      componentName: 'TestComponent',
      renderTime: 10,
      timestamp: Date.now()
    })
    
    performanceMonitor.recordMetric({
      componentName: 'TestComponent',
      renderTime: 20,
      timestamp: Date.now()
    })

    const average = performanceMonitor.getAverageRenderTime('TestComponent')
    expect(average).toBe(15)
  })

  it('should warn for slow renders', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
    
    performanceMonitor.recordMetric({
      componentName: 'SlowComponent',
      renderTime: 50, // > 16ms
      timestamp: Date.now()
    })

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Render lent: SlowComponent')
    )
    
    consoleSpy.mockRestore()
  })
})
