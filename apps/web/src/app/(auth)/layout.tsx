'use client'

/**
 * Layout pour les pages d'authentification
 * Route group (auth) - ne crée pas de segment d'URL
 */

import type { ReactNode } from 'react'
import { Suspense } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>}>
      {children}
    </Suspense>
  )
}