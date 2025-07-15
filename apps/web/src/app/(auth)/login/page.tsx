'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, Input, Label, Separator } from '@erp/ui'
import { Building2, Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      await login(formData.email, formData.password, formData.rememberMe)
      toast({
        title: 'Connexion réussie',
        description: 'Bienvenue dans TopSteel ERP',
        variant: 'success',
      })
      router.push('/dashboard')
    } catch (error) {
      toast({
        title: 'Erreur de connexion',
        description: error instanceof Error ? error.message : 'Email ou mot de passe incorrect',
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
          <p className="text-gray-600 mt-1">Gestion Métallurgique Industrielle</p>
        </div>

        <Card className="p-8 shadow-lg">
          <div className="space-y-6">
            {/* Header formulaire */}
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">Connexion</h2>
              <p className="text-gray-600 text-sm">
                Accédez à votre espace de gestion
              </p>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    placeholder="admin@topsteel.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
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
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleInputChange('rememberMe')}
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-600">Se souvenir de moi</span>
                </label>

                <Link 
                  href="/forgot-password" 
                  className="text-sm text-blue-600 hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>

            {/* Informations de connexion par défaut */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <div className="flex items-center mb-2">
                <Shield className="h-4 w-4 text-blue-600 mr-2" />
                <span className="font-medium text-blue-900">Compte de démonstration</span>
              </div>
              <div className="text-blue-800 space-y-1">
                <p><strong>Email:</strong> admin@topsteel.com</p>
                <p><strong>Mot de passe:</strong> TopSteel2025!</p>
              </div>
            </div>

            {/* Liens d'inscription et autres */}
            <div className="space-y-4">
              <Separator />
              
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Nouveau sur TopSteel ?{' '}
                  <Link href="/register" className="text-blue-600 hover:underline font-medium">
                    Créer un compte
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

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>© 2024 TopSteel SAS. Tous droits réservés.</p>
          <p className="mt-1">
            Système ERP spécialisé pour l'industrie métallurgique
          </p>
        </div>
      </div>
    </div>
  )
}