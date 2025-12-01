import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '../../../../../utils/backend-api'

// GET /api/admin/menu-config/[id] - Obtenir une configuration par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const response = await callBackendFromApi(request, `admin/menu-config/${id}`)
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[menu-config] Error fetching configuration:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors du chargement de la configuration',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PUT /api/admin/menu-config/[id] - Mettre à jour une configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const response = await callBackendFromApi(request, `admin/menu-config/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[menu-config] Error updating configuration:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la mise à jour de la configuration',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/menu-config/[id] - Supprimer une configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const response = await callBackendFromApi(request, `admin/menu-config/${id}`, {
      method: 'DELETE',
    })
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[menu-config] Error deleting configuration:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la suppression de la configuration',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
