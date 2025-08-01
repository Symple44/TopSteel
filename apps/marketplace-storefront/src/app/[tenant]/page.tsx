import { Suspense } from 'react'
import { HeroSection } from '@/components/sections/hero-section'
import { FeaturedProducts } from '@/components/sections/featured-products'
import { CategoriesSection } from '@/components/sections/categories-section'
import { NewsletterSection } from '@/components/sections/newsletter-section'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface HomePageProps {
  params: { tenant: string }
}

export default async function HomePage({ params }: HomePageProps) {
  const resolvedParams = await params
  
  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <Suspense fallback={<LoadingSpinner />}>
        <HeroSection tenant={resolvedParams.tenant} />
      </Suspense>

      {/* Featured Products */}
      <section className="container-marketplace">
        <Suspense fallback={<LoadingSpinner />}>
          <FeaturedProducts tenant={resolvedParams.tenant} />
        </Suspense>
      </section>

      {/* Categories */}
      <section className="bg-muted/30">
        <div className="container-marketplace py-12">
          <Suspense fallback={<LoadingSpinner />}>
            <CategoriesSection tenant={resolvedParams.tenant} />
          </Suspense>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-primary text-primary-foreground">
        <div className="container-marketplace py-12">
          <Suspense fallback={<LoadingSpinner />}>
            <NewsletterSection tenant={resolvedParams.tenant} />
          </Suspense>
        </div>
      </section>
    </div>
  )
}