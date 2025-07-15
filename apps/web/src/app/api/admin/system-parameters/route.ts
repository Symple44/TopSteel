import { NextRequest, NextResponse } from 'next/server'

// Interface pour les paramètres système
interface SystemParameter {
  id: string
  key: string
  value: string
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ENUM'
  category: 'GENERAL' | 'COMPTABILITE' | 'PROJETS' | 'PRODUCTION' | 'ACHATS' | 'STOCKS' | 'NOTIFICATION' | 'SECURITY'
  description: string
  defaultValue?: string
  isEditable: boolean
  isSecret: boolean
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

// Données mockées pour le développement
const mockParameters: SystemParameter[] = [
  {
    id: '1',
    key: 'COMPANY_NAME',
    value: 'TopSteel SARL',
    type: 'STRING',
    category: 'GENERAL',
    description: 'Nom de la société',
    defaultValue: 'TopSteel SARL',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    key: 'COMPANY_ADDRESS',
    value: '123 Rue de la Métallurgie, 75000 Paris',
    type: 'STRING',
    category: 'GENERAL',
    description: 'Adresse de la société',
    defaultValue: '',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    key: 'COMPANY_PHONE',
    value: '01 23 45 67 89',
    type: 'STRING',
    category: 'GENERAL',
    description: 'Téléphone de la société',
    defaultValue: '',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    key: 'COMPANY_EMAIL',
    value: 'contact@topsteel.com',
    type: 'STRING',
    category: 'GENERAL',
    description: 'Email de la société',
    defaultValue: '',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    key: 'COMPANY_SIRET',
    value: '12345678901234',
    type: 'STRING',
    category: 'GENERAL',
    description: 'Numéro SIRET',
    defaultValue: '',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '6',
    key: 'COMPANY_TVA',
    value: 'FR12345678901',
    type: 'STRING',
    category: 'GENERAL',
    description: 'Numéro TVA',
    defaultValue: '',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '7',
    key: 'DEFAULT_CURRENCY',
    value: 'EUR',
    type: 'ENUM',
    category: 'COMPTABILITE',
    description: 'Devise par défaut',
    defaultValue: 'EUR',
    isEditable: true,
    isSecret: false,
    metadata: { enum: ['EUR', 'USD', 'GBP'] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '8',
    key: 'DEFAULT_VAT_RATE',
    value: '20',
    type: 'NUMBER',
    category: 'COMPTABILITE',
    description: 'Taux TVA par défaut (%)',
    defaultValue: '20',
    isEditable: true,
    isSecret: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '9',
    key: 'WEIGHT_UNIT',
    value: 'kg',
    type: 'ENUM',
    category: 'PRODUCTION',
    description: 'Unité de poids par défaut',
    defaultValue: 'kg',
    isEditable: true,
    isSecret: false,
    metadata: { enum: ['kg', 't', 'g'] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '10',
    key: 'LENGTH_UNIT',
    value: 'mm',
    type: 'ENUM',
    category: 'PRODUCTION',
    description: 'Unité de longueur par défaut',
    defaultValue: 'mm',
    isEditable: true,
    isSecret: false,
    metadata: { enum: ['mm', 'cm', 'm'] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// Stockage temporaire pour les mises à jour (en production, utiliser une base de données)
let parameters = [...mockParameters]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    if (category) {
      const filteredParams = parameters.filter(p => p.category === category)
      return NextResponse.json(filteredParams)
    }

    return NextResponse.json(parameters)
  } catch (error) {
    console.error('Error fetching system parameters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system parameters' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const updates: Array<{ key: string; value: string }> = await request.json()

    // Mettre à jour les paramètres
    updates.forEach(update => {
      const paramIndex = parameters.findIndex(p => p.key === update.key)
      if (paramIndex !== -1) {
        parameters[paramIndex] = {
          ...parameters[paramIndex],
          value: update.value,
          updatedAt: new Date().toISOString(),
        }
      }
    })

    // Retourner les paramètres mis à jour
    const updatedParams = parameters.filter(p => 
      updates.some(update => update.key === p.key)
    )

    return NextResponse.json(updatedParams)
  } catch (error) {
    console.error('Error updating system parameters:', error)
    return NextResponse.json(
      { error: 'Failed to update system parameters' },
      { status: 500 }
    )
  }
}