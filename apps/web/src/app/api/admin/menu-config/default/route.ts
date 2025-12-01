import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '../../../../../utils/backend-api'

// POST /api/admin/menu-config/default - Créer la configuration par défaut
export async function POST(request: NextRequest) {
  try {
    const response = await callBackendFromApi(request, 'admin/menu-config/default', {
      method: 'POST',
    })
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[menu-config] Error creating default configuration:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la création de la configuration par défaut',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
