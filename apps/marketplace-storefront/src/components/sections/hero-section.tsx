'use client'

import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { getTenantConfig } from '@/lib/api/storefront'

interface HeroSectionProps {
  tenant: string
}

export function HeroSection({ tenant }: HeroSectionProps) {
  const { data: config, isLoading } = useQuery({
    queryKey: ['config', tenant],
    queryFn: () => getTenantConfig(tenant),
  })

  if (isLoading) {
    return <LoadingSpinner size="lg" />
  }

  if (!config) {
    return null
  }

  return (
    <section className="relative bg-gradient-primary text-primary-foreground overflow-hidden">
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative container-marketplace py-24 lg:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Main Title */}
          <h1 className="text-4xl md:text-6xl font-bold leading-tight animate-fade-in">
            Bienvenue chez <span className="block text-accent">{config.storeName}</span>
          </h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-2xl mx-auto animate-fade-in">
            {config.description || 'Découvrez notre gamme de produits de qualité professionnelle'}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
            <Link
              href={`/${tenant}/products`}
              className="btn-marketplace bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-4 text-lg font-semibold inline-flex items-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              Voir nos produits
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href={`/${tenant}/about`}
              className="btn-outline text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary px-8 py-4 text-lg"
            >
              En savoir plus
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="font-semibold">Produits de qualité</h3>
              <p className="text-primary-foreground/80 text-sm">
                Une sélection rigoureuse de produits professionnels
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-6 h-6 text-accent-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  role="img"
                  aria-label="Livraison rapide"
                >
                  <title>Livraison rapide</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold">Livraison rapide</h3>
              <p className="text-primary-foreground/80 text-sm">
                Expédition sous 24h pour tous vos besoins urgents
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-6 h-6 text-accent-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  role="img"
                  aria-label="Support expert"
                >
                  <title>Support expert</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25A9.75 9.75 0 1021.75 12 9.75 9.75 0 0012 2.25zM8.25 12l7.5 0"
                  />
                </svg>
              </div>
              <h3 className="font-semibold">Support expert</h3>
              <p className="text-primary-foreground/80 text-sm">
                Une équipe d'experts à votre disposition
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-accent rounded-full animate-pulse" />
        <div className="absolute top-32 right-20 w-16 h-16 border-2 border-accent rounded-full animate-pulse delay-1000" />
        <div className="absolute bottom-20 left-1/4 w-12 h-12 border-2 border-accent rounded-full animate-pulse delay-2000" />
      </div>
    </section>
  )
}
