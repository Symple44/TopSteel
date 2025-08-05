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
      `admin/database/connections/tenant/${tenantCode}/close`,
      {
        method: 'POST',
      }
    )

    if (!response.ok) {
      // Simuler une réponse d'erreur
      return NextResponse.json(
        {
          success: false,
          message: `API backend non disponible - impossible de fermer la connexion pour le tenant ${tenantCode}`,
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
        message: `Erreur interne - impossible de fermer la connexion pour le tenant ${(await params).tenantCode}`,
      },
      { status: 500 }
    )
  }
}
