'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { getFeaturedProducts } from '@/lib/api/storefront'
import { ProductCard } from '@/components/product/product-card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface FeaturedProductsProps {
  tenant: string
}

export function FeaturedProducts({ tenant }: FeaturedProductsProps) {
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['featured-products', tenant],
    queryFn: () => getFeaturedProducts(tenant, 8),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Produits vedettes</h2>
          <p className="text-muted-foreground mt-2">
            Découvrez notre sélection de produits phares
          </p>
        </div>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !products?.length) {
    return null
  }

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold">
          Produits vedettes
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Découvrez notre sélection de produits phares, choisis pour leur qualité 
          exceptionnelle et leur popularité auprès de nos clients
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            tenant={tenant}
          />
        ))}
      </div>

      {/* View All Button */}
      <div className="text-center pt-8">
        <Link
          href={`/${tenant}/products`}
          className="btn-primary px-8 py-3 text-lg inline-flex items-center gap-2 hover:gap-3 transition-all"
        >
          Voir tous les produits
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  )
}