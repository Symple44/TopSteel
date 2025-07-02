// apps/web/src/lib/performance-monitor.ts
export class PerformanceMonitor {
  static measureRender(componentName: string) {
    return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
      const method = descriptor.value
      
      descriptor.value = function(...args: any[]) {
        const start = performance.now()
        const result = method.apply(this, args)
        const end = performance.now()
        
        if (end - start > 16) {
          console.warn(`${componentName}.${propertyName} render took ${Math.round(end - start)}ms`)
        }
        
        return result
      }
    }
  }

  static trackPageLoad(pageName: string) {
    if (typeof window !== 'undefined') {
      const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart
      
      if (loadTime > 3000) {
        console.warn(`${pageName} load time: ${loadTime}ms`)
      }
      
      // Send to analytics
      if (window.gtag) {
        window.gtag('event', 'page_load_performance', {
          page_name: pageName,
          load_time: loadTime,
        })
      }
    }
  }

  static trackLCP() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        const lastEntry = entries[entries.length - 1]
        
        if (lastEntry.startTime > 2500) {
          console.warn(`LCP: ${Math.round(lastEntry.startTime)}ms`)
        }
      })
      
      observer.observe({ type: 'largest-contentful-paint', buffered: true })
    }
  }
}
