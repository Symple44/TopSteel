import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '../../../../../../../utils/backend-api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableName: string }> }
) {
  const { tableName } = await params

  try {
    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url)
    const schema = searchParams?.get('schema') || 'public'

    // Appel au backend via l'utilitaire centralisé
    const response = await callBackendFromApi(
      request,
      `query-builder/schema/tables/${tableName}/columns?schema=${schema}`
    )

    if (!response?.ok) {
      return NextResponse?.json(
        { error: 'Failed to fetch columns from backend' },
        { status: response.status }
      )
    }

    const columns = await response?.json()
    return NextResponse?.json(columns)
  } catch (error) {
    return NextResponse?.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch columns' },
      { status: 500 }
    )
  }
}
