import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '../../../../../utils/backend-api'

// POST /api/admin/menu-config/sync - Synchroniser le menu depuis le sidebar
export async function POST(request: NextRequest) {
  try {
    const response = await callBackendFromApi(request, 'admin/menu-config/sync', {
      method: 'POST',
    })
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[menu-config] Error syncing menu:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la synchronisation du menu',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
