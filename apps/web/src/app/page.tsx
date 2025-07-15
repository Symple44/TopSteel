import { Building2 } from 'lucide-react'
import { ClientOnly } from '@/components/ClientOnly'
import HomePageClient from './home-client'

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <ClientOnly fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg mb-6">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">TopSteel ERP</h2>
          <p className="text-gray-600">Chargement en cours...</p>
        </div>
      </div>
    }>
      <HomePageClient />
    </ClientOnly>
  )
}
