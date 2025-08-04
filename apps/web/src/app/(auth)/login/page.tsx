'use client'

import dynamic from 'next/dynamic'
import LoginLoading from './loading'

// Import dynamique sans SSR pour éviter l'erreur params Next.js 15
const LoginClientPage = dynamic(() => import('./login-client'), {
  ssr: false,
  loading: () => <LoginLoading />,
})

// Page login wrapper qui charge le composant client sans SSR
export default function LoginPage() {
  return <LoginClientPage />
}
