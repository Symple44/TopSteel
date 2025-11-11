import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '../../../../../utils/backend-api'

export async function GET(req: NextRequest) {
  try {
    // Appeler directement l'API backend via l'utilitaire harmonisé
    const response = await callBackendFromApi(req, 'admin/menu-raw/tree')

    const data = await response?.json()

    // Adapter la réponse pour correspondre au format attendu par le frontend
    if (data?.success && data?.data) {
      return NextResponse?.json({
        success: true,
        data: data.data,
      })
    }

    return NextResponse?.json(data, { status: response.status })
  } catch (error: unknown) {
    return NextResponse?.json(
      {
        success: false,
        message: (error as Error).message || 'Erreur serveur',
        data: [],
      },
      {
        status: 500,
      }
    )
  }
}
