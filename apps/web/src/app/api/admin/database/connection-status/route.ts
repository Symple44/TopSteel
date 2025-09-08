import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

export async function GET(request: NextRequest) {
  try {
    // Proxy vers l'API backend

    const response = await callBackendFromApi(request, 'admin/database/connection-status', {
      method: 'GET',
    })

    if (!response?.ok) {
      return NextResponse?.json(
        { success: false, error: "Erreur lors de l'appel à l'API" },
        { status: response.status }
      )
    }

    const responseData = await response?.json()
    // L'API NestJS retourne { data: { success, data }, statusCode, message, timestamp }
    // On extrait juste la partie data.data
    return NextResponse?.json(responseData?.data || responseData)
  } catch (_error) {
    // Retourner des données mock si l'API n'est pas disponible
    const mockStatus = {
      success: true,
      data: {
        connected: false,
        error: 'API backend non disponible - utilisation des données mock',
        version: 'Mock Database v1.0',
      },
    }

    return NextResponse?.json(mockStatus)
  }
}
