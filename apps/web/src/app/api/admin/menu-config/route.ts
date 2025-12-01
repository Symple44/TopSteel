import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '../../../../utils/backend-api'

// GET /api/admin/menu-config - Liste toutes les configurations de menu
export async function GET(request: NextRequest) {
  try {
    const response = await callBackendFromApi(request, 'admin/menu-config')
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[menu-config] Error fetching configurations:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors du chargement des configurations',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST /api/admin/menu-config - Crée une nouvelle configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const response = await callBackendFromApi(request, 'admin/menu-config', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[menu-config] Error creating configuration:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la création de la configuration',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
