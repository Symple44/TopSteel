import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '../../../../../../../../utils/backend-api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ database: string; migrationName: string }> }
) {
  try {
    const { database, migrationName } = await params

    // Proxy vers l'API backend

    const response = await callBackendFromApi(
      request,
      `admin/database/migrations/${database}/${migrationName}/details`,
      {
        method: 'GET',
        signal: AbortSignal?.timeout(10000),
      }
    )

    if (response?.ok) {
      const responseData = await response?.json()
      return NextResponse?.json(responseData?.data || responseData)
    } else {
      return NextResponse?.json(
        {
          success: false,
          message:
            'API backend non disponible - impossible de récupérer les détails de la migration',
        },
        { status: 503 }
      )
    }
  } catch (_error) {
    return NextResponse?.json(
      {
        success: false,
        message: 'Erreur interne - impossible de récupérer les détails de la migration',
      },
      { status: 500 }
    )
  }
}
