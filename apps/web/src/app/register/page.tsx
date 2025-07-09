'use client'

/**
 * 🔐 PAGE REGISTER ROBUSTE - TopSteel ERP
 * Page d'inscription avec gestion d'erreurs robuste et hydratation sécurisée
 * Fichier: apps/web/src/app/register/page.tsx
 */

import { ClientOnly } from '@/components/client-only'
import {
  Alert, AlertDescription,
  Button, Card, CardContent,
  CardDescription, CardFooter,
  CardHeader, CardTitle,
  Input, Label
} from '@erp/ui'

import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Building2, CheckCircle, Eye, EyeOff, Loader2, Mail, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

// ===== SCHÉMA DE VALIDATION =====

const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, 'Le prénom doit contenir au moins 2 caractères')
      .max(50, 'Le prénom ne peut pas dépasser 50 caractères')
      .regex(/^[a-zA-ZÀ-ÿ\s-']+$/, 'Le prénom ne peut contenir que des lettres'),

    lastName: z
      .string()
      .min(2, 'Le nom doit contenir au moins 2 caractères')
      .max(50, 'Le nom ne peut pas dépasser 50 caractères')
      .regex(/^[a-zA-ZÀ-ÿ\s-']+$/, 'Le nom ne peut contenir que des lettres'),

    email: z
      .string()
      .email('Email invalide')
      .min(5, "L'email doit contenir au moins 5 caractères")
      .max(255, "L'email ne peut pas dépasser 255 caractères"),

    password: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
      .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'
      ),

    confirmPassword: z.string(),

    company: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.length >= 2,
        "Le nom d'entreprise doit contenir au moins 2 caractères"
      ),

    acceptTerms: z
      .boolean()
      .refine((val) => val === true, "Vous devez accepter les conditions d'utilisation"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

// ===== TYPES =====

interface RegisterError {
  type: 'validation' | 'server' | 'network'
  message: string
  field?: keyof RegisterFormData
}

interface RegisterState {
  isLoading: boolean
  error: RegisterError | null
  success: boolean
}

// ===== COMPOSANT PRINCIPAL =====

export default function RegisterPage() {
  // ===== HOOKS =====
  const router = useRouter()
  const [state, setState] = useState<RegisterState>({
    isLoading: false,
    error: null,
    success: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Hook pour l'hydratation sécurisée
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError: setFieldError,
    reset,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      company: '',
      acceptTerms: false,
    },
  })

  // Observer les changements de mot de passe pour validation en temps réel
  const password = watch('password')

  // ===== GESTIONNAIRES D'ÉVÉNEMENTS =====

  const setError = useCallback((error: RegisterError) => {
    setState((prev) => ({ ...prev, error, isLoading: false }))
  }, [])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev)
  }, [])

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword((prev) => !prev)
  }, [])

  const onSubmit = useCallback(
    async (data: RegisterFormData) => {
      clearError()
      setState((prev) => ({ ...prev, isLoading: true }))

      try {
        // Simulation d'appel API - remplacer par votre logique
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            email: data.email.toLowerCase().trim(),
            password: data.password,
            company: data.company?.trim() || null,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))

          if (response.status === 400) {
            if (errorData.field) {
              setFieldError(errorData.field, { message: errorData.message })
              setError({
                type: 'validation',
                message: errorData.message,
                field: errorData.field,
              })
            } else {
              setError({
                type: 'validation',
                message: errorData.message || 'Données invalides',
              })
            }
          } else if (response.status === 409) {
            setError({
              type: 'validation',
              message: 'Cette adresse email est déjà utilisée',
              field: 'email',
            })
            setFieldError('email', { message: 'Cette adresse email est déjà utilisée' })
          } else {
            setError({
              type: 'server',
              message: 'Erreur serveur. Veuillez réessayer plus tard.',
            })
          }

          return
        }

        const result = await response.json()

        setState((prev) => ({ ...prev, success: true, isLoading: false }))

        // Redirection après succès
        setTimeout(() => {
          router.push('/login?message=Inscription réussie ! Vous pouvez maintenant vous connecter.')
        }, 2000)
      } catch (error) {
        console.error("Erreur lors de l'inscription:", error)
        setError({
          type: 'network',
          message: 'Problème de connexion. Vérifiez votre connexion internet et réessayez.',
        })
      }
    },
    [clearError, router, setFieldError, setError]
  )

  // ===== FONCTION DE VALIDATION DE LA FORCE DU MOT DE PASSE =====

  const getPasswordStrength = useCallback((password: string) => {
    if (!password) return { score: 0, text: '', color: '' }

    let score = 0
    const checks = [
      password.length >= 8,

      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*(),.?":{}|<>]/.test(password),
      password.length >= 12,
    ]

    score = checks.filter(Boolean).length

    if (score < 3) return { score, text: 'Faible', color: 'text-red-500' }
    if (score < 5) return { score, text: 'Moyen', color: 'text-yellow-500' }

    return { score, text: 'Fort', color: 'text-green-500' }
  }, [])

  const passwordStrength = getPasswordStrength(password || '')

  // ===== RENDU =====

  // Fallback pendant l'hydratation
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="w-80 h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-pulse">
            <div className="w-80 h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      }
    >
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Créer un compte</CardTitle>
            <CardDescription className="text-center">
              Rejoignez TopSteel ERP pour gérer votre entreprise
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <CardContent className="space-y-4">
              {/* Affichage des erreurs */}
              {state.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{state.error.message}</AlertDescription>
                </Alert>
              )}

              {/* Message de succès */}
              {state.success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    Inscription réussie ! Redirection en cours...
                  </AlertDescription>
                </Alert>
              )}

              {/* Prénom */}
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  Prénom <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    disabled={state.isLoading}
                    className={errors.firstName ? 'border-red-500' : ''}
                    {...register('firstName')}
                  />
                  <User className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                </div>
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName.message}</p>
                )}
              </div>

              {/* Nom */}
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Nom <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    disabled={state.isLoading}
                    className={errors.lastName ? 'border-red-500' : ''}
                    {...register('lastName')}
                  />
                  <User className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                </div>
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    disabled={state.isLoading}
                    className={errors.email ? 'border-red-500' : ''}
                    {...register('email')}
                  />
                  <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                </div>
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>

              {/* Entreprise (optionnel) */}
              <div className="space-y-2">
                <Label htmlFor="company">Entreprise</Label>
                <div className="relative">
                  <Input
                    id="company"
                    type="text"
                    autoComplete="organization"
                    disabled={state.isLoading}
                    className={errors.company ? 'border-red-500' : ''}
                    {...register('company')}
                  />
                  <Building2 className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                </div>
                {errors.company && <p className="text-sm text-red-500">{errors.company.message}</p>}
              </div>

              {/* Mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  Mot de passe <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    disabled={state.isLoading}
                    className={errors.password ? 'border-red-500' : ''}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={state.isLoading}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {password && (
                  <div className="flex items-center space-x-2 text-sm">
                    <div
                      className={`flex-1 h-1 rounded ${
                        passwordStrength.score < 3
                          ? 'bg-red-200'
                          : passwordStrength.score < 5
                            ? 'bg-yellow-200'
                            : 'bg-green-200'
                      }`}
                    >
                      <div
                        className={`h-full rounded transition-all duration-300 ${
                          passwordStrength.score < 3
                            ? 'bg-red-500'
                            : passwordStrength.score < 5
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                      />
                    </div>
                    <span className={passwordStrength.color}>{passwordStrength.text}</span>
                  </div>
                )}
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Confirmation mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirmer le mot de passe <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    disabled={state.isLoading}
                    className={errors.confirmPassword ? 'border-red-500' : ''}
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={state.isLoading}
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Acceptation des conditions */}
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  disabled={state.isLoading}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  {...register('acceptTerms')}
                />
                <Label htmlFor="acceptTerms" className="text-sm">
                  J'accepte les{' '}
                  <Link
                    href="/terms"
                    className="text-blue-600 hover:text-blue-500 underline"
                    target="_blank"
                  >
                    conditions d'utilisation
                  </Link>{' '}
                  et la{' '}
                  <Link
                    href="/privacy"
                    className="text-blue-600 hover:text-blue-500 underline"
                    target="_blank"
                  >
                    politique de confidentialité
                  </Link>
                  <span className="text-red-500"> *</span>
                </Label>
              </div>
              {errors.acceptTerms && (
                <p className="text-sm text-red-500">{errors.acceptTerms.message}</p>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={state.isLoading || !isValid}>
                {state.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création du compte...
                  </>
                ) : (
                  'Créer mon compte'
                )}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Vous avez déjà un compte ?{' '}
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-500 underline font-medium"
                >
                  Se connecter
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </ClientOnly>
  )
}




