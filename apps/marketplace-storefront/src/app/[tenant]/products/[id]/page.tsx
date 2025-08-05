import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductDetail } from '@/components/product/product-detail'
import { api } from '@/lib/api/storefront'

interface ProductPageProps {
  params: Promise<{
    tenant: string
    id: string
  }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params
    const product = await api.storefront.getProduct(resolvedParams.tenant, resolvedParams.id)

    return {
      title: `${product.designation} - Marketplace`,
      description: product.shortDescription || product.description?.substring(0, 160),
      openGraph: {
        title: product.designation,
        description: product.shortDescription || product.description?.substring(0, 160),
        images: product.images.length > 0 ? [product.images[0].url] : [],
      },
    }
  } catch (error) {
    return {
      title: 'Produit non trouvé - Marketplace',
      description: "Le produit demandé n'a pas été trouvé.",
    }
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  try {
    const resolvedParams = await params
    const product = await api.storefront.getProduct(resolvedParams.tenant, resolvedParams.id)

    return (
      <div className="container-marketplace py-8">
        <ProductDetail product={product} tenant={resolvedParams.tenant} />
      </div>
    )
  } catch (error) {
    notFound()
  }
}
