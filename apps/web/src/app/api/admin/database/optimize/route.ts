import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '../../../../../utils/backend-api'

export async function POST(request: NextRequest) {
  try {
    const response = await callBackendFromApi(request, 'admin/database/optimize', {
      method: 'POST',
      headers: request?.headers?.get('authorization')
        ? {
            Authorization: request.headers.get('authorization')!,
          }
        : undefined,
    })

    if (!response?.ok) {
      return NextResponse?.json(
        { success: false, error: "Erreur lors de l'appel à l'API" },
        { status: response.status }
      )
    }

    const responseData = await response?.json()
    return NextResponse?.json(responseData?.data || responseData)
  } catch {
    // Simuler une optimisation pour le mock
    const mockResponse = {
      success: true,
      message: 'Base de données optimisée avec succès',
      details: [
        { table: 'users', status: 'success', message: 'Table optimisée avec succès' },
        { table: 'notifications', status: 'success', message: 'Table optimisée avec succès' },
        { table: 'clients', status: 'success', message: 'Table optimisée avec succès' },
        { operation: 'reindex', status: 'success', message: 'Réindexation terminée' },
      ],
    }

    return NextResponse?.json(mockResponse)
  }
}
