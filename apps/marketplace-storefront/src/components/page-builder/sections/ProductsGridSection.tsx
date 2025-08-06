'use client'

import { useQuery } from '@tanstack/react-query'
import { ProductCard } from '@/components/product/product-card'
import { marketplaceApi } from '@/lib/api/client'
import { SectionWrapper } from './SectionWrapper'
import type { SectionProps } from './types'

export interface ProductsGridContent {
  title?: string
  subtitle?: string
  source: 'featured' | 'category' | 'manual' | 'latest' | 'best-selling'
  categoryId?: string
  productIds?: string[]
  limit?: number
  columns?: {
    mobile?: 1 | 2
    tablet?: 2 | 3 | 4
    desktop?: 3 | 4 | 5 | 6
  }
  showFilters?: boolean
  showPagination?: boolean
}

export function ProductsGridSection({
  section,
  isEditing,
  tenant,
}: SectionProps<ProductsGridContent> & { tenant?: string }) {
  const { content, styles, settings } = section

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', content.source, content.categoryId, content.limit],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        limit: content.limit || 12,
      }

      if (content.source === 'category' && content.categoryId) {
        params.categoryId = content.categoryId
      } else if (content.source === 'featured') {
        params.featured = true
      } else if (content.source === 'latest') {
        params.sort = 'createdAt:desc'
      } else if (content.source === 'best-selling') {
        params.sort = 'salesCount:desc'
      }

      const response = await marketplaceApi.get('/products', { params })
      return (response as { data: { data: unknown[] } }).data.data
    },
  })

  const gridColumns = {
    mobile: `grid-cols-${content.columns?.mobile || 2}`,
    tablet: `sm:grid-cols-${content.columns?.tablet || 3}`,
    desktop: `lg:grid-cols-${content.columns?.desktop || 4}`,
  }

  return (
    <SectionWrapper
      styles={styles}
      settings={settings}
      isEditing={isEditing}
      className="py-12 md:py-16"
    >
      {(content.title || content.subtitle) && (
        <div className="text-center mb-12">
          {content.title && (
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{content.title}</h2>
          )}
          {content.subtitle && <p className="text-lg text-muted-foreground">{content.subtitle}</p>}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: content.limit || 12 }, (_, i) => (
            <div
              key={`product-skeleton-${Math.random()}-${i}`}
              className="bg-muted animate-pulse rounded-lg h-64"
            />
          ))}
        </div>
      ) : (
        <div
          className={`grid ${gridColumns.mobile} ${gridColumns.tablet} ${gridColumns.desktop} gap-6`}
        >
          {products?.map((product: unknown) => {
            const p = product as { id: string }
            return <ProductCard key={p.id} product={product} tenant={tenant || 'demo'} />
          })}
        </div>
      )}
    </SectionWrapper>
  )
}
