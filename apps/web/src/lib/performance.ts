// apps/web/src/lib/performance.ts
export class PerformanceMonitor {
  static measureComponentRender(componentName: string) {
    return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
      const method = descriptor.value
      
      descriptor.value = function(...args: any[]) {
        const start = performance.now()
        const result = method.apply(this, args)
        const end = performance.now()
        
        if (end - start > 16) { // Plus de 16ms = problème
          console.warn(`${componentName}.${propertyName} took ${end - start}ms`)
        }
        
        return result
      }
    }
  }

  static trackQuery(queryKey: string, duration: number) {
    // Envoyer à votre service d'analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'query_performance', {
        custom_parameter_1: queryKey,
        value: Math.round(duration),
      })
    }
  }
}