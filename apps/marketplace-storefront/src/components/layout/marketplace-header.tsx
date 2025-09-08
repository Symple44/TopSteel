'use client'

import { Menu, Search, ShoppingCart, User, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useId, useState } from 'react'
import type { StorefrontConfig } from '@/lib/api/storefront'
import { cn } from '@/lib/utils'
import { useCart } from '@/stores/cart-store'

interface MarketplaceHeaderProps {
  tenant: string
  config: StorefrontConfig
}

export function MarketplaceHeader({ tenant, config }: MarketplaceHeaderProps) {
  const searchHintId = useId()
  const cartStatusId = useId()
  const mobileMenuId = useId()
  const mobileSearchHintId = useId()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { totalItems, toggleCart } = useCart()

  const navigation = [
    { name: 'Accueil', href: `/${tenant}` },
    { name: 'Produits', href: `/${tenant}/products` },
    { name: 'À propos', href: `/${tenant}/about` },
    { name: 'Contact', href: `/${tenant}/contact` },
  ]

  return (
    <header className="bg-background border-b sticky top-0 z-50">
      <div className="container-marketplace">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href={`/${tenant}`}
              className="flex items-center space-x-2"
              aria-label={`Retourner à l'accueil de ${config.storeName}`}
            >
              {config.logo ? (
                <Image
                  src={config.logo}
                  alt={`Logo de ${config.storeName}`}
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                />
              ) : (
                <div
                  className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center"
                  role="img"
                  aria-label={`Logo de ${config.storeName}`}
                >
                  <span className="text-primary-foreground font-bold text-sm" aria-hidden="true">
                    {config.storeName.charAt(0)}
                  </span>
                </div>
              )}
              <span className="font-bold text-lg">{config.storeName}</span>
            </Link>
          </div>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center space-x-8" aria-label="Navigation principale">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2 py-1"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <search className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <form
              className="relative w-full"
              onSubmit={(e) => {
                e.preventDefault()
                if (searchQuery.trim()) {
                  window.location.href = `/${tenant}/search?q=${encodeURIComponent(searchQuery)}`
                }
              }}
            >
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4"
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Rechercher des produits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-marketplace pl-10 w-full"
                aria-label="Rechercher des produits dans le catalogue"
                aria-describedby={searchHintId}
              />
              <span id={searchHintId} className="sr-only">
                Tapez votre recherche et appuyez sur Entrée
              </span>
            </form>
          </search>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <button
              type="button"
              onClick={toggleCart}
              className="p-2 hover:bg-muted rounded-lg transition-colors relative focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={`Panier ${totalItems > 0 ? `avec ${totalItems} article${totalItems > 1 ? 's' : ''}` : 'vide'}`}
              aria-describedby={cartStatusId}
            >
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              {totalItems > 0 && (
                <span
                  className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium"
                  aria-hidden="true"
                >
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
              <span id={cartStatusId} className="sr-only">
                {totalItems > 0
                  ? `${totalItems} article${totalItems > 1 ? 's' : ''} dans le panier`
                  : 'Panier vide'}
              </span>
            </button>

            {/* User Account */}
            <Link
              href={`/${tenant}/account`}
              className="p-2 hover:bg-muted rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Accéder à mon compte utilisateur"
            >
              <User className="h-5 w-5" aria-hidden="true" />
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={
                mobileMenuOpen ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation'
              }
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <nav
          id={mobileMenuId}
          className={cn(
            'md:hidden overflow-hidden transition-all duration-300 ease-in-out',
            mobileMenuOpen ? 'max-h-96 pb-4' : 'max-h-0'
          )}
          aria-label="Menu de navigation mobile"
          aria-hidden={!mobileMenuOpen}
        >
          {/* Mobile Search */}
          <search className="p-4 border-t">
            <form
              className="relative"
              onSubmit={(e) => {
                e.preventDefault()
                if (searchQuery.trim()) {
                  setMobileMenuOpen(false)
                  window.location.href = `/${tenant}/search?q=${encodeURIComponent(searchQuery)}`
                }
              }}
            >
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4"
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-marketplace pl-10 w-full"
                aria-label="Rechercher des produits dans le catalogue (mobile)"
                aria-describedby={mobileSearchHintId}
              />
              <span id={mobileSearchHintId} className="sr-only">
                Tapez votre recherche et appuyez sur Entrée
              </span>
            </form>
          </search>

          {/* Mobile Navigation */}
          <nav className="px-4 space-y-2" aria-label="Navigation mobile">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block py-2 text-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </nav>
      </div>
    </header>
  )
}
