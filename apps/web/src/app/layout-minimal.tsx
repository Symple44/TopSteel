import { useTranslation } from '@/lib/i18n/hooks'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { language } = useTranslation()

  return (
    <html lang={language || 'fr'}>
      <body>{children}</body>
    </html>
  )
}
