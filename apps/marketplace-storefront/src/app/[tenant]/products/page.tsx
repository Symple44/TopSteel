'use client'

import { Suspense } from 'react'
import { ProductsGrid } from '@/components/product/products-grid'
import { ProductsFilters } from '@/components/product/products-filters'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface ProductsPageProps {
  params: { tenant: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function ProductsPage({ params, searchParams }: ProductsPageProps) {
  return (
    <div className="container-marketplace py-8">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Nos produits</h1>
          <p className="text-muted-foreground">
            Découvrez notre gamme complète de produits professionnels
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <Suspense fallback={<LoadingSpinner />}>
              <ProductsFilters tenant={params.tenant} />
            </Suspense>
          </aside>

          {/* Products Grid */}
          <main className="lg:col-span-3">
            <Suspense fallback={<LoadingSpinner />}>
              <ProductsGrid 
                tenant={params.tenant} 
                searchParams={searchParams}
              />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  )
}