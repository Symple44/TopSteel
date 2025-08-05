import Link from 'next/link'
import { ShoppingBag, Store, ArrowRight, Sparkles } from 'lucide-react'

export default function RootPage() {
  // In a real application, this would come from an API
  const marketplaces = [
    {
      tenant: 'demo',
      name: 'Demo Marketplace',
      description: 'Découvrez notre marketplace de démonstration',
      status: 'active',
    },
    {
      tenant: 'topsteel',
      name: 'TopSteel',
      description: 'Marketplace officiel TopSteel',
      status: 'coming-soon',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold">TopSteel Marketplace</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold">Bienvenue sur TopSteel Marketplace</h2>
            <p className="text-xl text-muted-foreground">
              Sélectionnez une boutique pour commencer vos achats
            </p>
          </div>

          {/* Marketplaces Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {marketplaces.map((marketplace) => (
              <div
                key={marketplace.tenant}
                className="relative bg-background border rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                {marketplace.status === 'coming-soon' && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full">
                      <Sparkles className="w-3 h-3" />
                      Bientôt
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Store className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{marketplace.name}</h3>
                      <p className="text-sm text-muted-foreground">/{marketplace.tenant}</p>
                    </div>
                  </div>

                  <p className="text-muted-foreground">{marketplace.description}</p>

                  {marketplace.status === 'active' ? (
                    <Link
                      href={`/${marketplace.tenant}`}
                      className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      Visiter la boutique
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      Ouverture prochaine
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Info Section */}
          <div className="bg-muted/50 rounded-lg p-8 text-center space-y-4">
            <h3 className="text-2xl font-semibold">Vous êtes un professionnel ?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Créez votre propre marketplace et vendez vos produits en ligne. Intégration complète
              avec votre ERP TopSteel.
            </p>
            <Link
              href="https://topsteel.fr/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Nous contacter
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            © 2024 TopSteel. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  )
}
