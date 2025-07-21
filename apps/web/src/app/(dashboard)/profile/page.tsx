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
  RotateCcw,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useTranslation } from '@/lib/i18n'
import { toast } from 'sonner'
import ImageUpload from '@/components/ui/image-upload'

export default function ProfilePage() {
  const { user } = useAuth()
  const { t } = useTranslation('profile')
  const { t: tc } = useTranslation('common')
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)

  // Fonction pour générer automatiquement l'acronyme
  const generateAcronym = (prenom: string, nom: string) => {
    const prenomInitial = prenom.charAt(0).toUpperCase()
    const nomInitials = nom.split(' ').map(part => part.charAt(0).toUpperCase()).join('')
    return `${prenomInitial}${nomInitials}`.substring(0, 5)
  }

  // États locaux pour les formulaires
  const [profileData, setProfileData] = useState({
    acronyme: '',
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    poste: '',
    departement: '',
    adresse: '',
    ville: '',
    codePostal: '',
    pays: '',
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
        acronyme: user.profile?.acronyme || '',
        prenom: user.profile?.prenom || '',
        nom: user.profile?.nom || '',
        email: user.email || '',
        telephone: user.profile?.telephone || '',
        poste: user.profile?.poste || '',
        departement: user.profile?.departement || '',
        adresse: user.profile?.adresse || '',
        ville: user.profile?.ville || '',
        codePostal: user.profile?.codePostal || '',
        pays: user.profile?.pays || 'France',
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
      // En développement, mettre à jour directement les données mock
      if (process.env.NODE_ENV === 'development') {
        // Simulation d'un appel API
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Mettre à jour les données dans le localStorage
        const authData = localStorage.getItem('topsteel-auth')
        if (authData) {
          const userData = JSON.parse(authData)
          userData.profile = {
            ...userData.profile,
            acronyme: profileData.acronyme,
            prenom: profileData.prenom,
            nom: profileData.nom,
            telephone: profileData.telephone,
            poste: profileData.poste,
            departement: profileData.departement,
            adresse: profileData.adresse,
            ville: profileData.ville,
            codePostal: profileData.codePostal,
            pays: profileData.pays,
          }
          userData.email = profileData.email
          userData.nom = profileData.nom
          userData.prenom = profileData.prenom
          localStorage.setItem('topsteel-auth', JSON.stringify(userData))
          
          // Déclencher un événement pour que les autres composants se mettent à jour
          window.dispatchEvent(new Event('user-profile-updated'))
        }
      } else {
        // En production, appel API réel
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profileData),
        })
        
        if (!response.ok) {
          throw new Error('Erreur lors de la sauvegarde')
        }
      }
      
      toast.success(t('success.updated'))
    } catch (error) {
      toast.error(t('errors.general'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t('errors.passwords.mismatch'))
      return
    }

    setIsLoading(true)
    try {
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success(t('success.passwordChanged'))
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error) {
      toast.error(t('errors.passwords.updateFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async () => {
    if (window.confirm(t('errors.reset.confirmText'))) {
      if (user) {
        setProfileData({
          acronyme: user.profile?.acronyme || '',
          prenom: user.profile?.prenom || '',
          nom: user.profile?.nom || '',
          email: user.email || '',
          telephone: user.profile?.telephone || '',
          poste: user.profile?.poste || '',
          departement: user.profile?.departement || '',
          adresse: user.profile?.adresse || '',
          ville: user.profile?.ville || '',
          codePostal: user.profile?.codePostal || '',
          pays: user.profile?.pays || 'France',
          role: user.role || '',
          permissions: user.permissions || [],
        })
        toast.success(t('errors.reset.success'))
      }
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
                    toast.success(t('success.photoUpdated'))
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <User className="h-4 w-4 inline mr-1" />
                      {t('acronym')}
                    </label>
                    <div className="flex space-x-2">
                      <Input
                        value={profileData.acronyme}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileData(prev => ({ ...prev, acronyme: e.target.value.toUpperCase() }))}
                        placeholder="JDO"
                        maxLength={5}
                        className="uppercase flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const generated = generateAcronym(profileData.prenom, profileData.nom)
                          setProfileData(prev => ({ ...prev, acronyme: generated }))
                        }}
                        disabled={!profileData.prenom || !profileData.nom}
                        className="whitespace-nowrap"
                      >
                        Auto
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('acronymDesc')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{t('firstName')}</label>
                    <Input
                      value={profileData.prenom}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileData(prev => ({ ...prev, prenom: e.target.value }))}
                      placeholder={t('firstName')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{t('lastName')}</label>
                    <Input
                      value={profileData.nom}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileData(prev => ({ ...prev, nom: e.target.value }))}
                      placeholder={t('lastName')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <Phone className="h-4 w-4 inline mr-1" />
                      {t('phone')}
                    </label>
                    <Input
                      type="tel"
                      value={profileData.telephone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileData(prev => ({ ...prev, telephone: e.target.value }))}
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      <Building2 className="h-4 w-4 inline mr-1" />
                      {t('position')}
                    </label>
                    <Input
                      value={profileData.poste}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileData(prev => ({ ...prev, poste: e.target.value }))}
                      placeholder="Directeur technique"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{t('department')}</label>
                    <Input
                      value={profileData.departement}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileData(prev => ({ ...prev, departement: e.target.value }))}
                      placeholder="Production"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    {t('address')}
                  </label>
                  <Input
                    value={profileData.adresse}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileData(prev => ({ ...prev, adresse: e.target.value }))}
                    placeholder="123 Rue de l'Industrie"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{t('city')}</label>
                    <Input
                      value={profileData.ville}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileData(prev => ({ ...prev, ville: e.target.value }))}
                      placeholder="Lyon"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{t('postalCode')}</label>
                    <Input
                      value={profileData.codePostal}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileData(prev => ({ ...prev, codePostal: e.target.value }))}
                      placeholder="69000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{t('country')}</label>
                    <Input
                      value={profileData.pays}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileData(prev => ({ ...prev, pays: e.target.value }))}
                      placeholder="France"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>
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
                <div className="flex justify-end">
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
                </div>
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {tc('reset') || 'Réinitialiser'}
          </Button>
          <Button onClick={handleSaveProfile} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {t('saveProfile')}
          </Button>
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