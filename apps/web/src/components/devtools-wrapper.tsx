/**
 * 🛠️ DEVTOOLS WRAPPER MINIMAL - TOPSTEEL ERP
 * Version ultra-simplifiée pour éviter les erreurs de types
 */

"use client"

import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

/**
 * Wrapper minimal pour ReactQueryDevtools
 */
export function DevToolsWrapper() {
  // Sécurité: Pas d'affichage en production
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  // Version ultra-minimale sans aucune propriété
  return <ReactQueryDevtools />
}

export default DevToolsWrapper