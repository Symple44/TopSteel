import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '../../../../../../utils/backend-api'

// POST /api/admin/menu-config/[id]/activate - Activer une configuration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const response = await callBackendFromApi(request, `admin/menu-config/${id}/activate`, {
      method: 'POST',
    })
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[menu-config] Error activating configuration:', error)
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de l'activation de la configuration",
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
