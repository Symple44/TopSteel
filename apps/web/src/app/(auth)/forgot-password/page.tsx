'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, Input, Label } from '@erp/ui'
import { ArrowLeft, Mail, Shield, CheckCircle } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { toast } from '@/hooks/use-toast'

export default function ForgotPasswordPage() {
  const { t } = useTranslation(['auth', 'common'])
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir votre adresse email',
        variant: 'destructive',
      })
      return
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir une adresse email valide',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      // Simuler un appel API pour la récupération de mot de passe
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setIsEmailSent(true)
      toast({
        title: 'Email envoyé',
        description: 'Un email de récupération a été envoyé à votre adresse',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue. Veuillez réessayer.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <Card className="w-full max-w-md p-8 shadow-lg">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">Email envoyé !</h1>
              <p className="text-gray-600">
                Nous avons envoyé un lien de récupération à <strong>{email}</strong>
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="text-blue-800">
                <strong>Vérifiez votre boîte mail</strong> (y compris les spams). 
                Le lien expire dans 24 heures.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => setIsEmailSent(false)}
                variant="outline"
                className="w-full"
              >
                Renvoyer l'email
              </Button>
              
              <Link href="/login">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Mot de passe oublié</h1>
            <p className="text-gray-600">
              Saisissez votre email pour recevoir un lien de récupération
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jean.dupont@entreprise.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Envoi en cours...' : 'Envoyer le lien de récupération'}
            </Button>
          </form>

          {/* Security notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
            <p className="text-amber-800">
              <strong>Sécurité :</strong> Si vous ne recevez pas l'email, vérifiez que l'adresse 
              est correcte ou contactez votre administrateur.
            </p>
          </div>

          {/* Links */}
          <div className="text-center space-y-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à la connexion
              </Button>
            </Link>
            
            <div className="text-xs text-gray-500">
              Besoin d'aide ? <Link href="/support" className="text-blue-600 hover:underline">Contactez le support</Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}