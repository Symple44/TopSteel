'use client'

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
import { 
  useUserSettings, 
  useUpdateProfile, 
  useUpdateCompany, 
  useUpdatePreferences,
  useUpdateNotifications 
} from '@/hooks/use-user-settings'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

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
    language: 'fr',
    timezone: 'Europe/Paris',
    theme: 'light' as 'light' | 'dark' | 'auto',
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
        setPreferencesData({
          language: userSettings.preferences.language || 'fr',
          timezone: userSettings.preferences.timezone || 'Europe/Paris',
          theme: userSettings.preferences.theme || 'light',
          notifications: {
            email: userSettings.preferences.notifications?.email ?? true,
            push: userSettings.preferences.notifications?.push ?? true,
            sms: userSettings.preferences.notifications?.sms ?? false,
          },
        })
      }
    }
  }, [userSettings])

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Préférences', icon: Settings },
  ]

  const handleSaveProfile = () => {
    updateProfile.mutate(profileData)
  }

  const handleSaveCompany = () => {
    updateCompany.mutate(companyData)
  }

  const handleSavePreferences = () => {
    updatePreferences.mutate(preferencesData)
  }

  const handleSaveNotifications = () => {
    updateNotifications.mutate({ notifications: preferencesData.notifications })
  }

  // Gestion des erreurs
  if (error) {
    toast.error('Erreur lors du chargement des paramètres')
  }

  // Affichage du loader pendant le chargement initial
  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Chargement des paramètres...</span>
        </div>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            {/* Photo de profil */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  Photo de profil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {profileData.firstName[0] || 'U'}
                    {profileData.lastName[0] || 'U'}
                  </div>
                  <div>
                    <Button variant="outline" size="sm">
                      <Camera className="h-4 w-4 mr-2" />
                      Changer la photo
                    </Button>
                    <p className="text-sm text-gray-500 mt-1">
                      JPG, PNG ou GIF. Taille maximale : 2MB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations personnelles */}
            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                    <Input
                      value={profileData.firstName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                    <Input
                      value={profileData.lastName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email
                  </label>
                  <Input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Téléphone
                  </label>
                  <Input
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Poste</label>
                    <Input
                      value={profileData.position}
                      onChange={(e) => setProfileData(prev => ({ ...prev, position: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Département
                    </label>
                    <Input
                      value={profileData.department}
                      onChange={(e) => setProfileData(prev => ({ ...prev, department: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={updateProfile.isPending}
                    className="flex items-center"
                  >
                    {updateProfile.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Enregistrer le profil
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Informations entreprise */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Entreprise
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'entreprise
                  </label>
                  <Input
                    value={companyData.name}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Adresse
                  </label>
                  <Input
                    value={companyData.address}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                    <Input
                      value={companyData.city}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code postal
                    </label>
                    <Input
                      value={companyData.postalCode}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, postalCode: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pays</label>
                    <Input
                      value={companyData.country}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, country: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSaveCompany}
                    disabled={updateCompany.isPending}
                    className="flex items-center"
                  >
                    {updateCompany.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Enregistrer l'entreprise
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Changer le mot de passe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe actuel
                  </label>
                  <div className="relative">
                    <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau mot de passe
                  </label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le nouveau mot de passe
                  </label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <Button variant="default">Mettre à jour le mot de passe</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Authentification à deux facteurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">2FA désactivée</p>
                    <p className="text-sm text-gray-500">
                      Ajoutez une couche de sécurité supplémentaire à votre compte
                    </p>
                  </div>
                  <Button variant="outline">Activer 2FA</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'notifications':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Préférences de notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Notifications par email</h4>
                  <p className="text-sm text-gray-500">
                    Recevoir les notifications importantes par email
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferencesData.notifications.email}
                  onChange={(e) => setPreferencesData(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, email: e.target.checked }
                  }))}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Notifications push</h4>
                  <p className="text-sm text-gray-500">
                    Recevoir les notifications push dans le navigateur
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferencesData.notifications.push}
                  onChange={(e) => setPreferencesData(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, push: e.target.checked }
                  }))}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Notifications SMS</h4>
                  <p className="text-sm text-gray-500">Recevoir les alertes urgentes par SMS</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferencesData.notifications.sms}
                  onChange={(e) => setPreferencesData(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, sms: e.target.checked }
                  }))}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
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
                  Enregistrer les notifications
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
                  Préférences régionales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Langue</label>
                  <select
                    value={preferencesData.language}
                    onChange={(e) => setPreferencesData(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuseau horaire
                  </label>
                  <select
                    value={preferencesData.timezone}
                    onChange={(e) => setPreferencesData(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Europe/Paris">Paris (GMT+1)</option>
                    <option value="Europe/London">Londres (GMT+0)</option>
                    <option value="America/New_York">New York (GMT-5)</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Apparence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thème</label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setPreferencesData(prev => ({ ...prev, theme: 'light' }))}
                      className={`px-4 py-2 rounded-md border ${
                        preferencesData.theme === 'light'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300'
                      }`}
                    >
                      Clair
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferencesData(prev => ({ ...prev, theme: 'dark' }))}
                      className={`px-4 py-2 rounded-md border ${
                        preferencesData.theme === 'dark'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300'
                      }`}
                    >
                      Sombre
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferencesData(prev => ({ ...prev, theme: 'auto' }))}
                      className={`px-4 py-2 rounded-md border ${
                        preferencesData.theme === 'auto'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300'
                      }`}
                    >
                      Auto
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
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
                    Enregistrer les préférences
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
          <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-600 mt-1">Gérez vos préférences et paramètres de compte</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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