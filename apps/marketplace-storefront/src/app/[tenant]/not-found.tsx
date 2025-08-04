import Link from 'next/link'
import { Home, ShoppingBag } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
      <div className="container-marketplace max-w-2xl mx-auto px-4 py-16 text-center space-y-8">
        <div className="space-y-4">
          <ShoppingBag className="w-24 h-24 text-muted-foreground mx-auto" />
          
          <h1 className="text-4xl font-bold">Marketplace non trouvé</h1>
          
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            La boutique que vous recherchez n'existe pas ou n'est pas encore configurée.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            Retour à l'accueil
          </Link>
        </div>

        <div className="pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le support.
          </p>
        </div>
      </div>
    </div>
  )
}