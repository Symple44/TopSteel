'use client'

import { Button, Card, Input, Label, Separator, useFormFieldIds, useUniqueId } from '@erp/ui'
import { ArrowLeft, Building2, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from '@/hooks/use-toast'
import { useTranslation } from '@/lib/i18n/hooks'

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic'

export default function RegisterPage() {
  const router = useRouter()
  const { t } = useTranslation('auth')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Generate unique IDs for form fields
  const fieldIds = useFormFieldIds([
    'firstName',
    'lastName',
    'email',
    'company',
    'password',
    'confirmPassword',
  ])
  const acceptTermsId = useUniqueId('accept-terms')
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e?.target.type === 'checkbox' ? e?.target?.checked : e?.target?.value
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast({
        title: t('error'),
        description: t('fillRequiredFields'),
        variant: 'destructive',
      })
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t('error'),
        description: t('passwordsDoNotMatch'),
        variant: 'destructive',
      })
      return false
    }

    if (formData?.password?.length < 8) {
      toast({
        title: t('error'),
        description: t('passwordMinLength'),
        variant: 'destructive',
      })
      return false
    }

    if (!formData.acceptTerms) {
      toast({
        title: t('error'),
        description: t('acceptTermsError'),
        variant: 'destructive',
      })
      return false
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex?.test(formData.email)) {
      toast({
        title: t('error'),
        description: t('enterValidEmail'),
        variant: 'destructive',
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Simulate account creation
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: t('accountCreatedSuccess'),
        description: t('canNowLogin'),
        variant: 'success',
      })

      router?.push('/login')
    } catch (_error) {
      toast({
        title: t('error'),
        description: t('accountCreationError'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        {/* Header avec logo */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TopSteel ERP</h1>
          <p className="text-gray-600 mt-1">{t('createYourAccount')}</p>
        </div>

        <Card className="p-8 shadow-lg">
          <div className="space-y-6">
            {/* Header formulaire */}
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">{t('registration')}</h2>
              <p className="text-gray-600 text-sm">{t('startFreeTrial')}</p>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={fieldIds.firstName}>{t('firstNameRequired')}</Label>
                  <Input
                    id={fieldIds.firstName}
                    value={formData.firstName}
                    onChange={handleInputChange('firstName')}
                    placeholder={t('firstNamePlaceholder')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={fieldIds.lastName}>{t('lastNameRequired')}</Label>
                  <Input
                    id={fieldIds.lastName}
                    value={formData.lastName}
                    onChange={handleInputChange('lastName')}
                    placeholder={t('lastNamePlaceholder')}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={fieldIds.email}>{t('emailRequired')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id={fieldIds.email}
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    placeholder={t('emailPlaceholder')}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={fieldIds.company}>{t('companyOptional')}</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id={fieldIds.company}
                    value={formData.company}
                    onChange={handleInputChange('company')}
                    placeholder={t('companyPlaceholder')}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={fieldIds.password}>{t('passwordRequired')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id={fieldIds.password}
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">{t('passwordRequirements')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={fieldIds.confirmPassword}>{t('confirmPasswordRequired')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id={fieldIds.confirmPassword}
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange('confirmPassword')}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label htmlFor={acceptTermsId} className="flex items-start space-x-3 text-sm">
                  <input
                    id={acceptTermsId}
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange('acceptTerms')}
                    className="mt-0.5 rounded border-gray-300"
                    required
                  />
                  <span className="text-gray-600">
                    {t('acceptTermsText')}{' '}
                    <Link href="/terms" className="text-blue-600 hover:underline">
                      {t('termsOfService')}
                    </Link>{' '}
                    {t('and')}{' '}
                    <Link href="/privacy" className="text-blue-600 hover:underline">
                      {t('privacyPolicy')}
                    </Link>
                  </span>
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('creatingAccount') : t('createAccount')}
              </Button>
            </form>

            {/* Avantages de l'inscription */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
              <h3 className="font-medium text-green-900 mb-2">{t('trialIncludes')}</h3>
              <ul className="text-green-800 space-y-1 list-disc list-inside">
                <li key="daysFree">{t('daysFree')}</li>
                <li key="accessAllModules">{t('accessAllModules')}</li>
                <li key="technicalSupport">{t('technicalSupport')}</li>
                <li key="freeTraining">{t('freeTraining')}</li>
              </ul>
            </div>

            {/* Liens */}
            <div className="space-y-4">
              <Separator />

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  {t('alreadyHaveAccount')}{' '}
                  <Link href="/login" className="text-blue-600 hover:underline font-medium">
                    {t('signIn')}
                  </Link>
                </p>

                <div className="text-xs text-gray-500 space-x-3">
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
          </div>
        </Card>

        {/* Retour */}
        <div className="text-center mt-6">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToLogin')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
