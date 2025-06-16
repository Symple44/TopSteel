'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'

export default function HomePage() {
  const router = useRouter()
  const isAuthenticated = useStore((state) => state.isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    </div>
  )
}