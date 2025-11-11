import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '../../../../../../../utils/backend-api'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const response = await callBackendFromApi(request, `admin/database/backups/${id}/download`, {
      method: 'GET',
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

    // Pour les téléchargements, on retourne directement la réponse
    return response
  } catch (_error) {
    return NextResponse?.json(
      { success: false, error: 'Erreur lors du téléchargement' },
      { status: 500 }
    )
  }
}
