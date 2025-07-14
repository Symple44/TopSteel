'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@erp/ui/layout'
import { Badge } from '@erp/ui/data-display'
import { Button } from '@erp/ui/primitives'
import { Input } from '@erp/ui/primitives'
import { 
  User, 
  Settings, 
  Shield, 
  Bell, 
  Palette, 
  Globe,
  Save,
  Eye,
  EyeOff,
  Camera,
  Mail,
  Phone,
  MapPin,
  Building2
} from 'lucide-react'
import { useState } from 'react'

// Données par défaut utilisateur
const defaultUserData = {
  profile: {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@topsteel.com',
    phone: '+33 1 23 45 67 89',
    position: 'Responsable Production',
    department: 'Production',
    avatar: null
  },
  company: {
    name: 'TopSteel Métallerie',
    address: '123 Rue de l\'Industrie',
    city: 'Lyon',
    postalCode: '69001',
    country: 'France'
  },
  preferences: {
    language: 'fr',
    timezone: 'Europe/Paris',
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      sms: false
    }
  }
}

export default function SettingsPage() {
  const [userData, setUserData] = useState(defaultUserData)
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Préférences', icon: Settings },
  ]

  const handleSave = () => {
    // Simulation de sauvegarde
    console.log('Sauvegarde des paramètres:', userData)
    // Ici on appellerait l'API pour sauvegarder
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
                    {userData.profile.firstName[0]}{userData.profile.lastName[0]}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom
                    </label>
                    <Input
                      value={userData.profile.firstName}
                      onChange={(e) => setUserData(prev => ({
                        ...prev,
                        profile: { ...prev.profile, firstName: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom
                    </label>
                    <Input
                      value={userData.profile.lastName}
                      onChange={(e) => setUserData(prev => ({
                        ...prev,
                        profile: { ...prev.profile, lastName: e.target.value }
                      }))}
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
                    value={userData.profile.email}
                    onChange={(e) => setUserData(prev => ({
                      ...prev,
                      profile: { ...prev.profile, email: e.target.value }
                    }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Téléphone
                  </label>
                  <Input
                    value={userData.profile.phone}
                    onChange={(e) => setUserData(prev => ({
                      ...prev,
                      profile: { ...prev.profile, phone: e.target.value }
                    }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Poste
                    </label>
                    <Input
                      value={userData.profile.position}
                      onChange={(e) => setUserData(prev => ({
                        ...prev,
                        profile: { ...prev.profile, position: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Département
                    </label>
                    <Input
                      value={userData.profile.department}
                      onChange={(e) => setUserData(prev => ({
                        ...prev,
                        profile: { ...prev.profile, department: e.target.value }
                      }))}
                    />
                  </div>
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
                    value={userData.company.name}
                    onChange={(e) => setUserData(prev => ({
                      ...prev,
                      company: { ...prev.company, name: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Adresse
                  </label>
                  <Input
                    value={userData.company.address}
                    onChange={(e) => setUserData(prev => ({
                      ...prev,
                      company: { ...prev.company, address: e.target.value }
                    }))}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ville
                    </label>
                    <Input
                      value={userData.company.city}
                      onChange={(e) => setUserData(prev => ({
                        ...prev,
                        company: { ...prev.company, city: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code postal
                    </label>
                    <Input
                      value={userData.company.postalCode}
                      onChange={(e) => setUserData(prev => ({
                        ...prev,
                        company: { ...prev.company, postalCode: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pays
                    </label>
                    <Input
                      value={userData.company.country}
                      onChange={(e) => setUserData(prev => ({
                        ...prev,
                        company: { ...prev.company, country: e.target.value }
                      }))}
                    />
                  </div>
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
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                    />
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
                  <Input
                    type="password"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le nouveau mot de passe
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                  />
                </div>
                <Button variant="default">
                  Mettre à jour le mot de passe
                </Button>
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
                  <Button variant="outline">
                    Activer 2FA
                  </Button>
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
                  checked={userData.preferences.notifications.email}
                  onChange={(e) => setUserData(prev => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      notifications: {
                        ...prev.preferences.notifications,
                        email: e.target.checked
                      }
                    }
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
                  checked={userData.preferences.notifications.push}
                  onChange={(e) => setUserData(prev => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      notifications: {
                        ...prev.preferences.notifications,
                        push: e.target.checked
                      }
                    }
                  }))}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Notifications SMS</h4>
                  <p className="text-sm text-gray-500">
                    Recevoir les alertes urgentes par SMS
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={userData.preferences.notifications.sms}
                  onChange={(e) => setUserData(prev => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      notifications: {
                        ...prev.preferences.notifications,
                        sms: e.target.checked
                      }
                    }
                  }))}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Langue
                  </label>
                  <select
                    value={userData.preferences.language}
                    onChange={(e) => setUserData(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, language: e.target.value }
                    }))}
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
                    value={userData.preferences.timezone}
                    onChange={(e) => setUserData(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, timezone: e.target.value }
                    }))}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thème
                  </label>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setUserData(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, theme: 'light' }
                      }))}
                      className={`px-4 py-2 rounded-md border ${
                        userData.preferences.theme === 'light'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300'
                      }`}
                    >
                      Clair
                    </button>
                    <button
                      onClick={() => setUserData(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, theme: 'dark' }
                      }))}
                      className={`px-4 py-2 rounded-md border ${
                        userData.preferences.theme === 'dark'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300'
                      }`}
                    >
                      Sombre
                    </button>
                    <button
                      onClick={() => setUserData(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, theme: 'auto' }
                      }))}
                      className={`px-4 py-2 rounded-md border ${
                        userData.preferences.theme === 'auto'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300'
                      }`}
                    >
                      Auto
                    </button>
                  </div>
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
          <p className="text-gray-600 mt-1">
            Gérez vos préférences et paramètres de compte
          </p>
        </div>
        <Button onClick={handleSave} variant="default">
          <Save className="h-4 w-4 mr-2" />
          Sauvegarder
        </Button>
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
      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  )
}