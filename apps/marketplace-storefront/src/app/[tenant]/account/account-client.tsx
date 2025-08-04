'use client'

import { useState } from 'react'
import Link from 'next/link'
import { User, Mail, Phone, MapPin, Package, Heart, Settings, LogOut } from 'lucide-react'

interface AccountClientProps {
  tenant: string
}

export default function AccountClient({ tenant }: AccountClientProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'favorites' | 'settings'>('profile')
  
  // Mock user data - in real app, this would come from auth context
  const user = {
    id: '1',
    email: 'jean.dupont@example.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    phone: '+33 1 23 45 67 89',
    company: 'Entreprise SARL',
    address: '123 Rue de la Paix',
    city: 'Paris',
    postalCode: '75001',
    country: 'France',
    createdAt: new Date('2024-01-15'),
  }

  const recentOrders = [
    {
      id: 'CMD-001',
      date: new Date('2024-01-20'),
      status: 'delivered',
      total: 1250.00,
      itemsCount: 3,
    },
    {
      id: 'CMD-002',
      date: new Date('2024-01-18'),
      status: 'shipped',
      total: 850.00,
      itemsCount: 2,
    },
    {
      id: 'CMD-003',
      date: new Date('2024-01-15'),
      status: 'processing',
      total: 2100.00,
      itemsCount: 5,
    },
  ]

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'delivered': return 'Livrée'
      case 'shipped': return 'Expédiée'
      case 'processing': return 'En cours'
      case 'cancelled': return 'Annulée'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-100'
      case 'shipped': return 'text-blue-600 bg-blue-100'
      case 'processing': return 'text-orange-600 bg-orange-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="container-marketplace py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Mon compte</h1>
          <p className="text-muted-foreground">
            Bienvenue, {user.firstName} {user.lastName}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-background border rounded-lg p-4 sticky top-24">
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'profile' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <User className="w-5 h-5" />
                  Profil
                </button>
                
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'orders' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <Package className="w-5 h-5" />
                  Mes commandes
                </button>
                
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'favorites' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <Heart className="w-5 h-5" />
                  Favoris
                </button>
                
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'settings' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  Paramètres
                </button>

                <div className="border-t pt-2 mt-4">
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-destructive/10 text-destructive transition-colors">
                    <LogOut className="w-5 h-5" />
                    Se déconnecter
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="bg-background border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Informations personnelles</h2>
                    <button className="btn-outline text-sm">
                      Modifier
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Email
                        </label>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span>{user.email}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Téléphone
                        </label>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{user.phone}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Nom complet
                        </label>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>{user.firstName} {user.lastName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Entreprise
                        </label>
                        <span>{user.company || 'Non renseignée'}</span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Adresse
                        </label>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <div>{user.address}</div>
                            <div>{user.postalCode} {user.city}</div>
                            <div>{user.country}</div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Membre depuis
                        </label>
                        <span>{user.createdAt.toLocaleDateString('fr-FR', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="bg-background border rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-6">Mes commandes</h2>

                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="font-semibold">Commande {order.id}</div>
                              <div className="text-sm text-muted-foreground">
                                {order.date.toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </span>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-semibold">{order.total.toFixed(2)} €</div>
                            <div className="text-sm text-muted-foreground">
                              {order.itemsCount} article{order.itemsCount > 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button className="btn-outline text-sm">
                            Voir les détails
                          </button>
                          {order.status === 'delivered' && (
                            <button className="btn-outline text-sm">
                              Commander à nouveau
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-center mt-8">
                    <Link
                      href={`/${tenant}/products`}
                      className="btn-primary"
                    >
                      Continuer mes achats
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="space-y-6">
                <div className="bg-background border rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-6">Mes favoris</h2>
                  
                  <div className="text-center py-12 space-y-4">
                    <Heart className="w-16 h-16 text-muted-foreground mx-auto" />
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Aucun favori pour le moment</h3>
                      <p className="text-muted-foreground">
                        Ajoutez des produits à vos favoris pour les retrouver facilement.
                      </p>
                    </div>
                    <Link
                      href={`/${tenant}/products`}
                      className="btn-primary"
                    >
                      Découvrir nos produits
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-background border rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-6">Paramètres du compte</h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-3">Notifications</h3>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" defaultChecked className="rounded border-input" />
                          <span className="text-sm">Recevoir les notifications de commande par email</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" defaultChecked className="rounded border-input" />
                          <span className="text-sm">Recevoir les offres promotionnelles</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" className="rounded border-input" />
                          <span className="text-sm">Recevoir la newsletter mensuelle</span>
                        </label>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="font-semibold mb-3">Sécurité</h3>
                      <div className="space-y-3">
                        <button className="btn-outline text-sm">
                          Changer mon mot de passe
                        </button>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="font-semibold mb-3 text-destructive">Zone de danger</h3>
                      <div className="space-y-3">
                        <button className="btn-outline border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground text-sm">
                          Supprimer mon compte
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}