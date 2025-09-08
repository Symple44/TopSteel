'use client'

import { useEffect } from 'react'
import { initializeSecurityPolicy } from '@/lib/code-security-policy'

/**
 * Security Initializer Component
 * Initializes security policies on the client side
 */
export function SecurityInitializer() {
  useEffect(() => {
    // Initialize code security policy
    initializeSecurityPolicy({
      allowEval: false,
      allowNewFunction: false,
      allowInlineScripts: false,
      allowDynamicImports: true, // Required for Next.js dynamic imports
      trustedDomains: [
        'localhost',
        'topsteel.fr',
        'api.topsteel.fr',
        'vercel.app'
      ],
      maxExpressionLength: 1000,
      enableLogging: process.env.NODE_ENV === 'development'
    })

    // Log successful initialization
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Security policies initialized')
    }
  }, [])

  return null
}