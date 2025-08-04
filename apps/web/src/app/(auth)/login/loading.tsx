import { Building2 } from 'lucide-react'

// Composant de loading pendant l'hydratation client
export default function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mb-4 shadow-lg animate-pulse">
          <Building2 className="h-8 w-8 text-primary-foreground" />
        </div>
        <p className="text-muted-foreground">Chargement de la page de connexion...</p>
        <div className="mt-4">
          <div className="inline-flex space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
