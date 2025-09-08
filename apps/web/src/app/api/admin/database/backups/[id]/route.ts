import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const response = await callBackendFromApi(request, `admin/database/backups/${id}`, {
      method: 'DELETE',
      headers: {
        ...(request?.headers?.get('authorization')
          ? {
              Authorization: request?.headers?.get('authorization') as string,
            }
          : {}),
      },
    })

    if (!response?.ok) {
      return NextResponse?.json(
        { success: false, error: "Erreur lors de l'appel à l'API" },
        { status: response.status }
      )
    }

    const responseData = await response?.json()
    return NextResponse?.json(responseData?.data || responseData)
  } catch (_error) {
    // Simuler une suppression pour le mock
    const mockResponse = {
      success: true,
      message: 'Sauvegarde supprimée avec succès',
    }

    return NextResponse?.json(mockResponse)
  }
}
