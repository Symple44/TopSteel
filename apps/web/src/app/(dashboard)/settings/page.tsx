'use client'

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic'

import { Card, CardContent, CardHeader, CardTitle } from '@erp/ui'
import { Badge, Button, Input } from '@erp/ui'
import {
  Bell,
  Building2,
  Camera,
  Eye,
  EyeOff,
  Globe,
  Mail,
  MapPin,
  Palette,
  Phone,
  Save,
  Settings,
  Shield,
  User,
  Loader2,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { 
  useUserSettings, 
  useUpdateProfile, 
  useUpdateCompany, 
  useUpdatePreferences,
  useUpdateNotifications 
} from '@/hooks/use-user-settings'
import { useLanguage, useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('notifications')
  const { theme, setTheme } = useTheme()
  const { current: language, change: setLanguage } = useLanguage()
  const { t } = useTranslation('settings')

  // Récupération des données utilisateur depuis l'API
  const { data: userSettings, isLoading, error } = useUserSettings()
  
  // Mutations pour les mises à jour
  const updateProfile = useUpdateProfile()
  const updateCompany = useUpdateCompany()
  const updatePreferences = useUpdatePreferences()
  const updateNotifications = useUpdateNotifications()

  // États locaux pour les formulaires
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
  })

  const [companyData, setCompanyData] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  })

  const [preferencesData, setPreferencesData] = useState({
    language: 'auto',
    timezone: 'Europe/Paris',
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
  })

  // Synchroniser les données quand elles arrivent de l'API
  useEffect(() => {
    if (userSettings) {
      if (userSettings.profile) {
        setProfileData({
          firstName: userSettings.profile.firstName || '',
          lastName: userSettings.profile.lastName || '',
          email: userSettings.profile.email || '',
          phone: userSettings.profile.phone || '',
          position: userSettings.profile.position || '',
          department: userSettings.profile.department || '',
        })
      }

      if (userSettings.company) {
        setCompanyData({
          name: userSettings.company.name || '',
          address: userSettings.company.address || '',
          city: userSettings.company.city || '',
          postalCode: userSettings.company.postalCode || '',
          country: userSettings.company.country || '',
        })
      }

      if (userSettings.preferences) {
        const savedLanguage = userSettings.preferences.language || 'auto'
        setPreferencesData({
          language: savedLanguage,
          timezone: userSettings.preferences.timezone || 'Europe/Paris',
          notifications: {
            email: userSettings.preferences.notifications?.email ?? true,
            push: userSettings.preferences.notifications?.push ?? true,
            sms: userSettings.preferences.notifications?.sms ?? false,
          },
        })
        
        // Synchroniser la langue avec le système i18n si elle est différente
        if (savedLanguage && savedLanguage !== language.code && savedLanguage !== 'auto') {
          setLanguage(savedLanguage)
        }
      }
    }
  }, [userSettings]) // Retirer language et setLanguage pour éviter les boucles

  // Initialiser la langue si elle n'est pas définie
  useEffect(() => {
    if (!preferencesData.language && language.code) {
      setPreferencesData(prev => ({ ...prev, language: language.code }))
    }
  }, [preferencesData.language, language.code])

  const tabs = [
    { id: 'notifications', label: t('notifications'), icon: Bell },
    { id: 'preferences', label: t('interface'), icon: Settings },
  ]

  const handleSaveProfile = () => {
    updateProfile.mutate(profileData)
  }

  const handleSaveCompany = () => {
    updateCompany.mutate(companyData)
  }

  const handleSavePreferences = () => {
    // Le thème est géré par next-themes, pas besoin de le sauvegarder
    const { notifications, ...prefsToSave } = preferencesData
    
    // Synchroniser la langue avec le système i18n
    if (prefsToSave.language !== language.code) {
      setLanguage(prefsToSave.language)
    }
    
    // Sauvegarder les préférences via l'API
    updatePreferences.mutate(prefsToSave, {
      onSuccess: () => {
        toast.success(t('success.saved', 'Préférences enregistrées avec succès'))
      },
      onError: () => {
        toast.error(t('settingsLoadError', 'Erreur lors de l\'enregistrement des préférences'))
      }
    })
  }

  const handleSaveNotifications = () => {
    updateNotifications.mutate({ notifications: preferencesData.notifications }, {
      onSuccess: () => {
        toast.success(t('success.saved', 'Notifications enregistrées avec succès'))
      },
      onError: () => {
        toast.error(t('settingsLoadError', 'Erreur lors de l\'enregistrement des notifications'))
      }
    })
  }

  const handleLanguageChange = (newLanguage: string) => {
    // Mettre à jour l'état local
    setPreferencesData(prev => ({ ...prev, language: newLanguage }))
    // Changer immédiatement la langue dans l'interface
    setLanguage(newLanguage)
    
    // Sauvegarder automatiquement les préférences de langue
    const updatedPrefs = {
      language: newLanguage,
      timezone: preferencesData.timezone,
    }
    
    updatePreferences.mutate(updatedPrefs, {
      onSuccess: () => {
        toast.success(t('languageUpdated', 'Langue mise à jour'))
      },
      onError: () => {
        toast.error(t('languageUpdateError', 'Erreur lors de la mise à jour de la langue'))
      }
    })
  }

  // Gestion des erreurs
  if (error) {
    toast.error(t('settingsLoadError'))
  }

  // Affichage du loader pendant le chargement initial
  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">{t('loadingSettings')}</span>
        </div>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'notifications':
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t('notificationPreferences')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{t('emailNotifications')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('emailNotificationsDesc')}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferencesData.notifications.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPreferencesData(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, email: e.target.checked }
                  }))}
                  className="h-4 w-4 text-primary rounded border-input"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{t('pushNotifications')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('pushNotificationsDesc')}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferencesData.notifications.push}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPreferencesData(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, push: e.target.checked }
                  }))}
                  className="h-4 w-4 text-primary rounded border-input"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{t('smsNotifications')}</h4>
                  <p className="text-sm text-muted-foreground">{t('smsNotificationsDesc')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferencesData.notifications.sms}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPreferencesData(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, sms: e.target.checked }
                  }))}
                  className="h-4 w-4 text-primary rounded border-input"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSaveNotifications}
                  disabled={updateNotifications.isPending}
                  className="flex items-center"
                >
                  {updateNotifications.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t('saveNotifications')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case 'preferences':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  {t('regionalPreferences')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('language')}</label>
                  <select
                    value={preferencesData.language}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleLanguageChange(e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                  >
                    <option value="auto">{t('languageAuto')}</option>
                    <option value="fr">{t('languages.fr')}</option>
                    <option value="en">{t('languages.en')}</option>
                    <option value="es">{t('languages.es')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('timezone')}
                  </label>
                  <select
                    value={preferencesData.timezone}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPreferencesData(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                  >
                    <option value="Europe/Paris">{t('timezones.Europe/Paris')}</option>
                    <option value="Europe/London">{t('timezones.Europe/London')}</option>
                    <option value="America/New_York">{t('timezones.America/New_York')}</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  {t('appearance')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('theme')}</label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`px-4 py-2 rounded-md border transition-colors ${
                        theme === 'light'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-input hover:border-ring'
                      }`}
                    >
                      {t('light', 'Clair')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`px-4 py-2 rounded-md border transition-colors ${
                        theme === 'dark'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-input hover:border-ring'
                      }`}
                    >
                      {t('dark', 'Sombre')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('vibrant')}
                      className={`px-4 py-2 rounded-md border transition-colors ${
                        theme === 'vibrant'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-input hover:border-ring'
                      }`}
                    >
                      {t('vibrant', '🎨 Coloré')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('system')}
                      className={`px-4 py-2 rounded-md border transition-colors ${
                        theme === 'system'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-input hover:border-ring'
                      }`}
                    >
                      {t('system', 'Auto')}
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('currentTheme')} : {theme === 'light' ? t('light', 'Clair') : theme === 'dark' ? t('dark', 'Sombre') : theme === 'vibrant' ? t('vibrant', 'Coloré') : t('system', 'Auto')}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    {t('themeAutoSave')}
                  </p>
                  <Button 
                    onClick={handleSavePreferences}
                    disabled={updatePreferences.isPending}
                    className="flex items-center"
                  >
                    {updatePreferences.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {t('savePreferences')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">{renderTabContent()}</div>
    </div>
  )
}