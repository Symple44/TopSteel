'use client'

import { Button, Card, Input, Label, Separator } from '@erp/ui'
import { Building2, Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useId } from 'react'
import CompanySelector from '../../../components/auth/company-selector'
import { useAuth } from '../../../hooks/use-auth'
import { toast } from '../../../hooks/use-toast'
import { useTranslation } from '../../../lib/i18n/hooks'

// Composant login client-only pour éviter l'erreur params Next.js 15
export default function LoginClientPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    login,
    mfa,
    verifyMFA,
    resetMFA,
    requiresCompanySelection,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth()
  const { t } = useTranslation('auth')
  const [formData, setFormData] = React.useState({
    identifier: '', // Peut être email ou acronyme
    password: '',
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [mfaCode, setMfaCode] = React.useState('')
  const [selectedMfaMethod, setSelectedMfaMethod] = React.useState('')
  const [isRedirecting, setIsRedirecting] = React.useState(false)
  const mfaMethodId = useId()
  const mfaCodeId = useId()
  const identifierId = useId()
  const passwordId = useId()

  // Gestion automatique de la redirection basée sur les états
  React?.useEffect(() => {
    // Attendre que l'authentification soit stabilisée
    if (authLoading || isLoading || isRedirecting) {
      return
    }

    // Si l'utilisateur est authentifié et n'a pas besoin de MFA ni de sélection de société
    if (isAuthenticated && !mfa.required && !requiresCompanySelection) {
      const redirectTo = searchParams?.get('redirect') || '/dashboard'
      setIsRedirecting(true)
      // Petite attente pour éviter les races conditions
      setTimeout(() => {
        router?.push(redirectTo)
      }, 100)
    }
  }, [
    isAuthenticated,
    authLoading,
    mfa.required,
    requiresCompanySelection,
    isLoading,
    isRedirecting,
    router,
    searchParams,
  ])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault()

    if (!formData.identifier || !formData.password) {
      toast({
        title: t('loginError'),
        description: t('fillAllFields'),
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      await login(formData.identifier, formData.password, formData.rememberMe)

      toast({
        title: t('loginSuccess'),
        description: t('welcomeToTopSteel'),
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: t('loginError'),
        description: error instanceof Error ? error.message : t('invalidCredentials'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMFASubmit = async (e: React.FormEvent) => {
    e?.preventDefault()

    if (!selectedMfaMethod || (!mfaCode && selectedMfaMethod !== 'webauthn')) {
      toast({
        title: t('error'),
        description: t('selectMethodAndCode'),
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      await verifyMFA(selectedMfaMethod, mfaCode)

      toast({
        title: t('loginSuccess'),
        description: t('welcomeToTopSteel'),
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: t('mfaError'),
        description: error instanceof Error ? error.message : t('invalidMfaCode'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMFACancel = () => {
    resetMFA()
    setMfaCode('')
    setSelectedMfaMethod('')
  }

  const handleCompanySelected = () => {
    toast({
      title: t('loginSuccess'),
      description: t('welcomeToTopSteel'),
      variant: 'success',
    })
  }

  // Afficher un loading pendant la redirection
  if (
    isRedirecting ||
    (isAuthenticated && !authLoading && !mfa.required && !requiresCompanySelection)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mb-4 shadow-lg animate-pulse">
            <Building2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Redirection en cours...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Header avec logo */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <Building2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">TopSteel ERP</h1>
          <p className="text-muted-foreground mt-1">{t('industrialMetallurgyManagement')}</p>
        </div>

        {/* Sélection de société si requise */}
        {requiresCompanySelection && !mfa.required && (
          <CompanySelector showInDialog={false} onCompanySelected={handleCompanySelected} />
        )}

        {/* Formulaire de connexion - masqué si sélection de société requise */}
        {!requiresCompanySelection && (
          <Card className="p-8 shadow-lg">
            <div className="space-y-6">
              {/* Header formulaire */}
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  {mfa.required ? t('mfaTitle') : t('login')}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {mfa.required ? t('mfaSubtitle') : t('accessManagementSpace')}
                </p>
              </div>

              {/* Afficher formulaire MFA ou formulaire login */}
              {mfa.required ? (
                /* Formulaire MFA */
                <form onSubmit={handleMFASubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={mfaMethodId}>{t('authenticationMethod')}</Label>
                    <select
                      id={mfaMethodId}
                      value={selectedMfaMethod}
                      onChange={(e) => setSelectedMfaMethod(e?.target?.value)}
                      className="w-full p-2 border rounded"
                      required
                    >
                      <option value="">{t('selectMethod')}</option>
                      {(mfa.availableMethods || []).map(
                        (method: { type: string; isEnabled: boolean; lastUsed?: Date }) => (
                          <option key={method.type} value={method.type}>
                            {method.type === 'totp'
                              ? t('totpMethod')
                              : method.type === 'webauthn'
                                ? t('webauthnMethod')
                                : method.type === 'sms'
                                  ? t('smsMethod')
                                  : method.type}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {selectedMfaMethod && selectedMfaMethod !== 'webauthn' && (
                    <div className="space-y-2">
                      <Label htmlFor={mfaCodeId}>{t('verificationCode')}</Label>
                      <Input
                        id={mfaCodeId}
                        type="text"
                        value={mfaCode}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setMfaCode(e?.target?.value)
                        }
                        placeholder={t('verificationCodePlaceholder')}
                        maxLength={6}
                        className="text-center text-2xl tracking-widest"
                        required
                      />
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={handleMFACancel}
                      disabled={isLoading}
                    >
                      {t('back')}
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isLoading}>
                      {isLoading ? t('verifying') : t('verify')}
                    </Button>
                  </div>
                </form>
              ) : (
                /* Formulaire Login normal */
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={identifierId}>{t('emailOrAcronym')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id={identifierId}
                        type="text"
                        value={formData.identifier}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleInputChange('identifier', e?.target?.value)
                        }
                        placeholder={t('emailOrAcronymPlaceholder')}
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{t('useEmailOrAcronym')}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={passwordId}>{t('password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id={passwordId}
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleInputChange('password', e?.target?.value)
                        }
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.rememberMe}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleInputChange('rememberMe', e?.target?.checked)
                        }
                        className="rounded border-input"
                      />
                      <span className="text-muted-foreground">{t('rememberMe')}</span>
                    </label>

                    <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                      {t('forgotPassword')}
                    </Link>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? t('loggingIn') : t('loginButton')}
                  </Button>
                </form>
              )}

              {/* Informations de connexion par défaut - seulement si pas MFA */}
              {!mfa.required && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-sm">
                  <div className="flex items-center mb-2">
                    <Shield className="h-4 w-4 text-primary mr-2" />
                    <span className="font-medium text-foreground">{t('demoAccount')}</span>
                  </div>
                  <div className="text-foreground/90 space-y-1">
                    <p>
                      <strong>{t('email')}:</strong> admin@topsteel.fr
                    </p>
                    <p>
                      <strong>{t('password')}:</strong> admin123
                    </p>
                  </div>
                </div>
              )}

              {/* Liens d'inscription et autres - seulement si pas MFA */}
              {!mfa.required && (
                <div className="space-y-4">
                  <Separator />

                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {t('newToTopSteel')}{' '}
                      <Link href="/register" className="text-primary hover:underline font-medium">
                        {t('createAccount')}
                      </Link>
                    </p>

                    <div className="text-xs text-muted-foreground space-x-3">
                      <Link href="/support" className="hover:underline">
                        {t('support')}
                      </Link>
                      <span>•</span>
                      <Link href="/privacy" className="hover:underline">
                        {t('privacy')}
                      </Link>
                      <span>•</span>
                      <Link href="/terms" className="hover:underline">
                        {t('terms')}
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-muted-foreground">
          <p>© 2025 TopSteel SAS. {t('allRightsReserved')}</p>
          <p className="mt-1">{t('specializedERPSystem')}</p>
        </div>
      </div>
    </div>
  )
}
