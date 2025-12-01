import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '../../../../../utils/backend-api'

// GET /api/admin/menu-config/active - Obtenir la configuration active
export async function GET(request: NextRequest) {
  try {
    const response = await callBackendFromApi(request, 'admin/menu-config/active')
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[menu-config] Error fetching active configuration:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors du chargement de la configuration active',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
