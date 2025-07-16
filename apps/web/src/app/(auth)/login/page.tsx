'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, Input, Label, Separator } from '@erp/ui'
import { Building2, Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    identifier: '', // Peut être email ou acronyme
    password: '',
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.identifier || !formData.password) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      await login(formData.identifier, formData.password, formData.rememberMe)
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Header avec logo */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <Building2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">TopSteel ERP</h1>
          <p className="text-muted-foreground mt-1">Gestion Métallurgique Industrielle</p>
        </div>

        <Card className="p-8 shadow-lg">
          <div className="space-y-6">
            {/* Header formulaire */}
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Connexion</h2>
              <p className="text-muted-foreground text-sm">
                Accédez à votre espace de gestion
              </p>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">Email ou Acronyme</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="identifier"
                    type="text"
                    value={formData.identifier}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('identifier', e.target.value)}
                    placeholder="admin@topsteel.com ou JDO"
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Utilisez votre email ou votre acronyme pour vous connecter
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('password', e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('rememberMe', e.target.checked)}
                    className="rounded border-input"
                  />
                  <span className="text-muted-foreground">Se souvenir de moi</span>
                </label>

                <Link 
                  href="/forgot-password" 
                  className="text-sm text-primary hover:underline"
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
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-sm">
              <div className="flex items-center mb-2">
                <Shield className="h-4 w-4 text-primary mr-2" />
                <span className="font-medium text-foreground">Compte de démonstration</span>
              </div>
              <div className="text-foreground/90 space-y-1">
                <p><strong>Email:</strong> admin@topsteel.com</p>
                <p><strong>Mot de passe:</strong> TopSteel2025!</p>
              </div>
            </div>

            {/* Liens d'inscription et autres */}
            <div className="space-y-4">
              <Separator />
              
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Nouveau sur TopSteel ?{' '}
                  <Link href="/register" className="text-primary hover:underline font-medium">
                    Créer un compte
                  </Link>
                </p>
                
                <div className="text-xs text-muted-foreground space-x-3">
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
        <div className="text-center mt-6 text-xs text-muted-foreground">
          <p>© 2024 TopSteel SAS. Tous droits réservés.</p>
          <p className="mt-1">
            Système ERP spécialisé pour l'industrie métallurgique
          </p>
        </div>
      </div>
    </div>
  )
}