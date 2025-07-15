'use client'

import { Toaster } from 'sonner'
import { I18nProvider } from '@/lib/i18n'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/components/auth/AuthProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange={true}
        storageKey="topsteel-theme"
        forcedTheme="light"
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="top-right" />
      </ThemeProvider>
    </I18nProvider>
  )
}