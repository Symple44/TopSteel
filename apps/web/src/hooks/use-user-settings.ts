import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client-instance'

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
    queryFn: async () => {
      // En développement, utiliser les données du localStorage
      if (process?.env?.NODE_ENV === 'development') {
        const authData = localStorage?.getItem('topsteel-auth')
        if (authData) {
          const userData = JSON.parse(authData)

          // Récupérer la langue sauvegardée ou utiliser 'fr' par défaut
          const savedLanguage = localStorage?.getItem('topsteel-language') || 'fr'

          return {
            profile: {
              firstName: userData.profile?.prenom || '',
              lastName: userData.profile?.nom || '',
              email: userData.email || '',
              phone: userData.profile?.telephone || '',
              position: userData.profile?.poste || '',
              department: userData.profile?.departement || '',
            },
            company: {
              name: 'TopSteel SARL',
              address: userData.profile?.adresse || '',
              city: userData.profile?.ville || '',
              postalCode: userData.profile?.codePostal || '',
              country: userData.profile?.pays || 'France',
            },
            preferences: {
              language: savedLanguage,
              timezone: 'Europe/Paris',
              notifications: {
                email: true,
                push: true,
                sms: false,
              },
            },
          }
        }
      }
      // En production, utiliser l'API
      return apiClient.get<UserSettings>('/user/settings')
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (profile: Partial<UserSettings['profile']>) =>
      apiClient.patch<UserSettings>('/user/profile', profile),
    onSuccess: (updatedSettings: UserSettings) => {
      queryClient?.setQueryData(QUERY_KEYS?.userSettings, updatedSettings)
      toast?.success('Profil mis à jour avec succès')
    },
    onError: () => {
      toast?.error('Erreur lors de la mise à jour du profil')
    },
  })
}

export function useUpdateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (company: Partial<UserSettings['company']>) =>
      apiClient.patch<UserSettings>('/user/settings', { company }),
    onSuccess: (updatedSettings: UserSettings) => {
      queryClient?.setQueryData(QUERY_KEYS?.userSettings, updatedSettings)
      toast?.success("Informations de l'entreprise mises à jour")
    },
    onError: () => {
      toast?.error("Erreur lors de la mise à jour des informations de l'entreprise")
    },
  })
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (preferences: Partial<UserSettings['preferences']>) => {
      // En développement, sauvegarder dans le localStorage
      if (process?.env?.NODE_ENV === 'development') {
        const authData = localStorage?.getItem('topsteel-auth')
        if (authData) {
          const userData = JSON.parse(authData)
          // Simuler la sauvegarde des préférences
          await new Promise((resolve) => setTimeout(resolve, 500))

          // Synchroniser avec le système i18n si la langue change
          if (preferences.language) {
            localStorage.setItem('topsteel-language', preferences.language)
          }

          // Retourner les données mises à jour
          return {
            profile: {
              firstName: userData.profile?.prenom || '',
              lastName: userData.profile?.nom || '',
              email: userData.email || '',
              phone: userData.profile?.telephone || '',
              position: userData.profile?.poste || '',
              department: userData.profile?.departement || '',
            },
            company: {
              name: 'TopSteel SARL',
              address: userData.profile?.adresse || '',
              city: userData.profile?.ville || '',
              postalCode: userData.profile?.codePostal || '',
              country: userData.profile?.pays || 'France',
            },
            preferences: {
              language: preferences.language || 'fr',
              timezone: preferences.timezone || 'Europe/Paris',
              notifications: preferences.notifications || {
                email: true,
                push: true,
                sms: false,
              },
            },
          }
        }
      }
      // En production, utiliser l'API
      return apiClient.patch<UserSettings>('/user/preferences', preferences)
    },
    onSuccess: (updatedSettings: UserSettings) => {
      queryClient?.setQueryData(QUERY_KEYS?.userSettings, updatedSettings)

      // Synchroniser avec le système i18n
      if (updatedSettings?.preferences?.language) {
        localStorage.setItem('topsteel-language', updatedSettings?.preferences?.language)
      }

      toast?.success('Préférences mises à jour avec succès')
    },
    onError: () => {
      toast?.error('Erreur lors de la mise à jour des préférences')
    },
  })
}

export function useUpdateNotifications() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notifications: UserSettings['preferences']['notifications']) => {
      // En développement, sauvegarder dans le localStorage
      if (process?.env?.NODE_ENV === 'development') {
        const authData = localStorage?.getItem('topsteel-auth')
        if (authData) {
          const userData = JSON.parse(authData)
          // Simuler la sauvegarde des notifications
          await new Promise((resolve) => setTimeout(resolve, 500))

          // Récupérer la langue sauvegardée
          const savedLanguage = localStorage?.getItem('topsteel-language') || 'fr'

          // Retourner les données mises à jour
          return {
            profile: {
              firstName: userData.profile?.prenom || '',
              lastName: userData.profile?.nom || '',
              email: userData.email || '',
              phone: userData.profile?.telephone || '',
              position: userData.profile?.poste || '',
              department: userData.profile?.departement || '',
            },
            company: {
              name: 'TopSteel SARL',
              address: userData.profile?.adresse || '',
              city: userData.profile?.ville || '',
              postalCode: userData.profile?.codePostal || '',
              country: userData.profile?.pays || 'France',
            },
            preferences: {
              language: savedLanguage,
              timezone: 'Europe/Paris',
              notifications: notifications,
            },
          }
        }
      }
      // En production, utiliser l'API
      return apiClient.patch<UserSettings>('/user/preferences', { notifications })
    },
    onSuccess: (updatedSettings: UserSettings) => {
      queryClient?.setQueryData(QUERY_KEYS?.userSettings, updatedSettings)
      toast?.success('Paramètres de notification mis à jour')
    },
    onError: () => {
      toast?.error('Erreur lors de la mise à jour des notifications')
    },
  })
}
