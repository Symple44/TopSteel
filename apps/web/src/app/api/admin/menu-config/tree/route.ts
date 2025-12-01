import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '../../../../../utils/backend-api'

// GET /api/admin/menu-config/tree - Obtenir l'arbre de menu
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('configId')

    const endpoint = configId
      ? `admin/menu-config/tree?configId=${configId}`
      : 'admin/menu-config/tree'

    const response = await callBackendFromApi(request, endpoint)
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[menu-config] Error fetching menu tree:', error)
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors du chargement de l'arbre de menu",
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
