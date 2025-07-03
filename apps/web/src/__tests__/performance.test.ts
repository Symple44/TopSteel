/**
 * ⚡ TESTS DE PERFORMANCE - TopSteel ERP
 */
import { renderHook, act } from '@testing-library/react'
import { performanceMonitor, useRenderPerformance, withPerformanceMonitoring } from '../hooks/use-performance-monitoring'
import { createOptimizedSelectors } from '../lib/optimized-selectors'
import React from 'react'

// Mock de performance.now
const mockPerformanceNow = jest.fn()
Object.defineProperty(window, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true
})

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Reset le monitor
    performanceMonitor['metrics'] = []
    mockPerformanceNow.mockClear()
  })

  it('should record render metrics', () => {
    const metric = {
      component: 'TestComponent',
      renderTime: 25,
      timestamp: Date.now()
    }

    performanceMonitor.recordMetric(metric)
    
    const metrics = performanceMonitor.getMetrics()
    expect(metrics).toHaveLength(1)
    expect(metrics[0]).toEqual(metric)
  })

  it('should warn for slow renders', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
    
    performanceMonitor.recordMetric({
      component: 'SlowComponent',
      renderTime: 50, // > 16ms
      timestamp: Date.now()
    })

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Render lent détecté: SlowComponent')
    )
    
    consoleSpy.mockRestore()
  })

  it('should calculate average render time', () => {
    const component = 'TestComponent'
    
    performanceMonitor.recordMetric({
      component,
      renderTime: 10,
      timestamp: Date.now()
    })
    
    performanceMonitor.recordMetric({
      component,
      renderTime: 20,
      timestamp: Date.now()
    })

    const average = performanceMonitor.getAverageRenderTime(component)
    expect(average).toBe(15)
  })

  it('should identify slow renders', () => {
    performanceMonitor.recordMetric({
      component: 'FastComponent',
      renderTime: 5,
      timestamp: Date.now()
    })
    
    performanceMonitor.recordMetric({
      component: 'SlowComponent',
      renderTime: 50,
      timestamp: Date.now()
    })

    const slowRenders = performanceMonitor.getSlowRenders(20)
    expect(slowRenders).toHaveLength(1)
    expect(slowRenders[0].component).toBe('SlowComponent')
  })

  it('should limit stored metrics', () => {
    const maxMetrics = 1000
    
    // Ajouter plus que la limite
    for (let i = 0; i < maxMetrics + 100; i++) {
      performanceMonitor.recordMetric({
        component: 'Component' + i,
        renderTime: 10,
        timestamp: Date.now()
      })
    }

    const metrics = performanceMonitor.getMetrics()
    expect(metrics.length).toBeLessThanOrEqual(maxMetrics)
  })

  it('should generate performance report', () => {
    performanceMonitor.recordMetric({
      component: 'ComponentA',
      renderTime: 10,
      timestamp: Date.now()
    })
    
    performanceMonitor.recordMetric({
      component: 'ComponentB',
      renderTime: 30,
      timestamp: Date.now()
    })
    
    performanceMonitor.recordMetric({
      component: 'ComponentA',
      renderTime: 20,
      timestamp: Date.now()
    })

    const report = performanceMonitor.generateReport()
    
    expect(report.totalRenders).toBe(3)
    expect(report.averageRenderTime).toBe(20)
    expect(report.slowRenders).toBe(1) // ComponentB avec 30ms
    expect(report.worstPerformers).toHaveLength(2)
    expect(report.worstPerformers[0].component).toBe('ComponentB')
  })
})

describe('useRenderPerformance', () => {
  beforeEach(() => {
    performanceMonitor['metrics'] = []
    mockPerformanceNow.mockReturnValue(1000)
  })

  it('should track component render performance', () => {
    mockPerformanceNow
      .mockReturnValueOnce(1000) // Début du render
      .mockReturnValueOnce(1025) // Fin du render (25ms plus tard)
    
    const { result } = renderHook(() => 
      useRenderPerformance('TestComponent')
    )

    // Simuler un re-render
    act(() => {
      // Le hook mesure automatiquement
    })

    const metrics = performanceMonitor.getMetrics('TestComponent')
    expect(metrics).toHaveLength(1)
    expect(metrics[0].renderTime).toBe(25)
    expect(metrics[0].component).toBe('TestComponent')
  })
})

describe('withPerformanceMonitoring', () => {
  it('should wrap component with performance monitoring', () => {
    const TestComponent = ({ name }: { name: string }) => (
      <div>Hello {name}</div>
    )

    const MonitoredComponent = withPerformanceMonitoring(TestComponent, 'TestComponent')
    
    expect(MonitoredComponent.displayName).toBe('withPerformanceMonitoring(TestComponent)')
    
    // Le composant wrappé devrait fonctionner normalement
    const element = React.createElement(MonitoredComponent, { name: 'World' })
    expect(element.type).toBe(MonitoredComponent)
  })
})

describe('createOptimizedSelectors', () => {
  it('should create optimized selectors', () => {
    const mockUseStore = jest.fn()
    const selectors = createOptimizedSelectors(mockUseStore)

    expect(typeof selectors.useShallow).toBe('function')
    expect(typeof selectors.useDeep).toBe('function')
    expect(typeof selectors.useSimple).toBe('function')
  })

  it('should call store with shallow comparison', () => {
    const mockUseStore = jest.fn()
    const selectors = createOptimizedSelectors(mockUseStore)
    const selector = (state: any) => state.user

    selectors.useShallow(selector)

    expect(mockUseStore).toHaveBeenCalledWith(selector, expect.any(Function))
  })
})

// Tests d'intégration pour mesurer les performances réelles
describe('Performance Integration Tests', () => {
  it('should measure real component render time', async () => {
    const TestComponent = () => {
      useRenderPerformance('IntegrationTestComponent')
      
      // Simuler du travail computationnel
      const start = performance.now()
      while (performance.now() - start < 10) {
        // Attendre 10ms
      }
      
      return <div>Test</div>
    }

    renderHook(() => React.createElement(TestComponent))
    
    // Attendre que les métriques soient enregistrées
    await new Promise(resolve => setTimeout(resolve, 0))
    
    const metrics = performanceMonitor.getMetrics('IntegrationTestComponent')
    expect(metrics.length).toBeGreaterThan(0)
    expect(metrics[0].renderTime).toBeGreaterThan(5) // Au moins quelques ms
  })
})
