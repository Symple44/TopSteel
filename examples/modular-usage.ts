/**
 * 📋 EXEMPLE D'UTILISATION - ARCHITECTURE MODULAIRE
 * Démonstration de l'utilisation des packages modulaires
 */

// ===== IMPORTS MODULAIRES =====

// Domain types and services
import { 
  Client, 
  ClientType, 
  ClientBusinessService 
} from '@erp/domains/core'
import { 
  Quote, 
  QuoteStatut 
} from '@erp/domains/sales'

// UI Components - imports sélectifs
import { Button } from '@erp/ui/primitives'
import { Card } from '@erp/ui/layout'
import { ClientCard } from '@erp/ui/business'
import { Alert } from '@erp/ui/feedback'

// Utils - imports ciblés
import { formatCurrency } from '@erp/utils/format'
import { groupBy, sortBy } from '@erp/utils/helpers'
import { BUSINESS_CONSTANTS } from '@erp/utils/constants'

// API Client
import { ERPApiClient } from '@erp/api-client'
import type { ClientFilters } from '@erp/api-client/clients'

// ===== EXEMPLE 1: UTILISATION DES DOMAINES =====

async function exempleDomaineClient() {
  // Création d'un client
  const nouveauClient: Omit<Client, 'id' | 'createdAt' | 'updatedAt'> = {
    nom: 'ACME Industries',
    type: ClientType.PROFESSIONNEL,
    email: 'contact@acme.com',
    telephone: '+33123456789',
    contact: {
      nom: 'Dupont',
      telephone: '+33123456789',
      email: 'dupont@acme.com',
      poste: 'Directeur'
    },
    adresse: {
      rue: '123 Avenue de l\'Industrie',
      ville: 'Paris',
      codePostal: '75001',
      pays: 'France'
    },
    statut: 'ACTIF',
    priorite: 'NORMALE',
    chiffreAffaire: 150000
  }

  // Utilisation des services métier
  const score = ClientBusinessService.calculateClientScore(nouveauClient as Client)
  const eligibleRemise = ClientBusinessService.isEligibleForDiscount(nouveauClient as Client)
  const pourcentageRemise = ClientBusinessService.calculateDiscountPercentage(nouveauClient as Client)

  console.log(`Score client: ${score}`)
  console.log(`Éligible remise: ${eligibleRemise}`)
  console.log(`Remise: ${pourcentageRemise}%`)
}

// ===== EXEMPLE 2: UTILISATION DE L'API CLIENT =====

async function exempleApiClient() {
  // Configuration de l'API client
  const apiClient = new ERPApiClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.topsteel.com',
    timeout: 30000,
  })

  // Authentification
  apiClient.setAuthToken({
    access_token: 'your-access-token',
    refresh_token: 'your-refresh-token'
  })

  // Recherche de clients avec filtres
  const filters: ClientFilters = {
    type: [ClientType.PROFESSIONNEL],
    statut: ['ACTIF'],
    ville: 'Paris',
    chiffreAffaireMin: 100000
  }

  const clients = await apiClient.clients.getClients(
    filters,
    { field: 'chiffreAffaire', direction: 'desc' },
    { page: 1, limit: 25 }
  )

  // Validation d'email
  const emailValid = await apiClient.clients.validateClientEmail('nouveau@client.com')
  
  // Création d'un client
  const result = await apiClient.clients.createClient({
    nom: 'Nouveau Client',
    type: ClientType.PARTICULIER,
    email: 'nouveau@client.com',
    telephone: '+33123456789'
  })

  if (result.success) {
    console.log('Client créé:', result.data)
  } else {
    console.error('Erreur:', result.error)
  }
}

// ===== EXEMPLE 3: UTILISATION DES UTILS =====

function exempleUtils() {
  // Formatage
  const montant = formatCurrency(1234.56) // "1 234,56 €"
  
  // Groupement de données
  const commandes = [
    { client: 'ACME', montant: 1000, statut: 'LIVRE' },
    { client: 'BETA', montant: 2000, statut: 'EN_COURS' },
    { client: 'ACME', montant: 1500, statut: 'LIVRE' }
  ]
  
  const commandesParClient = groupBy(commandes, item => item.client)
  const commandesTriees = sortBy(commandes, 'montant', 'desc')
  
  // Utilisation des constantes
  const tauxTVA = BUSINESS_CONSTANTS.VAT_RATES.STANDARD
  const delaiPaiement = BUSINESS_CONSTANTS.PAYMENT_TERMS.NET_30
}

// ===== EXEMPLE 4: COMPOSANT REACT AVEC UI MODULAIRE =====

import React from 'react'

export function ExempleComposantModulaire() {
  const [loading, setLoading] = React.useState(false)
  
  const client: Client = {
    id: '1',
    nom: 'ACME Corp',
    type: ClientType.PROFESSIONNEL,
    email: 'contact@acme.com',
    telephone: '+33123456789',
    contact: {
      nom: 'Dupont',
      telephone: '+33123456789',
      email: 'dupont@acme.com'
    },
    adresse: {
      rue: '123 rue de la Paix',
      ville: 'Paris',
      codePostal: '75001',
      pays: 'France'
    },
    statut: 'ACTIF',
    priorite: 'HAUTE',
    chiffreAffaire: 250000,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  return (
    <div className="p-4">
      {/* Composants UI modulaires */}
      <Card>
        <ClientCard client={client} />
        
        <div className="mt-4 space-x-2">
          <Button 
            variant="primary" 
            onClick={() => setLoading(true)}
          >
            Modifier
          </Button>
          
          <Button variant="secondary">
            Voir détails
          </Button>
        </div>
      </Card>

      {loading && (
        <Alert type="info" className="mt-4">
          Chargement en cours...
        </Alert>
      )}
    </div>
  )
}

// ===== EXEMPLE 5: OPTIMISATION DES IMPORTS =====

// ❌ Éviter - Import global
// import * as UI from '@erp/ui'

// ✅ Préférer - Imports sélectifs
import { Button, Input } from '@erp/ui/primitives'
import { formatDate, formatCurrency } from '@erp/utils/format'
import type { Client, CreateClientCommand } from '@erp/domains/core'

// Cela permet:
// - Tree-shaking optimal
// - Bundles plus petits
// - Chargement plus rapide
// - Meilleure developer experience