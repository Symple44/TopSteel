'use client'

import { useMutation } from '@tanstack/react-query'
import { CheckCircle, Mail } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { subscribeToNewsletter } from '@/lib/api/storefront'
import { isValidEmail } from '@/lib/utils'

interface NewsletterSectionProps {
  tenant: string
}

export function NewsletterSection({ tenant }: NewsletterSectionProps) {
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)

  const subscribeMutation = useMutation({
    mutationFn: (email: string) => subscribeToNewsletter(tenant, email),
    onSuccess: () => {
      setIsSubscribed(true)
      setEmail('')
      toast.success('Inscription réussie !', {
        description: 'Vous recevrez bientôt nos dernières actualités.',
      })
    },
    onError: (error: any) => {
      toast.error("Erreur lors de l'inscription", {
        description: error.response?.data?.message || 'Veuillez réessayer plus tard.',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      toast.error('Veuillez saisir votre adresse email')
      return
    }

    if (!isValidEmail(email)) {
      toast.error('Veuillez saisir une adresse email valide')
      return
    }

    subscribeMutation.mutate(email)
  }

  if (isSubscribed) {
    return (
      <section className="text-center space-y-6">
        <div className="w-16 h-16 bg-accent text-accent-foreground rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold">Merci pour votre inscription !</h2>
          <p className="text-primary-foreground/90 text-lg">
            Vous recevrez bientôt nos dernières actualités et offres exclusives.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="text-center space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="w-16 h-16 bg-accent text-accent-foreground rounded-full flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold">Restez informé de nos actualités</h2>
          <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto">
            Inscrivez-vous à notre newsletter pour recevoir en avant-première nos nouveaux produits,
            offres spéciales et conseils d'experts.
          </p>
        </div>
      </div>

      {/* Newsletter Form */}
      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="email"
              placeholder="Votre adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              disabled={subscribeMutation.isPending}
            />
          </div>

          <button
            type="submit"
            disabled={subscribeMutation.isPending}
            className="btn-marketplace bg-accent text-accent-foreground hover:bg-accent/90 px-6 py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {subscribeMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" />
                Inscription...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                S'inscrire
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-primary-foreground/70">
          En vous inscrivant, vous acceptez de recevoir nos communications marketing. Vous pouvez
          vous désabonner à tout moment.
        </p>
      </form>

      {/* Benefits */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
        <div className="space-y-2">
          <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-4 h-4 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-sm">Nouveautés</h3>
          <p className="text-xs text-primary-foreground/80">
            Soyez les premiers informés de nos nouveaux produits
          </p>
        </div>

        <div className="space-y-2">
          <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-4 h-4 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-sm">Offres exclusives</h3>
          <p className="text-xs text-primary-foreground/80">
            Profitez de remises et promotions réservées aux abonnés
          </p>
        </div>

        <div className="space-y-2">
          <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-4 h-4 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-sm">Conseils d'experts</h3>
          <p className="text-xs text-primary-foreground/80">
            Recevez des conseils techniques et guides d'utilisation
          </p>
        </div>
      </div>
    </section>
  )
}
