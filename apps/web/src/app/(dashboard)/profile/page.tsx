'use client'

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic'

import { Card, CardContent, CardHeader, CardTitle } from '@erp/ui'
import { Badge, Button, Input } from '@erp/ui'
import {
  Camera,
  Eye,
  EyeOff,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  User,
  Loader2,
  Building2,
  Calendar,
  Clock,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'
import ImageUpload from '@/components/ui/image-upload'

export default function ProfilePage() {
  const { user } = useAuth()
  const { t } = useTranslation('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)

  // États locaux pour les formulaires
  const [profileData, setProfileData] = useState({
    nom: '',
    email: '',
    role: '',
    permissions: [] as string[],
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Synchroniser les données quand l'utilisateur change
  useEffect(() => {
    if (user) {
      setProfileData({
        nom: user.nom || '',
        email: user.email || '',
        role: user.role || '',
        permissions: user.permissions || [],
      })
    }
  }, [user])

  const tabs = [
    { id: 'profile', label: t('title'), icon: User },
    { id: 'security', label: t('security'), icon: Shield },
  ]

  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success(t('success.updated', 'Profil mis à jour avec succès'))
    } catch (error) {
      toast.error(t('errors.general', 'Erreur lors de la mise à jour du profil'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    setIsLoading(true)
    try {
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success(t('success.updated', 'Mot de passe modifié avec succès'))
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error) {
      toast.error(t('errors.general', 'Erreur lors de la modification du mot de passe'))
    } finally {
      setIsLoading(false)
    }
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
                  {t('photo')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  category="avatar"
                  entityType="user"
                  entityId={user?.id}
                  variant="avatar"
                  onUploadSuccess={(result) => {
                    toast.success(t('success.updated', 'Photo de profil mise à jour'))
                    // Vous pouvez ici mettre à jour l'état local ou recharger les données utilisateur
                  }}
                  onUploadError={(error) => {
                    toast.error(error)
                  }}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  {t('photoFormat')}
                </p>
              </CardContent>
            </Card>

            {/* Informations personnelles */}
            <Card>
              <CardHeader>
                <CardTitle>{t('personalInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('lastName')}</label>
                  <Input
                    value={profileData.nom}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileData(prev => ({ ...prev, nom: e.target.value }))}
                    placeholder={t('lastName')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    {t('email')}
                  </label>
                  <Input
                    type="email"
                    value={profileData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder={t('email')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('role')}</label>
                  <Input
                    value={profileData.role}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('roleChangeContact')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('permissions')}</label>
                  <div className="flex flex-wrap gap-2">
                    {profileData.permissions.map((permission) => (
                      <Badge key={permission} variant="secondary">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="flex items-center"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {t('saveProfile')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Informations de session */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  {t('session')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('lastLogin')}
                    </label>
                    <div className="text-sm text-foreground">
                      {new Date().toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('status')}
                    </label>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {t('connected')}
                    </Badge>
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
                <CardTitle>{t('changePassword')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('currentPassword')}
                  </label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="••••••••"
                      value={passwordData.currentPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('newPassword')}
                  </label>
                  <Input 
                    type="password" 
                    placeholder="••••••••"
                    value={passwordData.newPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('confirmNewPassword')}
                  </label>
                  <Input 
                    type="password" 
                    placeholder="••••••••"
                    value={passwordData.confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                </div>
                <Button 
                  onClick={handleChangePassword}
                  disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="flex items-center"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  {t('updatePassword')}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('twoFactorAuth')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('twoFactorDisabled')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('twoFactorDescription')}
                    </p>
                  </div>
                  <Button variant="outline" disabled>
                    {t('enable2FA')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('activeSessions')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{t('currentSession')}</p>
                      <p className="text-sm text-muted-foreground">
                        {navigator.userAgent.includes('Chrome') ? 'Chrome' : t('browser')} • {new Date().toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {t('currentSession')}
                    </Badge>
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