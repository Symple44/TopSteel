import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { MarketplaceHeader } from '@/components/layout/marketplace-header'
import { MarketplaceFooter } from '@/components/layout/marketplace-footer'
import { CartSidebar } from '@/components/cart/cart-sidebar'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { getTenantConfig } from '@/lib/api/storefront'

interface TenantLayoutProps {
  children: React.ReactNode
  params: { tenant: string }
}

export default async function TenantLayout({ 
  children, 
  params 
}: TenantLayoutProps) {
  const resolvedParams = await params
  
  try {
    // Resolve tenant and get configuration
    const config = await getTenantConfig(resolvedParams.tenant)
    
    if (!config) {
      notFound()
    }

    return (
      <div className="min-h-screen flex flex-col">
        <Suspense fallback={<LoadingSpinner />}>
          <MarketplaceHeader tenant={resolvedParams.tenant} config={config} />
        </Suspense>
        
        <main className="flex-1">
          <Suspense fallback={<LoadingSpinner />}>
            {children}
          </Suspense>
        </main>
        
        <Suspense fallback={<div />}>
          <MarketplaceFooter tenant={resolvedParams.tenant} config={config} />
        </Suspense>

        {/* Global Cart Sidebar */}
        <CartSidebar tenant={resolvedParams.tenant} />
      </div>
    )
  } catch (error) {
    console.error('Error loading tenant:', error)
    notFound()
  }
}

export async function generateMetadata({ params }: { params: { tenant: string } }) {
  const resolvedParams = await params
  
  try {
    const config = await getTenantConfig(resolvedParams.tenant)
    
    return {
      title: config?.seo?.title || `${config?.storeName || 'Marketplace'}`,
      description: config?.seo?.description || `Boutique en ligne ${config?.storeName || 'Marketplace'}`,
      keywords: config?.seo?.keywords || [],
    }
  } catch (error) {
    return {
      title: 'Marketplace',
      description: 'Boutique en ligne',
    }
  }
}