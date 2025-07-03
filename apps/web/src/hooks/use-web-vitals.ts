// apps/web/src/hooks/use-web-vitals.ts
'use client'

import { useEffect, useState } from 'react'

interface WebVitalsMetrics {
  CLS?: number
  FID?: number
  FCP?: number
  LCP?: number
  TTFB?: number
}

export function useWebVitals(): WebVitalsMetrics {
  const [vitals, setVitals] = useState<WebVitalsMetrics>({})

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
      }).catch((error) => {
        console.warn('Could not load web-vitals:', error)
      })
    }
  }, [])

  return vitals
}