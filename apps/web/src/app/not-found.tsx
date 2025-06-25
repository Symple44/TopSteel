// apps/web/src/app/not-found.tsx
import Link from 'next/link'
import { Button } from '@erp/ui'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-200">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mt-4">
            Page non trouvée
          </h2>
          <p className="text-gray-600 mt-2">
            Désolé, nous n'avons pas pu trouver la page que vous recherchez.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/dashboard">
              Retour au tableau de bord
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/">
              Retour à l'accueil
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
