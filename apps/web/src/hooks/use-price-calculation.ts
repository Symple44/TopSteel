'use client'

import type { SimulationContext, SimulationResult } from '@erp/ui'
import { useCallback, useState } from 'react'
import { useApiClient } from '@/lib/api-client-enhanced'

export interface PriceCalculationDetailedResult extends SimulationResult {
  breakdown?: {
    steps: Array<{
      stepNumber: number
      ruleName: string
      ruleId: string
      priceBefore: number
      priceAfter: number
      adjustment: number
      adjustmentType: string
      description: string
    }>
    skippedRules: Array<{
      ruleId: string
      ruleName: string
      reason: string
      priority: number
    }>
    context: {
      article: {
        id: string
        reference: string
        designation: string
        famille?: string
        dimensions?: {
          poids?: number
          longueur?: number
          largeur?: number
          hauteur?: number
          surface?: number
          volume?: number
        }
        units?: {
          stock?: string
          vente?: string
          achat?: string
        }
      }
      customer?: {
        id?: string
        group?: string
        email?: string
      }
      quantity: number
      channel: string
    }
    margins?: {
      costPrice?: number
      sellingPrice: number
      margin: number
      marginPercentage: number
      markupPercentage: number
    }
    metadata?: {
      calculationTime: number
      rulesEvaluated: number
      rulesApplied: number
      cacheHit: boolean
    }
  }
}

export interface UsePriceCalculationOptions {
  detailed?: boolean
  includeMargins?: boolean
  includeSkippedRules?: boolean
  cache?: boolean
}

export interface UsePriceCalculationReturn {
  calculate: (context: SimulationContext) => Promise<SimulationResult>
  calculateDetailed: (context: SimulationContext) => Promise<PriceCalculationDetailedResult>
  calculateBulk: (contexts: SimulationContext[]) => Promise<Map<string, SimulationResult>>
  simulateScenarios: (
    baseContext: SimulationContext,
    scenarios: Partial<SimulationContext>[]
  ) => Promise<SimulationResult[]>
  loading: boolean
  error: string | null
  lastResult: SimulationResult | PriceCalculationDetailedResult | null
}

export function usePriceCalculation(
  options: UsePriceCalculationOptions = {}
): UsePriceCalculationReturn {
  const {
    detailed = false,
    includeMargins = false,
    includeSkippedRules = true,
    cache = true,
  } = options

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<
    SimulationResult | PriceCalculationDetailedResult | null
  >(null)

  const apiClient = useApiClient()
  const resultsCache = new Map<string, SimulationResult | PriceCalculationDetailedResult>()

  const getCacheKey = (context: SimulationContext): string => {
    return JSON.stringify({
      articleId: context.articleId,
      quantity: context.quantity,
      channel: context.channel,
      customerGroup: context.customerGroup,
      customerId: context.customerId,
    })
  }

  const calculate = useCallback(
    async (context: SimulationContext): Promise<SimulationResult> => {
      setLoading(true)
      setError(null)

      try {
        // Vérifier le cache
        if (cache) {
          const cacheKey = getCacheKey(context)
          const cached = resultsCache.get(cacheKey)
          if (cached && !('breakdown' in cached)) {
            setLastResult(cached)
            return cached
          }
        }

        const response = await apiClient.post('/pricing/calculate', context)
        const result = response.data as SimulationResult

        // Mettre en cache
        if (cache) {
          resultsCache.set(getCacheKey(context), result)
        }

        setLastResult(result)
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors du calcul du prix'
        setError(errorMessage)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [apiClient, cache, getCacheKey, resultsCache.get, resultsCache.set]
  )

  const calculateDetailed = useCallback(
    async (context: SimulationContext): Promise<PriceCalculationDetailedResult> => {
      setLoading(true)
      setError(null)

      try {
        // Vérifier le cache
        if (cache) {
          const cacheKey = getCacheKey(context)
          const cached = resultsCache.get(cacheKey)
          if (cached && 'breakdown' in cached) {
            setLastResult(cached)
            return cached as PriceCalculationDetailedResult
          }
        }

        const params = new URLSearchParams()
        if (includeMargins) params.append('includeMargins', 'true')
        if (includeSkippedRules) params.append('includeSkippedRules', 'true')
        params.append('detailed', 'true')

        const response = await apiClient.post(`/pricing/calculate?${params.toString()}`, context)
        const result = response.data as PriceCalculationDetailedResult

        // Mettre en cache
        if (cache) {
          resultsCache.set(getCacheKey(context), result)
        }

        setLastResult(result)
        return result
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur lors du calcul détaillé du prix'
        setError(errorMessage)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [
      apiClient,
      cache,
      includeMargins,
      includeSkippedRules,
      getCacheKey,
      resultsCache.get,
      resultsCache.set,
    ]
  )

  const calculateBulk = useCallback(
    async (contexts: SimulationContext[]): Promise<Map<string, SimulationResult>> => {
      setLoading(true)
      setError(null)

      try {
        const response = await apiClient.post('/pricing/calculate-bulk', { contexts })
        const results = new Map<string, SimulationResult>()

        Object.entries(response.data).forEach(([key, value]) => {
          results.set(key, value as SimulationResult)

          // Mettre en cache si activé
          if (cache && contexts[parseInt(key)]) {
            resultsCache.set(getCacheKey(contexts[parseInt(key)]), value as SimulationResult)
          }
        })

        return results
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors du calcul en masse'
        setError(errorMessage)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [apiClient, cache, getCacheKey, resultsCache.set]
  )

  const simulateScenarios = useCallback(
    async (
      baseContext: SimulationContext,
      scenarios: Partial<SimulationContext>[]
    ): Promise<SimulationResult[]> => {
      setLoading(true)
      setError(null)

      try {
        const _contexts = scenarios.map((scenario) => ({ ...baseContext, ...scenario }))
        const response = await apiClient.post('/pricing/simulate-scenarios', {
          baseContext,
          scenarios,
        })

        return response.data.results as SimulationResult[]
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur lors de la simulation de scénarios'
        setError(errorMessage)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [apiClient]
  )

  return {
    calculate: detailed ? calculateDetailed : calculate,
    calculateDetailed,
    calculateBulk,
    simulateScenarios,
    loading,
    error,
    lastResult,
  }
}
