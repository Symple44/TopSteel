'use client'

import type { PriceRule } from '@erp/ui'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useApiClient } from '@/lib/api-client-enhanced'
import { deleteTyped, fetchTyped, postTyped, putTyped } from '@/lib/api-typed'

export interface UsePriceRulesOptions {
  channel?: string
  active?: boolean
  articleId?: string
  articleFamily?: string
  search?: string
  autoLoad?: boolean
}

export interface UsePriceRulesReturn {
  rules: PriceRule[]
  loading: boolean
  error: string | null
  total: number
  loadRules: () => Promise<void>
  createRule: (rule: Partial<PriceRule>) => Promise<PriceRule>
  updateRule: (id: string, rule: Partial<PriceRule>) => Promise<PriceRule>
  deleteRule: (id: string) => Promise<void>
  toggleRule: (id: string) => Promise<void>
  duplicateRule: (id: string) => Promise<PriceRule>
  bulkDelete: (ids: string[]) => Promise<void>
  bulkToggle: (ids: string[], activate: boolean) => Promise<void>
  refresh: () => Promise<void>
}

export function usePriceRules(options: UsePriceRulesOptions = {}): UsePriceRulesReturn {
  const { channel, active, articleId, articleFamily, search, autoLoad = true } = options || {}

  const [rules, setRules] = useState<PriceRule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const apiClient = useApiClient()

  const loadRules = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (channel) params?.append('channel', channel)
      if (active !== undefined) params?.append('active', String(active))
      if (articleId) params?.append('articleId', articleId)
      if (articleFamily) params?.append('articleFamily', articleFamily)
      if (search) params?.append('search', search)

      const response = await fetchTyped(`/pricing/rules?${params?.toString()}`)

      const apiResponse = response as { data: { rules: PriceRule[]; total: number } }
      setRules(apiResponse.data?.rules || [])
      setTotal(apiResponse.data?.total ?? 0)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur lors du chargement des règles'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [channel, active, articleId, articleFamily, search])

  const createRule = useCallback(
    async (rule: Partial<PriceRule>): Promise<PriceRule> => {
      try {
        const response = await postTyped('/pricing/rules', rule)
        await loadRules()
        toast?.success('Règle créée avec succès')
        return (response as { data: PriceRule }).data
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur lors de la création de la règle'
        toast?.error(errorMessage)
        throw err
      }
    },
    [loadRules]
  )

  const updateRule = useCallback(
    async (id: string, rule: Partial<PriceRule>): Promise<PriceRule> => {
      try {
        const response = await putTyped<{ data: PriceRule }>(`/pricing/rules/${id}`, rule)
        await loadRules()
        toast?.success('Règle mise à jour avec succès')
        return (response as { data: PriceRule }).data
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la règle'
        toast?.error(errorMessage)
        throw err
      }
    },
    [loadRules]
  )

  const deleteRule = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleteTyped<void>(`/pricing/rules/${id}`)
        await loadRules()
        toast?.success('Règle supprimée avec succès')
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur lors de la suppression de la règle'
        toast?.error(errorMessage)
        throw err
      }
    },
    [loadRules]
  )

  const toggleRule = useCallback(
    async (id: string): Promise<void> => {
      try {
        await postTyped(`/pricing/rules/${id}/toggle`)
        await loadRules()

        const rule = rules?.find((r) => r.id === id)
        toast?.success(`Règle ${rule?.isActive ? 'désactivée' : 'activée'} avec succès`)
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur lors du changement de statut'
        toast?.error(errorMessage)
        throw err
      }
    },
    [loadRules, rules]
  )

  const duplicateRule = useCallback(
    async (id: string): Promise<PriceRule> => {
      try {
        const rule = rules?.find((r) => r.id === id)
        if (!rule) {
          throw new Error('Règle non trouvée')
        }

        const newRule: Partial<PriceRule> = {
          ...rule,
          id: undefined,
          ruleName: `${rule?.ruleName} (copie)`,
          isActive: false,
          usageCount: 0,
        }

        return await createRule(newRule)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la duplication'
        toast?.error(errorMessage)
        throw err
      }
    },
    [rules, createRule]
  )

  const bulkDelete = useCallback(
    async (ids: string[]): Promise<void> => {
      try {
        await Promise.all(ids?.map((id) => apiClient?.delete(`/pricing/rules/${id}`)))
        await loadRules()
        toast?.success(`${ids.length} règle(s) supprimée(s) avec succès`)
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur lors de la suppression en masse'
        toast?.error(errorMessage)
        throw err
      }
    },
    [apiClient, loadRules]
  )

  const bulkToggle = useCallback(
    async (ids: string[], activate: boolean): Promise<void> => {
      try {
        const rulesToToggle = rules?.filter((r) => ids?.includes(r.id) && r.isActive !== activate)

        await Promise.all(
          rulesToToggle?.map((rule) => apiClient?.post(`/pricing/rules/${rule?.id}/toggle`))
        )

        await loadRules()
        toast?.success(
          `${rulesToToggle?.length} règle(s) ${activate ? 'activée(s)' : 'désactivée(s)'} avec succès`
        )
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur lors du changement de statut en masse'
        toast?.error(errorMessage)
        throw err
      }
    },
    [apiClient, loadRules, rules]
  )

  const refresh = useCallback(async () => {
    await loadRules()
  }, [loadRules])

  useEffect(() => {
    if (autoLoad) {
      loadRules()
    }
  }, [autoLoad, loadRules])

  return {
    rules,
    loading,
    error,
    total,
    loadRules,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    duplicateRule,
    bulkDelete,
    bulkToggle,
    refresh,
  }
}
