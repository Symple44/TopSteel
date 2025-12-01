import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '../../../../../../utils/backend-api'

// GET /api/admin/menu-config/[id]/export - Exporter une configuration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const response = await callBackendFromApi(request, `admin/menu-config/${id}/export`)
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[menu-config] Error exporting configuration:', error)
    return NextResponse.json(
      {
        success: false,
        message: "Erreur lors de l'export de la configuration",
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
