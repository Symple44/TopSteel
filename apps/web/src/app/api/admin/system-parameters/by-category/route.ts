import { type NextRequest, NextResponse } from 'next/server'

// Interface pour les paramètres système
interface SystemParameter {
  id: string
  key: string
  value: string
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ENUM'
  category:
    | 'GENERAL'
    | 'COMPTABILITE'
    | 'PROJETS'
    | 'PRODUCTION'
    | 'ACHATS'
    | 'STOCKS'
    | 'NOTIFICATION'
    | 'SECURITY'
    | 'ELASTICSEARCH'
  description: string
  defaultValue?: string
  isEditable: boolean
  isSecret: boolean
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

// Importer les paramètres depuis l'API principale
// Pour éviter la duplication, on va créer une référence partagée
import { GET as getParameters } from '../route'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    // Créer une requête fictive pour récupérer tous les paramètres
    const allParametersResponse = await getParameters(request)
    const allParameters = await allParametersResponse.json()

    if (category) {
      // Filtrer par catégorie
      const filteredParams = allParameters.filter((p: SystemParameter) => p.category === category)
      return NextResponse.json(filteredParams)
    } else {
      // Grouper par catégorie
      const parametersByCategory = allParameters.reduce(
        (acc: Record<string, SystemParameter[]>, param: SystemParameter) => {
          if (!acc[param.category]) {
            acc[param.category] = []
          }
          acc[param.category].push(param)
          return acc
        },
        {} as Record<string, SystemParameter[]>
      )

      return NextResponse.json(parametersByCategory)
    }
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to fetch parameters by category' }, { status: 500 })
  }
}
