import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'

// Types pour les paramètres utilisateur
interface UserSettings {
  profile: {
    firstName: string
    lastName: string
    email: string
    phone: string
    position: string
    department: string
  }
  company: {
    name: string
    address: string
    city: string
    postalCode: string
    country: string
  }
  preferences: {
    language: string
    timezone: string
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
    }
  }
}

// Query keys
const QUERY_KEYS = {
  userSettings: ['user-settings'] as const,
  userProfile: ['user-profile'] as const,
  userPreferences: ['user-preferences'] as const,
} as const

export function useUserSettings() {
  return useQuery({
    queryKey: QUERY_KEYS.userSettings,
    queryFn: () => apiClient.get<UserSettings>('/user/settings'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (profile: Partial<UserSettings['profile']>) => 
      apiClient.patch<UserSettings>('/user/profile', profile),
    onSuccess: (updatedSettings: UserSettings) => {
      queryClient.setQueryData(QUERY_KEYS.userSettings, updatedSettings)
      toast.success('Profil mis à jour avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour du profil')
    },
  })
}

export function useUpdateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (company: Partial<UserSettings['company']>) => 
      apiClient.patch<UserSettings>('/user/settings', { company }),
    onSuccess: (updatedSettings: UserSettings) => {
      queryClient.setQueryData(QUERY_KEYS.userSettings, updatedSettings)
      toast.success('Informations de l\'entreprise mises à jour')
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour des informations de l\'entreprise')
    },
  })
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (preferences: Partial<UserSettings['preferences']>) => 
      apiClient.patch<UserSettings>('/user/preferences', preferences),
    onSuccess: (updatedSettings: UserSettings) => {
      queryClient.setQueryData(QUERY_KEYS.userSettings, updatedSettings)
      toast.success('Préférences mises à jour avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour des préférences')
    },
  })
}

export function useUpdateNotifications() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notifications: UserSettings['preferences']['notifications']) => 
      apiClient.patch<UserSettings>('/user/preferences', { notifications }),
    onSuccess: (updatedSettings: UserSettings) => {
      queryClient.setQueryData(QUERY_KEYS.userSettings, updatedSettings)
      toast.success('Paramètres de notification mis à jour')
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour des notifications')
    },
  })
}