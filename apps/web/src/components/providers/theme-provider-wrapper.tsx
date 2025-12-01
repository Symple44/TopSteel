'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'

interface ThemeProviderWrapperProps {
  children: ReactNode
}

// Dynamic import pour éviter le SSR
const DynamicThemeProvider = dynamic(() => import('next-themes').then((mod) => mod.ThemeProvider), {
  ssr: false,
})

export function ThemeProviderWrapper({ children }: ThemeProviderWrapperProps) {
  return (
    <DynamicThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={true}
      disableTransitionOnChange={false}
      storageKey="topsteel-theme"
      themes={['light', 'dark', 'system']}
    >
      {children}
    </DynamicThemeProvider>
  )
}
