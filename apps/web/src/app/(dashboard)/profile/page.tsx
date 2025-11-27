'use client'

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  PageContainer,
  PageHeader,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useFormFieldIds,
} from '@erp/ui'
import {
  Building2,
  Camera,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  Shield,
  User,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ImageUploadWrapper as ImageUpload } from '../../../components/wrappers'
import { useAuth } from '../../../hooks/use-auth'
import { useTranslation } from '../../../lib/i18n'
import { callClientApi } from '../../../utils/backend-api'

interface ExtendedUser {
  id?: string
  email?: string
  prenom?: string
  nom?: string
  role?: string
  permissions?: string[]
  acronyme?: string
  telephone?: string
  poste?: string
  departement?: string
  adresse?: string
  ville?: string
  codePostal?: string
  pays?: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const { t } = useTranslation('profile')
  const { t: tc } = useTranslation('common')
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)

  // Fonction pour générer automatiquement l'acronyme
  const generateAcronym = (prenom: string, nom: string) => {
    const prenomInitial = prenom?.charAt(0).toUpperCase()
    const nomInitials = nom
      .split(' ')
      .map((part) => part?.charAt(0).toUpperCase())
      .join('')
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

  // Generate unique IDs for all form fields
  const fieldIds = useFormFieldIds([
    'acronym',
    'firstName',
    'lastName',
    'email',
    'phone',
    'position',
    'department',
    'address',
    'city',
    'postalCode',
    'country',
    'role',
    'currentPassword',
    'newPassword',
    'confirmPassword',
  ])

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Synchroniser les données quand l'utilisateur change
  useEffect(() => {
    if (user) {
      const extendedUser = user as ExtendedUser
      setProfileData({
        acronyme: extendedUser.acronyme || '',
        prenom: extendedUser.prenom || '',
        nom: extendedUser.nom || '',
        email: extendedUser.email || '',
        telephone: extendedUser.telephone || '',
        poste: extendedUser.poste || '',
        departement: extendedUser.departement || '',
        adresse: extendedUser.adresse || '',
        ville: extendedUser.ville || '',
        codePostal: extendedUser.codePostal || '',
        pays: extendedUser.pays || 'France',
        role: extendedUser.role || '',
        permissions: extendedUser.permissions || [],
      })
    }
  }, [user])

  const tabs = [
    { id: 'profile', label: t('title'), icon: User },
    { id: 'security', label: t('security'), icon: Shield },
  ] as const

  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      // En développement, mettre à jour directement les données mock
      if (process?.env?.NODE_ENV === 'development') {
        // Simulation d'un appel API
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mettre à jour les données dans le localStorage
        const authData = localStorage?.getItem('topsteel-auth')
        if (authData) {
          const userData = JSON.parse(authData)
          if (userData) {
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
          }
          if (userData) {
            userData.email = profileData.email
            userData.nom = profileData.nom
            userData.prenom = profileData.prenom
          }
          localStorage.setItem('topsteel-auth', JSON.stringify(userData))

          // Déclencher un événement pour que les autres composants se mettent à jour
          window.dispatchEvent(new Event('user-profile-updated'))
        }
      } else {
        // En production, appel API réel
        const response = await callClientApi('user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profileData),
        })

        if (!response?.ok) {
          throw new Error('Erreur lors de la sauvegarde')
        }
      }

      toast?.success(t('success.updated'))
    } catch (_error) {
      toast?.error(t('errors.general'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast?.error(t('errors.passwords.mismatch'))
      return
    }

    setIsLoading(true)
    try {
      // Simulation d'un appel API
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast?.success(t('success.passwordChanged'))
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (_error) {
      toast?.error(t('errors.passwords.updateFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async () => {
    if (window.confirm(t('errors.reset.confirmText'))) {
      if (user) {
        const extendedUser = user as ExtendedUser
        setProfileData({
          acronyme: extendedUser.acronyme || '',
          prenom: extendedUser.prenom || '',
          nom: extendedUser.nom || '',
          email: extendedUser.email || '',
          telephone: extendedUser.telephone || '',
          poste: extendedUser.poste || '',
          departement: extendedUser.departement || '',
          adresse: extendedUser.adresse || '',
          ville: extendedUser.ville || '',
          codePostal: extendedUser.codePostal || '',
          pays: extendedUser.pays || 'France',
          role: extendedUser.role || '',
          permissions: extendedUser.permissions || [],
        })
        toast?.success(t('errors.reset.success'))
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
                  entityId={user?.id ?? ''}
                  variant="avatar"
                  onUploadSuccess={(_result) => {
                    toast?.success(t('success.photoUpdated'))
                    // Vous pouvez ici mettre à jour l'état local ou recharger les données utilisateur
                  }}
                  onUploadError={(error) => {
                    toast?.error(error)
                  }}
                />
                <p className="text-sm text-muted-foreground mt-2">{t('photoFormat')}</p>
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
                    <label
                      htmlFor="acronym-input"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      <User className="h-4 w-4 inline mr-1" />
                      {t('acronym')}
                    </label>
                    <div className="flex space-x-2">
                      <Input
                        id={fieldIds.acronym}
                        value={profileData.acronyme}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setProfileData((prev) => ({
                            ...prev,
                            acronyme: e?.target?.value?.toUpperCase() || '',
                          }))
                        }
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
                          setProfileData((prev) => ({ ...prev, acronyme: generated }))
                        }}
                        disabled={!profileData.prenom || !profileData.nom}
                        className="whitespace-nowrap"
                      >
                        Auto
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t('acronymDesc')}</p>
                  </div>

                  <div>
                    <label
                      htmlFor="firstName-input"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      {t('firstName')}
                    </label>
                    <Input
                      id={fieldIds.firstName}
                      value={profileData.prenom}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProfileData((prev) => ({ ...prev, prenom: e?.target?.value || '' }))
                      }
                      placeholder={t('firstName')}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lastName-input"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      {t('lastName')}
                    </label>
                    <Input
                      id={fieldIds.lastName}
                      value={profileData.nom}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProfileData((prev) => ({ ...prev, nom: e?.target?.value || '' }))
                      }
                      placeholder={t('lastName')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="email-input"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      <Mail className="h-4 w-4 inline mr-1" />
                      {t('email')}
                    </label>
                    <Input
                      id={fieldIds.email}
                      type="email"
                      value={profileData.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProfileData((prev) => ({ ...prev, email: e?.target?.value || '' }))
                      }
                      placeholder={t('email')}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone-input"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      <Phone className="h-4 w-4 inline mr-1" />
                      {t('phone')}
                    </label>
                    <Input
                      id={fieldIds.phone}
                      type="tel"
                      value={profileData.telephone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProfileData((prev) => ({ ...prev, telephone: e?.target?.value || '' }))
                      }
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="position-input"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      <Building2 className="h-4 w-4 inline mr-1" />
                      {t('position')}
                    </label>
                    <Input
                      id={fieldIds.position}
                      value={profileData.poste}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProfileData((prev) => ({ ...prev, poste: e?.target?.value || '' }))
                      }
                      placeholder="Directeur technique"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="department-input"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      {t('department')}
                    </label>
                    <Input
                      id={fieldIds.department}
                      value={profileData.departement}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProfileData((prev) => ({ ...prev, departement: e?.target?.value || '' }))
                      }
                      placeholder="Production"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="address-input"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    <MapPin className="h-4 w-4 inline mr-1" />
                    {t('address')}
                  </label>
                  <Input
                    id={fieldIds.address}
                    value={profileData.adresse}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setProfileData((prev) => ({ ...prev, adresse: e?.target?.value || '' }))
                    }
                    placeholder="123 Rue de l'Industrie"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="city-input"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      {t('city')}
                    </label>
                    <Input
                      id={fieldIds.city}
                      value={profileData.ville}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProfileData((prev) => ({ ...prev, ville: e?.target?.value || '' }))
                      }
                      placeholder="Lyon"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="postalCode"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      {t('postalCode')}
                    </label>
                    <Input
                      id={fieldIds.postalCode}
                      value={profileData.codePostal}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProfileData((prev) => ({ ...prev, codePostal: e?.target?.value || '' }))
                      }
                      placeholder="69000"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="country"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      {t('country')}
                    </label>
                    <Input
                      id={fieldIds.country}
                      value={profileData.pays}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProfileData((prev) => ({ ...prev, pays: e?.target?.value || '' }))
                      }
                      placeholder="France"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="role"
                        className="block text-sm font-medium text-foreground mb-2"
                      >
                        {t('role')}
                      </label>
                      <Input
                        id={fieldIds.role}
                        value={profileData.role}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-sm text-muted-foreground mt-1">{t('roleChangeContact')}</p>
                    </div>

                    <div>
                      <div className="block text-sm font-medium text-foreground mb-2">
                        {t('permissions')}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profileData?.permissions?.map((permission) => (
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
                    <div className="block text-sm font-medium text-foreground mb-2">
                      {t('lastLogin')}
                    </div>
                    <div className="text-sm text-foreground">
                      {new Date().toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="block text-sm font-medium text-foreground mb-2">
                      {t('status')}
                    </div>
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
                  <label
                    htmlFor="currentPassword"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    {t('currentPassword')}
                  </label>
                  <div className="relative">
                    <Input
                      id={fieldIds.currentPassword}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={passwordData.currentPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          currentPassword: e?.target?.value || '',
                        }))
                      }
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
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    {t('newPassword')}
                  </label>
                  <Input
                    id={fieldIds.newPassword}
                    type="password"
                    placeholder="••••••••"
                    value={passwordData.newPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPasswordData((prev) => ({ ...prev, newPassword: e?.target?.value || '' }))
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirmNewPassword"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    {t('confirmNewPassword')}
                  </label>
                  <Input
                    id={fieldIds.confirmPassword}
                    type="password"
                    placeholder="••••••••"
                    value={passwordData.confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        confirmPassword: e?.target?.value || '',
                      }))
                    }
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={
                      isLoading ||
                      !passwordData.currentPassword ||
                      !passwordData.newPassword ||
                      !passwordData.confirmPassword
                    }
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
                    <p className="text-sm text-muted-foreground">{t('twoFactorDescription')}</p>
                  </div>
                  <Button type="button" variant="outline" disabled>
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
                        {navigator?.userAgent?.includes('Chrome') ? 'Chrome' : t('browser')} •{' '}
                        {new Date().toLocaleString()}
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
    <PageContainer maxWidth="xl" padding="none">
      <PageHeader
        title={t('title')}
        description={t('subtitle')}
        icon={User}
        iconBackground="bg-gradient-to-br from-blue-600 to-cyan-600"
        actions={
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">{tc('reset') || 'Réinitialiser'}</span>
            </Button>
            <Button type="button" size="sm" onClick={handleSaveProfile} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="ml-2">{t('saveProfile')}</span>
            </Button>
          </div>
        }
      />

      {/* Tabs navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          {tabs?.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {renderTabContent()}
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {renderTabContent()}
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
