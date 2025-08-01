'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Package } from 'lucide-react'
import { getCategories } from '@/lib/api/storefront'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { slugify } from '@/lib/utils'

interface CategoriesSectionProps {
  tenant: string
}

export function CategoriesSection({ tenant }: CategoriesSectionProps) {
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['categories', tenant],
    queryFn: () => getCategories(tenant),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Nos catégories</h2>
          <p className="text-muted-foreground mt-2">
            Explorez notre gamme de produits par catégorie
          </p>
        </div>
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !categories?.length) {
    return null
  }

  // Prendre les 6 premières catégories pour l'affichage
  const displayCategories = categories.slice(0, 6)

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold">
          Nos catégories
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Explorez notre gamme complète de produits organisés par catégories 
          pour faciliter votre recherche
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayCategories.map((category) => (
          <CategoryCard
            key={category}
            category={category}
            tenant={tenant}
          />
        ))}
      </div>

      {/* View All Categories */}
      {categories.length > 6 && (
        <div className="text-center pt-4">
          <Link
            href={`/${tenant}/categories`}
            className="btn-outline px-6 py-2 inline-flex items-center gap-2 hover:gap-3 transition-all"
          >
            Voir toutes les catégories
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </section>
  )
}

interface CategoryCardProps {
  category: string
  tenant: string
}

function CategoryCard({ category, tenant }: CategoryCardProps) {
  const categorySlug = slugify(category)

  return (
    <Link
      href={`/${tenant}/products?category=${encodeURIComponent(category)}`}
      className="group block card-marketplace p-6 hover:shadow-lg transition-all duration-300"
    >
      <div className="space-y-4">
        {/* Icon */}
        <div className="w-12 h-12 bg-primary/10 group-hover:bg-primary/20 rounded-lg flex items-center justify-center transition-colors">
          <Package className="w-6 h-6 text-primary" />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
            {category}
          </h3>
          <p className="text-muted-foreground text-sm">
            Découvrez tous nos produits de la catégorie {category.toLowerCase()}
          </p>
        </div>

        {/* Arrow */}
        <div className="flex items-center text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-sm font-medium mr-2">Explorer</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  )
}

// Fonction pour obtenir une icône spécifique par catégorie
function getCategoryIcon(category: string) {
  const iconMap: Record<string, React.ComponentType<any>> = {
    'métaux': Package,
    'acier': Package,
    'aluminium': Package,
    'inox': Package,
    'default': Package,
  }

  const normalizedCategory = category.toLowerCase()
  const IconComponent = iconMap[normalizedCategory] || iconMap.default

  return IconComponent
}