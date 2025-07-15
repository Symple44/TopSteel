'use client'

/**
 * Layout pour les pages d'authentification
 * Route group (auth) - ne crée pas de segment d'URL
 */

import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <>
      {children}
    </>
  )
}