import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

export async function POST(request: NextRequest) {
  try {
    // Proxy vers l'API backend

    const response = await callBackendFromApi(request, 'admin/database/migrations/run', {
      method: 'POST',
    })

    if (!response.ok) {
      // Simuler une réponse d'erreur
      return NextResponse.json(
        {
          success: false,
          message: "API backend non disponible - impossible d'exécuter les migrations",
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
        message: "Erreur interne - impossible d'exécuter les migrations",
      },
      { status: 500 }
    )
  }
}
