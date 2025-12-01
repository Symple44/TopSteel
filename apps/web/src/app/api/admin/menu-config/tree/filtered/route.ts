import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '../../../../../../utils/backend-api'

// GET /api/admin/menu-config/tree/filtered - Obtenir le menu filtré par permissions
export async function GET(request: NextRequest) {
  try {
    const response = await callBackendFromApi(request, 'admin/menu-config/tree/filtered')
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[menu-config] Error fetching filtered menu tree:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors du chargement du menu filtré',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
