import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiClient } from '@/lib/api-client'

interface SystemParameter {
  id: string
  key: string
  value: string
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ENUM'
  category: 'GENERAL' | 'COMPTABILITE' | 'PROJETS' | 'PRODUCTION' | 'ACHATS' | 'STOCKS' | 'NOTIFICATION' | 'SECURITY' | 'ELASTICSEARCH'
  description: string
  defaultValue?: string
  isEditable: boolean
  isSecret: boolean
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface UseSystemParametersReturn {
  parameters: Record<string, string> | undefined
  isLoading: boolean
  error: Error | null
  updateParameter: (key: string, value: string) => void
  saveParameters: () => Promise<void>
  resetToDefaults: () => Promise<void>
}

export function useSystemParameters(): UseSystemParametersReturn {
  const queryClient = useQueryClient()
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, string>>({})

  // Fetch all system parameters
  const { data: parametersList, isLoading, error } = useQuery({
    queryKey: ['system-parameters'],
    queryFn: async () => {
      const response = await fetch('/api/admin/system-parameters')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    },
  })

  // Convert parameters list to key-value object
  const parameters = parametersList?.reduce((acc: Record<string, string>, param) => {
    acc[param.key] = pendingUpdates[param.key] ?? param.value
    return acc
  }, {} as Record<string, string>)

  // Update multiple parameters
  const updateMutation = useMutation({
    mutationFn: async (updates: Array<{ key: string; value: string }>) => {
      const response = await fetch('/api/admin/system-parameters', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-parameters'] })
      setPendingUpdates({})
    },
  })

  // Update a single parameter locally
  const updateParameter = (key: string, value: string) => {
    setPendingUpdates(prev => ({ ...prev, [key]: value }))
  }

  // Save all pending updates
  const saveParameters = async () => {
    const updates = Object.entries(pendingUpdates).map(([key, value]) => ({
      key,
      value,
    }))
    
    if (updates.length > 0) {
      await updateMutation.mutateAsync(updates)
    }
  }

  // Reset parameters to defaults
  const resetToDefaults = async () => {
    if (!parametersList) {
      console.log('No parameters list available for reset')
      return
    }
    
    console.log('All parameters for reset:', parametersList)
    
    const updates = parametersList
      .filter(param => param.defaultValue !== undefined)
      .map(param => ({
        key: param.key,
        value: param.defaultValue || '',
      }))
    
    console.log('Resetting parameters to defaults:', updates)
    
    if (updates.length === 0) {
      console.log('No parameters to reset')
      return
    }
    
    await updateMutation.mutateAsync(updates)
  }

  return {
    parameters,
    isLoading,
    error: error as Error | null,
    updateParameter,
    saveParameters,
    resetToDefaults,
  }
}

// Hook for fetching parameters by category
export function useSystemParametersByCategory(category?: string) {
  return useQuery({
    queryKey: ['system-parameters', 'by-category', category],
    queryFn: async () => {
      const url = category 
        ? `/api/admin/system-parameters?category=${category}`
        : '/api/admin/system-parameters/by-category'
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    },
  })
}

// Hook for fetching company info
export function useCompanyInfo() {
  return useQuery({
    queryKey: ['system-parameters', 'company-info'],
    queryFn: async () => {
      return apiClient.get<{
        name: string
        address: string
        phone: string
        email: string
        siret: string
        tva: string
      }>('/api/admin/system-parameters/public/company-info')
    },
  })
}

// Hook for fetching enums
export function useSystemEnums(category: string) {
  return useQuery({
    queryKey: ['system-parameters', 'enums', category],
    queryFn: async () => {
      return apiClient.get<string[]>(`/api/admin/system-parameters/public/enums/${category}`)
    },
    enabled: !!category,
  })
}