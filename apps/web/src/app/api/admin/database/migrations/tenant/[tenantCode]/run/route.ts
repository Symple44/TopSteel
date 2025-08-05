import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantCode: string }> }
) {
  try {
    const { tenantCode } = await params

    // Proxy vers l'API backend

    const response = await callBackendFromApi(
      request,
      `admin/database/migrations/tenant/${tenantCode}/run`,
      {
        method: 'POST',
      }
    )

    if (!response.ok) {
      // Essayer de récupérer le détail de l'erreur
      let errorDetail = 'Erreur inconnue'
      try {
        const errorData = await response.text()
        errorDetail = errorData
      } catch (_e) {}

      // Simuler une réponse d'erreur
      return NextResponse.json(
        {
          success: false,
          message: `API backend non disponible - impossible d'exécuter les migrations pour le tenant ${tenantCode}`,
          error: errorDetail,
          status: response.status,
        },
        { status: 503 }
      )
    }

    const responseData = await response.json()
    return NextResponse.json(responseData.data || responseData)
  } catch (_error) {
    // Simuler une réponse d'erreur
    return NextResponse.json(
      {
        success: false,
        message: `Erreur interne - impossible d'exécuter les migrations pour le tenant`,
      },
      { status: 500 }
    )
  }
}
