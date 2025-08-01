import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

export async function GET(request: NextRequest) {
  try {
    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url)
    const schema = searchParams.get('schema') || 'public'

    // Appel au backend via l'utilitaire centralisé
    const response = await callBackendFromApi(
      request,
      `query-builder/schema/tables?schema=${schema}`
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch tables from backend' },
        { status: response.status }
      )
    }

    const tables = await response.json()
    return NextResponse.json(tables)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Connection failed' },
      { status: 503 }
    )
  }
}
