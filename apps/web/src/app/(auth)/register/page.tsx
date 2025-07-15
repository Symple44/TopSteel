'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, Input, Label, Separator } from '@erp/ui'
import { Building2, Eye, EyeOff, Lock, Mail, User, ArrowLeft } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function RegisterPage() {
  const router = useRouter()
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
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      })
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Erreur',
        description: 'Les mots de passe ne correspondent pas',
        variant: 'destructive',
      })
      return false
    }

    if (formData.password.length < 8) {
      toast({
        title: 'Erreur',
        description: 'Le mot de passe doit contenir au moins 8 caractères',
        variant: 'destructive',
      })
      return false
    }

    if (!formData.acceptTerms) {
      toast({
        title: 'Erreur',
        description: 'Veuillez accepter les conditions d\'utilisation',
        variant: 'destructive',
      })
      return false
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir une adresse email valide',
        variant: 'destructive',
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Simuler la création de compte
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: 'Compte créé avec succès',
        description: 'Vous pouvez maintenant vous connecter',
        variant: 'success',
      })
      
      router.push('/login')
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la création du compte',
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
          <p className="text-gray-600 mt-1">Créer votre compte</p>
        </div>

        <Card className="p-8 shadow-lg">
          <div className="space-y-6">
            {/* Header formulaire */}
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">Inscription</h2>
              <p className="text-gray-600 text-sm">
                Démarrez votre essai gratuit de 30 jours
              </p>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange('firstName')}
                    placeholder="Jean"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange('lastName')}
                    placeholder="Dupont"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Adresse email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    placeholder="jean.dupont@entreprise.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Entreprise</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={handleInputChange('company')}
                    placeholder="Métallerie Dupont"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
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
                <p className="text-xs text-gray-500">
                  Au moins 8 caractères avec majuscules, minuscules et chiffres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
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
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-start space-x-3 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange('acceptTerms')}
                    className="mt-0.5 rounded border-gray-300"
                    required
                  />
                  <span className="text-gray-600">
                    J'accepte les{' '}
                    <Link href="/terms" className="text-blue-600 hover:underline">
                      conditions d'utilisation
                    </Link>
                    {' '}et la{' '}
                    <Link href="/privacy" className="text-blue-600 hover:underline">
                      politique de confidentialité
                    </Link>
                  </span>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Création du compte...' : 'Créer mon compte'}
              </Button>
            </form>

            {/* Avantages de l'inscription */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
              <h3 className="font-medium text-green-900 mb-2">✨ Votre essai inclut :</h3>
              <ul className="text-green-800 space-y-1">
                <li>• 30 jours d'essai gratuit</li>
                <li>• Accès à tous les modules</li>
                <li>• Support technique inclus</li>
                <li>• Formation en ligne gratuite</li>
              </ul>
            </div>

            {/* Liens */}
            <div className="space-y-4">
              <Separator />
              
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Vous avez déjà un compte ?{' '}
                  <Link href="/login" className="text-blue-600 hover:underline font-medium">
                    Se connecter
                  </Link>
                </p>
                
                <div className="text-xs text-gray-500 space-x-3">
                  <Link href="/support" className="hover:underline">
                    Support
                  </Link>
                  <span>•</span>
                  <Link href="/privacy" className="hover:underline">
                    Confidentialité
                  </Link>
                  <span>•</span>
                  <Link href="/terms" className="hover:underline">
                    Conditions
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
              Retour à la connexion
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}