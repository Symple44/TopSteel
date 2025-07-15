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

// Importer les paramètres depuis le fichier principal
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

export async function GET(request: NextRequest) {
  try {
    // Grouper les paramètres par catégorie
    const parametersByCategory = mockParameters.reduce((acc, param) => {
      if (!acc[param.category]) {
        acc[param.category] = []
      }
      acc[param.category].push(param)
      return acc
    }, {} as Record<string, SystemParameter[]>)

    return NextResponse.json(parametersByCategory)
  } catch (error) {
    console.error('Error fetching parameters by category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch parameters by category' },
      { status: 500 }
    )
  }
}