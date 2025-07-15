import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { UserSettingsApiClient, type UserSettings, type UpdateUserSettingsDto } from '@erp/api-client'

// Configuration du client API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
const userSettingsApi = new UserSettingsApiClient({
  baseURL: API_BASE_URL,
})

// Query keys
const QUERY_KEYS = {
  userSettings: ['user-settings'] as const,
} as const

export function useUserSettings() {
  return useQuery({
    queryKey: QUERY_KEYS.userSettings,
    queryFn: () => userSettingsApi.getMySettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (settings: UpdateUserSettingsDto) => userSettingsApi.updateMySettings(settings),
    onSuccess: (updatedSettings: UserSettings) => {
      queryClient.setQueryData(QUERY_KEYS.userSettings, updatedSettings)
      toast.success('Paramètres mis à jour avec succès')
    },
    onError: (error: any) => {
      console.error('Erreur lors de la mise à jour des paramètres:', error)
      toast.error('Erreur lors de la mise à jour des paramètres')
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (profile: UpdateUserSettingsDto['profile']) => 
      userSettingsApi.updateProfile(profile!),
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
    mutationFn: (company: UpdateUserSettingsDto['company']) => 
      userSettingsApi.updateCompany(company!),
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
    mutationFn: (preferences: UpdateUserSettingsDto['preferences']) => 
      userSettingsApi.updatePreferences(preferences!),
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
    mutationFn: (notifications: UpdateUserSettingsDto['preferences']) => 
      userSettingsApi.updateNotifications(notifications!.notifications!),
    onSuccess: (updatedSettings: UserSettings) => {
      queryClient.setQueryData(QUERY_KEYS.userSettings, updatedSettings)
      toast.success('Paramètres de notification mis à jour')
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour des notifications')
    },
  })
}