import Link from 'next/link'
import type { StorefrontConfig } from '@/lib/api/storefront'

interface MarketplaceFooterProps {
  tenant: string
  config: StorefrontConfig
}

export function MarketplaceFooter({ tenant, config }: MarketplaceFooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-muted/30 border-t mt-12">
      <div className="container-marketplace py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{config.storeName}</h3>
            {config.description && (
              <p className="text-muted-foreground text-sm">{config.description}</p>
            )}
            {config.contactInfo.address && (
              <p className="text-muted-foreground text-sm">{config.contactInfo.address}</p>
            )}
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-medium">Liens rapides</h4>
            <nav className="space-y-2">
              <Link
                href={`/${tenant}`}
                className="block text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                Accueil
              </Link>
              <Link
                href={`/${tenant}/products`}
                className="block text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                Produits
              </Link>
              <Link
                href={`/${tenant}/about`}
                className="block text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                À propos
              </Link>
              <Link
                href={`/${tenant}/contact`}
                className="block text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                Contact
              </Link>
            </nav>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h4 className="font-medium">Service client</h4>
            <nav className="space-y-2">
              <Link
                href={`/${tenant}/account`}
                className="block text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                Mon compte
              </Link>
              <Link
                href={`/${tenant}/orders`}
                className="block text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                Mes commandes
              </Link>
              <Link
                href={`/${tenant}/help`}
                className="block text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                Aide
              </Link>
              <Link
                href={`/${tenant}/returns`}
                className="block text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                Retours
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-medium">Contact</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {config.contactInfo.email && (
                <p>
                  <a
                    href={`mailto:${config.contactInfo.email}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {config.contactInfo.email}
                  </a>
                </p>
              )}
              {config.contactInfo.phone && (
                <p>
                  <a
                    href={`tel:${config.contactInfo.phone}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {config.contactInfo.phone}
                  </a>
                </p>
              )}
            </div>

            {/* Social Links */}
            {config.social && Object.values(config.social).some(Boolean) && (
              <div>
                <h5 className="font-medium mb-2 text-sm">Suivez-nous</h5>
                <div className="flex space-x-4">
                  {config.social.facebook && (
                    <a
                      href={config.social.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Facebook
                    </a>
                  )}
                  {config.social.twitter && (
                    <a
                      href={config.social.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Twitter
                    </a>
                  )}
                  {config.social.linkedin && (
                    <a
                      href={config.social.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-muted-foreground text-sm">
              © {currentYear} {config.storeName}. Tous droits réservés.
            </p>

            <div className="flex space-x-6 text-sm">
              <Link
                href={`/${tenant}/legal`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Mentions légales
              </Link>
              <Link
                href={`/${tenant}/privacy`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Confidentialité
              </Link>
              <Link
                href={`/${tenant}/terms`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                CGV
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
